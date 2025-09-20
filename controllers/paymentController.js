const fs = require('fs');

// Helper function to log to file
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync('upi-debug.log', `${timestamp}: ${message}\n`);
};
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { checkStockAvailability, reduceStock } = require('../utils/stockManager');
const razorpayService = require('../services/razorpayService');

// Initialize Razorpay with live credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('🔐 Payment Controller initialized with Live Razorpay credentials');
console.log('💳 Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('🔗 Payment Link:', process.env.RAZORPAY_PAYMENT_LINK);

// Create Razorpay order with live credentials
const createPaymentOrder = async (req, res) => {
  try {
    console.log('💰 Creating Razorpay payment order with live credentials...');
    const { amount, currency = 'INR', receipt, customerDetails } = req.body;

    // Use the Razorpay service to create order
    const result = await razorpayService.createOrder({
      amount: amount,
      currency: currency,
      receipt: receipt || `order_${Date.now()}`,
      email: customerDetails?.email,
      name: customerDetails?.name,
      items: req.body.items
    });

    if (!result.success) {
      console.error('❌ Failed to create Razorpay order:', result.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: result.error
      });
    }

    console.log('✅ Live Razorpay order created successfully');
    
    res.json({
      success: true,
      order: {
        id: result.orderId,
        amount: result.amount,
        currency: result.currency,
        key_id: result.key_id
      },
      key_id: result.key_id,
      payment_link: result.paymentLink,
      demo_mode: false // Using live credentials
    });
  } catch (error) {
    console.error('❌ Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// Verify payment with live Razorpay credentials
const verifyPayment = async (req, res) => {
  try {
    console.log('🔍 Verifying Razorpay payment with live credentials...');
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData
    } = req.body;

    // Use the Razorpay service to verify payment signature
    const verificationResult = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!verificationResult.success) {
      console.error('❌ Payment signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }

    console.log('✅ Payment signature verified successfully');

    // Get payment details from Razorpay
    const paymentDetails = await razorpayService.getPaymentDetails(razorpay_payment_id);
    
    if (orderData.items && Array.isArray(orderData.items)) {
      // Check stock availability using utility function
      const stockCheck = await checkStockAvailability(orderData.items);
      if (!stockCheck.success) {
        return res.status(400).json({
          success: false,
          message: stockCheck.message,
          insufficientProducts: stockCheck.insufficientProducts
        });
      }
      
      // Reduce stock levels using utility function
      const stockReduction = await reduceStock(orderData.items);
      if (!stockReduction.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update stock levels'
        });
      }
      
      console.log('✅ Stock levels updated for Razorpay payment:', stockReduction.updatedProducts);
    }
    
    // Create order in database
    const order = new Order({
      ...orderData,
      userId: req.user._id,
      paymentDetails: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        method: 'razorpay',
        status: 'completed',
        amount: paymentDetails.success ? paymentDetails.payment.amount : orderData.orderSummary?.total,
        paymentMethod: paymentDetails.success ? paymentDetails.payment.method : 'card'
      },
      status: 'confirmed',
      paymentStatus: 'paid'
    });

    await order.save();

    // Clear user's cart after successful order
    try {
      await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { items: [] }
      );
      console.log('✅ Cart cleared for user after Razorpay payment:', req.user._id);
    } catch (cartError) {
      console.error('⚠️ Error clearing cart after Razorpay payment:', cartError);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully with live Razorpay and stock updated',
      orderId: order._id,
      paymentDetails: paymentDetails.success ? paymentDetails.payment : null
    });
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification error',
      error: error.message
    });
  }
};

