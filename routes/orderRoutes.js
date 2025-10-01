const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getDailySalesReport,
  getDailySummary,
  getAllOrdersForAdmin,
  getMonthlySalesSummary,
  checkUserPurchase,
  getSalesAnalytics,
  getMonthlyComparison,
  getTopProducts,
  getCategoryBreakdown,
  getSalesReport
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin routes (should be protected with admin middleware in production)
router.get('/admin/daily-sales', authMiddleware, getDailySalesReport);
router.get('/admin/daily-summary', authMiddleware, getDailySummary);
router.get('/admin/all-orders', authMiddleware, getAllOrdersForAdmin);
router.get('/admin/monthly-summary', authMiddleware, getMonthlySalesSummary);
router.get('/admin/sales-report', getSalesReport);
router.put('/admin/update-status/:orderId', authMiddleware, updateOrderStatus);

// New analytics routes (temporarily without auth for testing)
router.get('/admin/sales-analytics', getSalesAnalytics);
router.get('/admin/monthly-comparison', getMonthlyComparison);
router.get('/admin/top-products', getTopProducts);
router.get('/admin/category-breakdown', getCategoryBreakdown);

// Create new order
router.post('/', authMiddleware, createOrder);

// Get user's orders
router.get('/', authMiddleware, getUserOrders);

// Get specific order
router.get('/:orderId', authMiddleware, getOrderById);

// Check if user has purchased a specific product
router.get('/check-purchase/:productId', authMiddleware, checkUserPurchase);

// Cancel order
router.put('/:orderId/cancel', authMiddleware, cancelOrder);

module.exports = router;