const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getDailySalesReport,
  getAllOrdersForAdmin,
  getMonthlySalesSummary
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin routes (should be protected with admin middleware in production)
router.get('/admin/daily-sales', authMiddleware, getDailySalesReport);
router.get('/admin/all-orders', authMiddleware, getAllOrdersForAdmin);
router.get('/admin/monthly-summary', authMiddleware, getMonthlySalesSummary);

// Create new order
router.post('/', authMiddleware, createOrder);

// Get user's orders
router.get('/', authMiddleware, getUserOrders);

// Get specific order
router.get('/:orderId', authMiddleware, getOrderById);

// Cancel order
router.put('/:orderId/cancel', authMiddleware, cancelOrder);

module.exports = router;