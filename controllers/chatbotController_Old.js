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

Store Information:
- Name: Jaimaruthi Electrical and Hardware Store
- Contact: +91 8838686407
- Email: info.jaimaaruthi@gmail.com
- Specializes in: Electrical goods, hardware tools, wiring cables, switches, sockets, lighting solutions, fans, motors, safety equipment

Product Categories:
- Electrical Goods
- Hardware & Tools
- Wiring & Cables
- Switches & Sockets
- Lighting Solutions
- Fans & Ventilation
- Electrical Motors
- Safety Equipment
- Building Materials
- Plumbing Supplies
- Paint & Finishes
- Steel & Metal Products
- Pipes & Fittings
- Power Tools
- Hand Tools

Services:
- Free delivery on orders above ₹2000
- Product installation guidance
- Technical support
- Bulk order discounts
- Quality assurance with ISI certified products

Your role:
1. Help customers find the right electrical products
2. Provide technical specifications and guidance
3. Explain installation procedures (basic guidance only, recommend professional for complex work)
4. Answer questions about electrical safety
5. Assist with product comparisons and recommendations
6. Handle order inquiries and store information
7. Be helpful, professional, and knowledgeable about electrical products

Always prioritize customer safety and recommend professional electrician services for complex electrical work.
`;

// Chat with OpenAI GPT
const chatWithGPT = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a string'
      });
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: STORE_CONTEXT
      },
      // Include conversation history (last 10 messages to manage token usage)
      ...conversationHistory.slice(-10),
      {
        role: 'user',
        content: message
      }
    ];

    console.log('=== CHATBOT API CALL ===');
    console.log('User message:', message);
    console.log('Conversation history length:', conversationHistory.length);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const aiResponse = completion.choices[0].message.content;

    console.log('AI response:', aiResponse);

    res.json({
      success: true,
      response: aiResponse,
      usage: {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      }
    });

  } catch (error) {
    console.error('Chatbot API error:', error);

    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({
        success: false,
        message: 'AI service temporarily unavailable. Please try again later.',
        error: 'quota_exceeded'
      });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        success: false,
        message: 'AI service configuration error. Please contact support.',
        error: 'authentication_failed'
      });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait a moment and try again.',
        error: 'rate_limit'
      });
    }

    // General error response
    res.status(500).json({
      success: false,
      message: 'Sorry, I\'m having trouble responding right now. Please try again in a moment.',
      error: 'internal_error'
    });
  }
};

// Get chatbot status and store information
const getChatbotInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        storeName: 'Jaimaruthi Electrical and Hardware Store',
        contact: '+91 8838686407',
        email: 'info.jaimaaruthi@gmail.com',
        features: [
          'Product recommendations',
          'Technical support',
          'Installation guidance',
          'Safety information',
          'Order assistance'
        ],
        aiModel: 'GPT-3.5 Turbo',
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Chatbot info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chatbot information'
    });
  }
};

module.exports = {
  chatWithGPT,
  getChatbotInfo
};