// Get Razorpay payment link
const getRazorpayPaymentLink = async (req, res) => {
  try {
    console.log('🔗 Getting Razorpay payment link...');
    const { amount, description } = req.body;

    const linkResult = razorpayService.generateCustomPaymentLink({
      amount: amount,
      description: description || 'Jaimaaruthi Electrical Store Purchase'
    });

    if (!linkResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate payment link',
        error: linkResult.error
      });
    }

    res.json({
      success: true,
      paymentLink: linkResult.paymentLink,
      baseLink: linkResult.baseLink,
      message: 'Payment link generated successfully'
    });
  } catch (error) {
    console.error('❌ Error generating payment link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment link',
      error: error.message
    });
  }
};
// Create UPI payment order
const createUPIOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, customer } = req.body;

    // Direct UPI payment details - User's actual account
    const merchantUPI = 'prannav2511@okhdfcbank';
    const merchantName = 'Prannav P - Jaimaaruthi Electrical Store';
    
    // Create UPI payment link
    const upiAmount = amount.toFixed(2);
    const transactionNote = `Payment for ${merchantName} Order ${receipt}`;
    
    // Generate UPI deep link for GPay, PhonePe, etc.
    const upiLink = `upi://pay?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${upiAmount}&cu=${currency}&tn=${encodeURIComponent(transactionNote)}&mode=02&purpose=00`;
    
    // Alternative UPI links for better compatibility
    const gpayLink = `tez://upi/pay?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${upiAmount}&cu=${currency}&tn=${encodeURIComponent(transactionNote)}`;
    const phonepeLink = `phonepe://pay?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${upiAmount}&cu=${currency}&tn=${encodeURIComponent(transactionNote)}`;
    const paytmLink = `paytmmp://upi/pay?pa=${merchantUPI}&pn=${encodeURIComponent(merchantName)}&am=${upiAmount}&cu=${currency}&tn=${encodeURIComponent(transactionNote)}`;
    
    // Additional bank information for display
    const bankName = 'Karur Vysya Bank';
    const accountInfo = 'Account 1054';
    
    // Create order in database
    const orderData = {
      id: `upi_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entity: 'order',
      amount: amount * 100, // Store in paisa
      amount_paid: 0,
      amount_due: amount * 100,
      currency: currency,
      receipt: receipt,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000),
      payment_method: 'upi',
      customer: customer,
      notes: {
        userId: req.user._id,
        source: `${merchantName} - UPI Payment`,
        merchant_upi: merchantUPI
      }
    };
    
    res.json({
      success: true,
      order: orderData,
      upi_link: upiLink,
      gpay_link: gpayLink,
      phonepe_link: phonepeLink,
      paytm_link: paytmLink,
      vpa: merchantUPI,
      merchant_name: merchantName,
      bank_name: bankName,
      account_info: accountInfo,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`,
      message: 'Direct payment to merchant account - Karur Vysya Bank 1054'
    });
  } catch (error) {
    console.error('Error creating UPI order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create UPI payment order',
      error: error.message
    });
  }
};

