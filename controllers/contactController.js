const { sendContactFormEmail, sendChatbotInquiryEmail } = require('../services/emailService');

// Create a contact form submission handler
const submitContactForm = async (req, res) => {
  try {
    const { fullName, name, email, phone, subject, message } = req.body;
    
    // Use fullName or name, whichever is provided
    const customerName = fullName || name;

    // Validate required fields
    if (!customerName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (name, email, and message)'
      });
    }

    // Prepare contact data
    const contactData = {
      name: customerName,
      email,
      phone,
      subject,
      message
    };

    console.log('Contact Form Submission:', {
      ...contactData,
      timestamp: new Date().toISOString()
    });

    // Send email automatically with fallback handling
    const emailResult = await sendContactFormEmail(contactData);
    
    if (emailResult.success) {
      console.log('✅ Contact form processed successfully:', emailResult.messageId);
      
      let responseMessage = 'Thank you for your inquiry! ';
      if (emailResult.method === 'SMTP') {
        responseMessage += 'Your message has been sent to our team via email. We will get back to you soon.';
      } else if (emailResult.method === 'FALLBACK_LOG') {
        responseMessage += 'Your message has been received and logged. Our team will review it and get back to you soon.';
      } else {
        responseMessage += 'We have received your message and will get back to you soon.';
      }
      
      res.status(200).json({
        success: true,
        message: responseMessage,
        data: {
          submittedAt: new Date().toISOString(),
          confirmationId: Date.now().toString(),
          emailSent: emailResult.method === 'SMTP',
          messageId: emailResult.messageId,
          method: emailResult.method || 'PROCESSED'
        }
      });
    } else {
      console.error('❌ Failed to process contact form:', emailResult.error);
      
      // Still return success to user, but log the failure
      res.status(200).json({
        success: true,
        message: 'Thank you for your inquiry! We have received your message and will get back to you soon.',
        data: {
          submittedAt: new Date().toISOString(),
          confirmationId: Date.now().toString(),
          emailSent: false,
          emailError: emailResult.error
        }
      });
    }

  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again.',
      error: error.message
    });
  }
};

// Get contact information
const getContactInfo = async (req, res) => {
  try {
    res.json({
      success: true,
      contact: {
        email: 'info.jaimaaruthi@gmail.com',
        phone: '+91 8838686407',
        whatsapp: '+91 8838686407',
        address: '275 - A, Opposite to Essar Petrol Bunk, Veppampalayam Pirivu, Mettukadai-638107',
        businessHours: 'Monday to Sunday, 8:30 AM - 8:30 PM',
        name: 'Jai Maruthi Electricals & Hardware Store'
      }
    });
  } catch (error) {
    console.error('Error fetching contact info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact information',
      error: error.message
    });
  }
};

// Handle chatbot inquiry submission
const submitChatbotInquiry = async (req, res) => {
  try {
    const { name, email, phone, inquiry, context } = req.body;

    // Validate required fields
    if (!name || !email || !inquiry) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and inquiry details'
      });
    }

    // Prepare inquiry data
    const inquiryData = {
      name,
      email,
      phone,
      inquiry,
      context: context || 'chatbot',
      timestamp: new Date().toISOString()
    };

    console.log('Chatbot Inquiry Submission:', inquiryData);

    // Try to send email notification
    try {
      const emailResult = await sendChatbotInquiryEmail(inquiryData);
      console.log('✅ Chatbot inquiry email sent successfully:', emailResult.messageId);
      
      return res.json({
        success: true,
        message: 'Thank you for your inquiry! Our team will contact you shortly.',
        data: {
          submittedAt: inquiryData.timestamp,
          confirmationId: Date.now().toString(),
          method: 'email',
          messageId: emailResult.messageId,
          emailSent: true
        }
      });
    } catch (emailError) {
      console.error('❌ Failed to send chatbot inquiry email:', emailError.message);
      
      // Log to fallback system
      console.log('💾 Logging inquiry to fallback system:', inquiryData);
      
      return res.json({
        success: true,
        message: 'Thank you for your inquiry! We have received it and will contact you shortly.',
        data: {
          submittedAt: inquiryData.timestamp,
          confirmationId: Date.now().toString(),
          method: 'fallback',
          emailSent: false,
          note: 'Inquiry logged for manual follow-up'
        }
      });
    }
  } catch (error) {
    console.error('Error submitting chatbot inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry. Please try again.',
      error: error.message
    });
  }
};

module.exports = {
  submitContactForm,
  getContactInfo,
  submitChatbotInquiry
};
