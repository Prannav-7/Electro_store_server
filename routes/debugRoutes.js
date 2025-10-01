const express = require('express');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Test endpoint to create a sample order
router.post('/test-order', authMiddleware, async (req, res) => {
  try {
    console.log('Creating test order for user:', req.user._id);
    
    const testOrder = new Order({
      userId: req.user._id,
      items: [
        {
          productId: '67849ed5f3a123456789abcd', // Dummy product ID
          quantity: 1,
          price: 100,
          name: 'Test Product'
        }
      ],
      customerDetails: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '9876543210',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      orderSummary: {
        subtotal: 100,
        shipping: 0,
        tax: 18,
        total: 118,
        itemCount: 1
      },
      paymentDetails: {
        paymentId: 'test_payment_123',
        orderId: 'test_order_123',
        method: 'upi',
        status: 'completed'
      },
      status: 'confirmed',
      paymentStatus: 'paid',
      orderNumber: `TEST-${Date.now()}`
    });

    const savedOrder = await testOrder.save();
    console.log('Test order saved:', savedOrder._id);

    res.json({
      success: true,
      message: 'Test order created successfully',
      order: savedOrder
    });
  } catch (error) {
    console.error('Error creating test order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test order',
      error: error.message
    });
  }
});

// Get all orders for debugging
router.get('/debug-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: orders.length,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

module.exports = router;
