const OpenAI = require('openai');

// Initialize OpenAI client safely
let openai = null;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (openaiApiKey && openaiApiKey !== 'your_openai_api_key_here_replace_with_actual_key') {
  try {
    openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    console.log('✅ ChatGPT integration initialized successfully');
  } catch (error) {
    console.warn('⚠️ OpenAI initialization failed:', error.message);
  }
} else {
  console.warn('⚠️ OpenAI API key not configured. Chatbot will use fallback responses.');
}

// Store context about the electrical store
const STORE_CONTEXT = `
You are an AI assistant for Jaimaruthi Electrical and Hardware Store, a trusted electrical supplies retailer.

STORE INFORMATION:
- Name: Jaimaruthi Electrical and Hardware Store
- Phone: +91 8838686407
- Email: info.jaimaaruthi@gmail.com
- Address: 275 - A, Opposite to Essar Petrol Bunk, Veppampalayam Pirivu, Mettukadai-638107
- Hours: Monday to Sunday, 8:30 AM to 8:30 PM

PRODUCT CATEGORIES:
- Switches & Sockets (Modular switches, traditional switches, dimmer switches)
- LED Lights & Bulbs (LED panels, tube lights, bulbs, street lights)
- Ceiling Fans & Motors (table fans, exhaust fans, pedestal fans, motor pumps)
- Wiring & Cables (house wires, armored cables, coaxial cables)
- MCBs & Protection (miniature circuit breakers, ELCBs, distribution boards)
- Electrical Tools (screwdrivers, testers, pliers, multimeters)
- Hardware Items (screws, bolts, electrical boxes, conduits)

SERVICES:
- Product consultation and recommendations
- Installation services available
- Bulk orders and contractor rates
- Home delivery services
- Technical support

Your role is to:
1. Help customers find the right electrical products
2. Provide technical guidance and product information
3. Share store policies, pricing, and availability
4. Direct customers to contact the store for specific needs
5. Be helpful, professional, and knowledgeable about electrical products

Always be helpful, professional, and friendly. If you don't know something specific, guide customers to contact the store directly.
`;

// Fallback responses when OpenAI is not available
const getFallbackResponse = (message) => {
  const msg = message.toLowerCase();
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hello! Welcome to Jaimaruthi Electrical & Hardware Store! 

I'm here to help you with electrical products and services. While our AI assistant is currently being configured, I can still provide you with basic information.

📞 Call us: +91 8838686407
📧 Email: info.jaimaaruthi@gmail.com
📍 Address: 275 - A, Opposite to Essar Petrol Bunk, Veppampalayam Pirivu, Mettukadai-638107

How can I assist you today?`;
  }
  
  if (msg.includes('product') || msg.includes('switch') || msg.includes('light') || msg.includes('electrical')) {
    return `We offer a wide range of electrical products including:
    
🔌 Switches & Sockets
💡 LED Lights & Bulbs  
🌪️ Ceiling Fans & Motors
🔧 Wiring & Cables
⚡ MCBs & Protection Devices
🛠️ Electrical Tools

For detailed product information and pricing, please:
📞 Call: +91 8838686407
📧 Email: info.jaimaaruthi@gmail.com

Our experts are ready to help you find the right products!`;
  }
  
  if (msg.includes('contact') || msg.includes('phone') || msg.includes('address')) {
    return `📞 Contact Information:

Phone: +91 8838686407
Email: info.jaimaaruthi@gmail.com
WhatsApp: +91 8838686407

📍 Address:
275 - A, Opposite to Essar Petrol Bunk
Veppampalayam Pirivu, Mettukadai-638107

🕒 Hours:
Monday to Sunday: 8:30 AM - 8:30 PM

We're here to serve you with quality electrical products!`;
  }
  
  if (msg.includes('price') || msg.includes('cost') || msg.includes('rate')) {
    return `For current pricing and special offers:

📞 Call us: +91 8838686407
📧 Email: info.jaimaaruthi@gmail.com

We offer:
✅ Competitive pricing
✅ Bulk discounts available
✅ Special rates for contractors
✅ Quality assured products

Contact us for a personalized quote!`;
  }
  
  return `Thank you for contacting Jaimaruthi Electrical & Hardware Store!

While our AI assistant is being set up, please contact us directly:

📞 Phone: +91 8838686407
📧 Email: info.jaimaaruthi@gmail.com
💬 WhatsApp: +91 8838686407

🕒 Business Hours: Monday to Sunday, 8:30 AM - 8:30 PM
📍 Address: 275 - A, Opposite to Essar Petrol Bunk, Veppampalayam Pirivu, Mettukadai-638107

Our team is ready to help you with all your electrical needs!`;
};

// Main chat function
const chatWithGPT = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a string'
      });
    }

    // Check if OpenAI is available
    if (!openai) {
      // Fallback response when OpenAI is not configured
      const fallbackResponse = getFallbackResponse(message);
      return res.json({
        success: true,
        response: fallbackResponse,
        fallback: true,
        message: 'Using fallback response - OpenAI API key not configured'
      });
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: STORE_CONTEXT
      },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const response = completion.choices[0].message.content;

    res.json({
      success: true,
      response: response,
      usage: {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      }
    });

  } catch (error) {
    console.error('ChatGPT Error:', error);

    let errorMessage = 'I apologize, but I\'m experiencing technical difficulties right now.';
    
    if (error.code === 'insufficient_quota') {
      errorMessage = 'I\'m currently at capacity. Please contact our support team directly.';
    } else if (error.code === 'rate_limit_exceeded') {
      errorMessage = 'I\'m experiencing high demand right now. Please wait a moment and try again.';
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'AI service is temporarily unavailable. Please contact our support team.';
    }

    // Return fallback response on error
    const fallbackResponse = getFallbackResponse(req.body.message);
    
    res.json({
      success: true,
      response: `${errorMessage}

${fallbackResponse}`,
      fallback: true,
      error: error.message
    });
  }
};

// Get chatbot info and status
const getChatbotInfo = (req, res) => {
  res.json({
    success: true,
    service: 'Jaimaruthi Electrical Store Chatbot',
    version: '1.0.0',
    aiEnabled: !!openai,
    store: {
      name: 'Jaimaruthi Electrical and Hardware Store',
      phone: '+91 8838686407',
      email: 'info.jaimaaruthi@gmail.com',
      address: '275 - A, Opposite to Essar Petrol Bunk, Veppampalayam Pirivu, Mettukadai-638107',
      hours: 'Monday to Sunday, 8:30 AM - 8:30 PM'
    }
  });
};

module.exports = {
  chatWithGPT,
  getChatbotInfo
};