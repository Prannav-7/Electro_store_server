const express = require('express');
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  getRazorpayPaymentLink,
  createUPIOrder,
  verifyUPIPayment,
  verifyCODPayment,
  getPaymentMethods
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Get available payment methods
router.get('/methods', getPaymentMethods);

// Create Razorpay order
router.post('/create-order', authMiddleware, createPaymentOrder);

// Get Razorpay payment link
router.post('/razorpay-link', authMiddleware, getRazorpayPaymentLink);

// Create UPI order
router.post('/create-upi-order', authMiddleware, createUPIOrder);

// Verify payment
router.post('/verify', authMiddleware, verifyPayment);

// Verify UPI payment
router.post('/verify-upi', authMiddleware, verifyUPIPayment);

// Verify COD order
router.post('/verify-cod', authMiddleware, verifyCODPayment);

module.exports = router;
