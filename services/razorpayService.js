const Razorpay = require('razorpay');
const crypto = require('crypto');

class RazorpayService {
  constructor() {
    console.log('🔐 Initializing Razorpay with Live credentials...');
    
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    
    this.paymentLink = process.env.RAZORPAY_PAYMENT_LINK;
    
    console.log('✅ Razorpay Live service initialized');
    console.log('💳 Payment Link:', this.paymentLink);
  }

  // Create a payment order
  async createOrder(orderData) {
    try {
      console.log('💰 Creating Razorpay order:', orderData);
      
      const options = {
        amount: Math.round(orderData.amount * 100), // Amount in paise
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          customer_email: orderData.email,
          customer_name: orderData.name,
          order_items: JSON.stringify(orderData.items || [])
        }
      };

      const order = await this.razorpay.orders.create(options);
      
      console.log('✅ Razorpay order created:', {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        paymentLink: this.paymentLink
      };
    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment signature
  verifyPaymentSignature(paymentData) {
    try {
      console.log('🔍 Verifying payment signature...');
      
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
      
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;
      
      console.log('🔐 Payment signature verification:', isAuthentic ? 'SUCCESS' : 'FAILED');
      
      return {
        success: isAuthentic,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      };
    } catch (error) {
      console.error('❌ Error verifying payment signature:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    try {
      console.log('📋 Fetching payment details for:', paymentId);
      
      const payment = await this.razorpay.payments.fetch(paymentId);
      
      console.log('✅ Payment details retrieved:', {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        method: payment.method
      });

      return {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount / 100, // Convert from paise to rupees
          status: payment.status,
          method: payment.method,
          email: payment.email,
          contact: payment.contact,
          created_at: payment.created_at
        }
      };
    } catch (error) {
      console.error('❌ Error fetching payment details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate payment link for specific order
  generateCustomPaymentLink(orderData) {
    try {
      const amount = Math.round(orderData.amount * 100); // Convert to paise
      const description = encodeURIComponent(orderData.description || 'Jaimaaruthi Electrical Store Purchase');
      
      // Custom payment link with order details
      const customLink = `${this.paymentLink}?amount=${amount}&description=${description}`;
      
      console.log('🔗 Generated custom payment link:', customLink);
      
      return {
        success: true,
        paymentLink: customLink,
        baseLink: this.paymentLink
      };
    } catch (error) {
      console.error('❌ Error generating payment link:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new RazorpayService();
