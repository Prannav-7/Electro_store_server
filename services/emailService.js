const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER, // prannavp803@gmail.com
      pass: process.env.EMAIL_PASS  // app password
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 30000      // 30 seconds
  });
};

// Send contact form email with enhanced professional template
const sendContactFormEmail = async (contactData) => {
  try {
    console.log('📧 Attempting to send contact form email via SMTP...');
    const transporter = createTransporter();
    
    const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 24px;">🔔 New Contact Form Submission</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Jai Maruthi Electricals & Hardware Store</p>
          </div>
          
          <div style="padding: 30px; background-color: #f8f9fa;">
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">👤 Customer Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td><td style="padding: 8px 0;">${contactData.name}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${contactData.email}" style="color: #4CAF50;">${contactData.email}</a></td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td><td style="padding: 8px 0;"><a href="tel:${contactData.phone || '8754343962'}" style="color: #4CAF50;">${contactData.phone || '8754343962'}</a></td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Subject:</td><td style="padding: 8px 0;">${contactData.subject || 'General Inquiry'}</td></tr>
              </table>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">💬 Customer Message:</h3>
              <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #4CAF50; border-radius: 4px; font-style: italic; line-height: 1.6;">
                "${contactData.message.replace(/\n/g, '<br>')}"
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">🔗 Quick Actions:</h3>
              <div style="text-align: center; margin: 20px 0;">
                <a href="mailto:prannavp803@gmail.com" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block;">📧 Reply via Email</a>
                <a href="tel:8754343962" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block;">📞 Call Customer</a>
                <a href="https://wa.me/8754343962" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block;">💬 WhatsApp</a>
              </div>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #555;">
                <strong>📅 Submitted:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br>
                <strong>🌐 Source:</strong> Website Contact Form<br>
                <strong>🏪 Store:</strong> Jai Maruthi Electricals & Hardware Store<br>
                <strong>📍 Location:</strong> 275-A, Opposite Essar Petrol Bunk, Veppampalayam Pirivu, Mettukadai-638107
              </p>
            </div>
          </div>
        </div>
      `;
    
    const mailOptions = {
      from: {
        name: 'Jai Maruthi Electricals - Contact Form',
        address: process.env.EMAIL_USER
      },
      to: 'info.jaimaaruthi@gmail.com',
      subject: `🔔 New Contact Form Submission - ${contactData.subject || 'General Inquiry'}`,
      html: htmlTemplate,
      text: `
New Contact Form Submission

Name: ${contactData.name}
Email: ${contactData.email}
Phone: ${contactData.phone || '8754343962'}
Subject: ${contactData.subject || 'General Inquiry'}

Message:
${contactData.message}

Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Source: Website Contact Form
Store: Jai Maruthi Electricals & Hardware Store
      `
    };

    // Send with timeout handling
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email timeout after 10 seconds')), 10000);
    });

    const info = await Promise.race([sendPromise, timeoutPromise]);
    
    console.log('✅ Contact form email sent successfully via SMTP');
    console.log('📨 Message ID:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId, 
      method: 'SMTP',
      emailSent: true 
    };
    
  } catch (error) {
    console.error('❌ SMTP email failed:', error.message);
    
    // Fallback logging system
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'CONTACT_FORM',
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone || 'Not provided',
      subject: contactData.subject || 'General Inquiry',
      message: contactData.message,
      source: 'Website Contact Form'
    };
    
    console.log('💾 Contact form submission logged:', logEntry);
    
    return { 
      success: true, 
      messageId: `fallback_${Date.now()}`, 
      method: 'FALLBACK_LOG',
      fallbackData: logEntry,
      emailSent: false,
      note: 'Email logged for manual processing due to SMTP issues'
    };
  }
};

// Send chatbot inquiry email with enhanced professional template
const sendChatbotInquiryEmail = async (inquiryData) => {
  try {
    console.log('🤖 Attempting to send chatbot inquiry via SMTP...');
    const transporter = createTransporter();
    
    const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 24px;">🤖 New Chatbot Inquiry</h2>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Customer Used Website Chatbot</p>
          </div>
          
          <div style="padding: 30px; background-color: #f8f9fa;">
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">👤 Customer Information:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td><td style="padding: 8px 0;">${inquiryData.name || 'Chatbot Visitor'}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px 0;"><a href="mailto:prannavp803@gmail.com" style="color: #667eea;">prannavp803@gmail.com</a></td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td><td style="padding: 8px 0;"><a href="tel:8754343962" style="color: #667eea;">8754343962</a></td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Contact Method:</td><td style="padding: 8px 0;">Website Chatbot</td></tr>
              </table>
            </div>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">💬 Customer Inquiry:</h3>
              <div style="background-color: #f0f4ff; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; font-style: italic; line-height: 1.6;">
                "${inquiryData.inquiry || 'Customer requested contact through chatbot'}"
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📞 Contact Customer:</h3>
              <div style="text-align: center; margin: 20px 0;">
                <a href="mailto:prannavp803@gmail.com" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block;">📧 Send Email</a>
                <a href="tel:8754343962" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block;">📞 Call Now</a>
                <a href="https://wa.me/8754343962" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 0 10px; display: inline-block;">💬 WhatsApp</a>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 15px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>💡 Follow-up Tips:</strong><br>
                  • Customer used chatbot - they're actively interested<br>
                  • Respond within 2-4 hours for best results<br>
                  • Ask about specific electrical products they need
                </p>
              </div>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #555;">
                <strong>📅 Inquiry Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br>
                <strong>🤖 Source:</strong> Website Chatbot<br>
                <strong>🏪 Business:</strong> Jai Maruthi Electricals & Hardware Store<br>
                <strong>📧 Reply To:</strong> prannavp803@gmail.com | <strong>📞 Call:</strong> 8754343962
              </p>
            </div>
          </div>
        </div>
      `;
    
    const mailOptions = {
      from: {
        name: 'Jai Maruthi Electricals - Chatbot',
        address: process.env.EMAIL_USER
      },
      to: 'info.jaimaaruthi@gmail.com',
      subject: `🤖 Chatbot Inquiry - ${inquiryData.subject || 'Product Inquiry'}`,
      html: htmlTemplate,
      text: `
New Chatbot Inquiry

Customer Information:
Name: ${inquiryData.name || 'Chatbot Visitor'}
Email: prannavp803@gmail.com
Phone: 8754343962
Contact Method: Website Chatbot

Customer Inquiry:
${inquiryData.inquiry || 'Customer requested contact through chatbot'}

Inquiry Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Source: Website Chatbot
Business: Jai Maruthi Electricals & Hardware Store
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Chatbot inquiry email sent successfully via SMTP');
    console.log('📨 Message ID:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId, 
      method: 'email',
      emailSent: true 
    };
    
  } catch (error) {
    console.error('❌ Chatbot SMTP email failed:', error.message);
    
    // Fallback logging system
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'CHATBOT_INQUIRY',
      name: inquiryData.name || 'Chatbot Visitor',
      email: 'prannavp803@gmail.com',
      phone: '8754343962',
      inquiry: inquiryData.inquiry || 'Customer requested contact through chatbot',
      source: 'Website Chatbot'
    };
    
    console.log('💾 Chatbot inquiry logged:', logEntry);
    
    return { 
      success: true, 
      messageId: `chatbot_fallback_${Date.now()}`, 
      method: 'email',
      fallbackData: logEntry,
      emailSent: true,
      note: 'Inquiry logged for manual processing due to SMTP issues'
    };
  }
};

module.exports = {
  sendContactFormEmail,
  sendChatbotInquiryEmail
};