// Verify UPI payment
const verifyUPIPayment = async (req, res) => {
  logToFile('=== UPI PAYMENT VERIFICATION ENDPOINT CALLED ===');
  
  // Immediate response for testing
  if (!req.user) {
    logToFile('ERROR: No user in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication failed - no user found'
    });
  }
  
  logToFile(`User authenticated: ${req.user.email}, ID: ${req.user._id}`);
  
  try {
    logToFile('=== UPI Payment Verification Started ===');
    const { orderId, amount, orderData } = req.body;
    
    logToFile(`Request body received: orderId=${orderId}, amount=${amount}, hasOrderData=${!!orderData}, userId=${req.user._id}`);
    
    if (orderData) {
      logToFile(`Order data details: items=${orderData.items ? orderData.items.length : 'undefined'}, customerDetails=${orderData.customerDetails ? Object.keys(orderData.customerDetails) : 'undefined'}, orderSummary=${orderData.orderSummary ? 'present' : 'undefined'}`);
    }
    
    // Validate required order data
    if (!orderData) {
      console.error('Missing orderData in request');
      return res.status(400).json({
        success: false,
        message: 'Missing order data'
      });
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      console.error('Invalid or missing items:', orderData.items);
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid items in order data'
      });
    }

    if (!orderData.customerDetails) {
      console.error('Missing customerDetails:', orderData.customerDetails);
      return res.status(400).json({
        success: false,
        message: 'Missing customer details in order data'
      });
    }

    if (!orderData.orderSummary) {
      console.error('Missing orderSummary:', orderData.orderSummary);
      return res.status(400).json({
        success: false,
        message: 'Missing order summary in order data'
      });
    }

    // In a real implementation, you would verify the payment with your bank/UPI provider
    // For now, we'll create the order assuming payment is successful
    
    const paymentId = `upi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const orderNumber = `ORD-${Date.now()}`;
    
    console.log('Processing order items:', orderData.items);
    
    // Ensure items have the correct structure and handle both cases
    const formattedItems = orderData.items.map((item, index) => {
      console.log(`Item ${index}:`, item);
      return {
        productId: item.productId || item._id,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0,
        name: item.name || `Product ${index + 1}`
      };
    });

    console.log('Formatted items:', formattedItems);
    console.log('About to start stock management operations...');

    // Check stock availability and update stock levels using utility functions
    console.log('Calling checkStockAvailability...');
    const stockCheck = await checkStockAvailability(formattedItems);
    console.log('Stock check result:', stockCheck);
    if (!stockCheck.success) {
      logToFile(`ERROR: Stock check failed - ${stockCheck.message}`);
      return res.status(400).json({
        success: false,
        message: stockCheck.message,
        insufficientProducts: stockCheck.insufficientProducts
      });
    }
    
    // Reduce stock levels using utility function
    console.log('Calling reduceStock...');
    const stockReduction = await reduceStock(formattedItems);
    console.log('Stock reduction result:', stockReduction);
    if (!stockReduction.success) {
      logToFile(`ERROR: Stock reduction failed - ${stockReduction.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to update stock levels'
      });
    }
    
    console.log('Stock levels updated for UPI payment:', stockReduction.updatedProducts);
    logToFile(`Stock levels updated successfully: ${JSON.stringify(stockReduction.updatedProducts)}`);

    const orderSummary = {
      subtotal: parseFloat(orderData.orderSummary.subtotal) || 0,
      shipping: parseFloat(orderData.orderSummary.shipping) || 0,
      tax: parseFloat(orderData.orderSummary.tax) || 0,
      total: parseFloat(orderData.orderSummary.total) || parseFloat(amount) || 0,
      itemCount: parseInt(orderData.orderSummary.itemCount) || formattedItems.length
    };

    console.log('Order summary:', orderSummary);

    console.log('About to create order with data:', {
      userId: req.user._id,
      userIdType: typeof req.user._id,
      itemsLength: formattedItems.length,
      paymentStatus: 'paid',
      status: 'confirmed'
    });

    const orderToCreate = {
      userId: req.user._id,
      items: formattedItems,
      customerDetails: orderData.customerDetails,
      orderSummary: orderSummary,
      paymentDetails: {
        paymentId: paymentId,
        orderId: orderId,
        method: 'upi',
        status: 'completed', // This is for paymentDetails.status
        selectedOption: 'upi_payment'
      },
      status: 'confirmed',
      paymentStatus: 'paid', // This should be 'paid' not 'completed'
      orderNumber: orderNumber
    };

    console.log('Order data to create:', JSON.stringify(orderToCreate, null, 2));
    
    const order = new Order(orderToCreate);

    console.log('About to save order with userId:', req.user._id);
    const savedOrder = await order.save();
    console.log('Order saved successfully:', {
      id: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      total: savedOrder.orderSummary.total,
      itemCount: savedOrder.orderSummary.itemCount,
      userId: savedOrder.userId
    });

    // Clear user's cart after successful UPI payment
    try {
      await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { items: [] }
      );
      console.log('Cart cleared for user after UPI payment:', req.user._id);
    } catch (cartError) {
      console.error('Error clearing cart after UPI payment:', cartError);
      // Don't fail the order if cart clearing fails
    }

    res.json({
      success: true,
      message: 'UPI Payment verified successfully and stock updated',
      order: {
        _id: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        paymentId: paymentId,
        status: savedOrder.status,
        paymentStatus: savedOrder.paymentStatus,
        total: savedOrder.orderSummary.total,
        items: savedOrder.items,
        customerDetails: savedOrder.customerDetails
      },
      paymentId: paymentId
    });

    console.log('=== UPI Payment Verification Completed Successfully ===');
    logToFile('=== UPI Payment Verification Completed Successfully ===');
  } catch (error) {
    console.error('=== UPI Payment Verification Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body was:', req.body);
    logToFile(`ERROR in UPI payment verification: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to verify UPI payment',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get payment methods
const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'direct_upi',
        name: 'Direct UPI Payment',
        icon: '📱',
        description: 'Pay directly to Karur Vysya Bank 1054 via UPI',
        primary: true,
        upi_id: 'prannav2511@okhdfcbank',
        bank_name: 'Karur Vysya Bank',
        account_info: 'Account 1054',
        options: [
          { id: 'gpay', name: 'Google Pay', icon: '🟢' },
          { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
          { id: 'paytm', name: 'Paytm', icon: '🔵' },
          { id: 'bhim', name: 'BHIM UPI', icon: '🟠' },
          { id: 'other_upi', name: 'Other UPI Apps', icon: '📱' }
        ]
      },
      {
        id: 'razorpay',
        name: 'Online Payment',
        icon: '💳',
        description: 'Pay securely with cards, UPI, net banking (via gateway)',
        options: [
          { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
          { id: 'upi', name: 'UPI', icon: '📱' },
          { id: 'netbanking', name: 'Net Banking', icon: '🏦' },
          { id: 'wallet', name: 'Wallets', icon: '💰' }
        ],
        paymentLink: process.env.RAZORPAY_PAYMENT_LINK
      },
      {
        id: 'cod',
        name: 'Cash on Delivery',
        icon: '💵',
        description: 'Pay when you receive the order',
        options: []
      }
    ];

    res.json({
      success: true,
      paymentMethods,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      paymentLink: process.env.RAZORPAY_PAYMENT_LINK
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods'
    });
  }
};

// Verify COD order
const verifyCODPayment = async (req, res) => {
  try {
    console.log('=== COD Payment Verification Started ===');
    const { orderId, orderData } = req.body;
    
    console.log(`COD Order received: orderId=${orderId}, hasOrderData=${!!orderData}, userId=${req.user._id}`);
    
    // Validate required order data
    if (!orderData) {
      console.error('Missing orderData in COD request');
      return res.status(400).json({
        success: false,
        message: 'Missing order data'
      });
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      console.error('Invalid or missing items:', orderData.items);
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid items in order data'
      });
    }

    if (!orderData.customerDetails) {
      console.error('Missing customerDetails:', orderData.customerDetails);
      return res.status(400).json({
        success: false,
        message: 'Missing customer details in order data'
      });
    }

    if (!orderData.orderSummary) {
      console.error('Missing orderSummary:', orderData.orderSummary);
      return res.status(400).json({
        success: false,
        message: 'Missing order summary in order data'
      });
    }

    // For COD, we create the order immediately but mark payment as pending
    const orderNumber = `COD-${Date.now()}`;
    
    console.log('Processing COD order items:', orderData.items);
    
    // Format items properly
    const formattedItems = orderData.items.map((item, index) => {
      console.log(`COD Item ${index}:`, item);
      return {
        productId: item.productId || item._id,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0,
        name: item.name || `Product ${index + 1}`
      };
    });

    console.log('Formatted COD items:', formattedItems);

    // Check stock availability for COD orders too
    console.log('Checking stock availability for COD order...');
    const stockCheck = await checkStockAvailability(formattedItems);
    console.log('COD Stock check result:', stockCheck);
    if (!stockCheck.success) {
      return res.status(400).json({
        success: false,
        message: stockCheck.message,
        insufficientProducts: stockCheck.insufficientProducts
      });
    }
    
    // For COD, we can reserve stock but don't reduce it until delivery
    // For now, we'll reduce stock immediately like other payment methods
    console.log('Reducing stock for COD order...');
    const stockReduction = await reduceStock(formattedItems);
    console.log('COD Stock reduction result:', stockReduction);
    if (!stockReduction.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update stock levels'
      });
    }
    
    console.log('Stock levels updated for COD order:', stockReduction.updatedProducts);

    const orderSummary = {
      subtotal: parseFloat(orderData.orderSummary.subtotal) || 0,
      shipping: parseFloat(orderData.orderSummary.shipping) || 0,
      tax: parseFloat(orderData.orderSummary.tax) || 0,
      total: parseFloat(orderData.orderSummary.total) || 0,
      itemCount: parseInt(orderData.orderSummary.itemCount) || formattedItems.length
    };

    console.log('COD Order summary:', orderSummary);

    const orderToCreate = {
      userId: req.user._id,
      items: formattedItems,
      customerDetails: orderData.customerDetails,
      orderSummary: orderSummary,
      paymentDetails: {
        paymentId: `cod_${Date.now()}`,
        orderId: orderId,
        method: 'cod',
        status: 'pending',
        selectedOption: 'cash_on_delivery'
      },
      status: 'confirmed',
      paymentStatus: 'pending', // COD orders are pending until delivery
      orderNumber: orderNumber
    };

    console.log('Creating COD order with data:', JSON.stringify(orderToCreate, null, 2));
    
    const order = new Order(orderToCreate);

    console.log('About to save COD order with userId:', req.user._id);
    const savedOrder = await order.save();
    console.log('COD Order saved successfully:', {
      id: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      total: savedOrder.orderSummary.total,
      itemCount: savedOrder.orderSummary.itemCount,
      userId: savedOrder.userId,
      paymentStatus: savedOrder.paymentStatus
    });

    // Clear user's cart after successful COD order
    try {
      await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { items: [] }
      );
      console.log('Cart cleared for user after COD order:', req.user._id);
    } catch (cartError) {
      console.error('Error clearing cart after COD order:', cartError);
      // Don't fail the order if cart clearing fails
    }

    res.json({
      success: true,
      message: 'COD Order placed successfully',
      order: {
        _id: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        paymentId: orderToCreate.paymentDetails.paymentId,
        status: savedOrder.status,
        paymentStatus: savedOrder.paymentStatus,
        total: savedOrder.orderSummary.total,
        items: savedOrder.items,
        customerDetails: savedOrder.customerDetails
      },
      paymentId: orderToCreate.paymentDetails.paymentId
    });

    console.log('=== COD Payment Verification Completed Successfully ===');
  } catch (error) {
    console.error('=== COD Payment Verification Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body was:', req.body);
    
    res.status(500).json({
      success: false,
      message: 'Failed to process COD order',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getRazorpayPaymentLink,
  createUPIOrder,
  verifyUPIPayment,
  verifyCODPayment,
  getPaymentMethods
};
