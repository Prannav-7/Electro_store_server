const nodemailer = require('nodemailer');

// Create a contact form submission handler
const submitContactForm = async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // For now, just log the contact form submission
    // In production, you would integrate with an email service
    console.log('Contact Form Submission:', {
      fullName,
      email,
      phone,
      subject,
      message,
      timestamp: new Date().toISOString()
    });

    // Simulate email sending (replace with actual email service)
    // You can integrate with services like SendGrid, Nodemailer with Gmail, etc.
    
    res.status(200).json({
      success: true,
      message: 'Thank you for your inquiry! We will get back to you soon.',
      data: {
        submittedAt: new Date().toISOString(),
        confirmationId: Date.now().toString()
      }
    });

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

module.exports = {
  submitContactForm,
  getContactInfo
};
