const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // For Gmail (you can also use other email providers)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com', // Your Gmail address
      pass: process.env.EMAIL_PASS || 'your-app-password'     // Your Gmail App Password
    }
  });

  // Alternative configuration for custom SMTP
  /*
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  */
};

// Welcome email template
const getWelcomeEmailTemplate = (userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .email-container {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 10px;
            }
            .header {
                background-color: #4CAF50;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                padding: 30px 20px;
                background-color: #f9f9f9;
            }
            .footer {
                background-color: #333;
                color: white;
                padding: 15px;
                text-align: center;
                border-radius: 0 0 10px 10px;
                font-size: 12px;
            }
            .button {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Welcome to Jai Maruthi Electricals!</h1>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                <p>Thank you for registering with Jai Maruthi Electricals & Hardware Store. We're excited to have you as part of our community!</p>
                
                <p>Your account has been successfully created. You can now:</p>
                <ul>
                    <li>Browse our wide range of electrical and hardware products</li>
                    <li>Add items to your cart and place orders</li>
                    <li>Track your orders and delivery status</li>
                    <li>Manage your account and preferences</li>
                </ul>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                
                <center>
                    <a href="http://localhost:3001" class="button">Start Shopping</a>
                </center>
                
                <p>Best regards,<br>
                The Jai Maruthi Electricals Team</p>
            </div>
            <div class="footer">
                <p>© 2025 Jai Maruthi Electricals & Hardware Store. All rights reserved.</p>
                <p>275 - A, Opposite to Essar Petrol Bunk, Veppampalayam Pirivu, Mettukadai-638107</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Jai Maruthi Electricals',
        address: process.env.EMAIL_USER || 'your-email@gmail.com'
      },
      to: userEmail,
      subject: 'Welcome to Jai Maruthi Electricals & Hardware Store! 🎉',
      html: getWelcomeEmailTemplate(userName),
      text: `Hello ${userName}!\n\nWelcome to Jai Maruthi Electricals & Hardware Store! Your account has been successfully created.\n\nThank you for joining us!\n\nBest regards,\nThe Jai Maruthi Electricals Team`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, resetToken, userName) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `http://localhost:3001/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Jai Maruthi Electricals',
        address: process.env.EMAIL_USER || 'your-email@gmail.com'
      },
      to: userEmail,
      subject: 'Password Reset Request - Jai Maruthi Electricals',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>You requested a password reset for your Jai Maruthi Electricals account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The Jai Maruthi Electricals Team</p>
        </div>
      `,
      text: `Hello ${userName},\n\nYou requested a password reset. Visit: ${resetUrl}\n\nThis link expires in 1 hour.\n\nBest regards,\nThe Jai Maruthi Electricals Team`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (userEmail, userName, orderDetails) => {
  try {
    const transporter = createTransporter();
    
    const itemsList = orderDetails.items.map(item => 
      `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toLocaleString()}</td>
      </tr>`
    ).join('');
    
    const mailOptions = {
      from: {
        name: 'Jai Maruthi Electricals',
        address: process.env.EMAIL_USER || 'your-email@gmail.com'
      },
      to: userEmail,
      subject: `Order Confirmation - #${orderDetails.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Confirmation</h2>
          <p>Hello ${userName},</p>
          <p>Thank you for your order! We've received your order and it's being processed.</p>
          
          <h3>Order Details:</h3>
          <p><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
          
          <h3>Items Ordered:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>Subtotal: ₹${orderDetails.subtotal.toLocaleString()}</strong></p>
            <p style="margin: 5px 0;"><strong>Tax: ₹${orderDetails.tax.toLocaleString()}</strong></p>
            <p style="margin: 5px 0;"><strong>Shipping: ${orderDetails.shipping === 0 ? 'FREE' : '₹' + orderDetails.shipping}</strong></p>
            <p style="margin: 10px 0; font-size: 18px;"><strong>Total: ₹${orderDetails.total.toLocaleString()}</strong></p>
          </div>
          
          <p>We'll send you another email with tracking information once your order ships.</p>
          <p>Best regards,<br>The Jai Maruthi Electricals Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail
};