const express = require('express');
const router = express.Router();
const { addToCart, getCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');

// Add item to cart
router.post('/add', authMiddleware, addToCart);

// Get cart items
router.get('/', authMiddleware, getCart);

// Update cart item quantity
router.put('/update/:productId', authMiddleware, updateCartItem);

// Remove item from cart
router.delete('/remove/:productId', authMiddleware, removeFromCart);

// Clear entire cart
router.delete('/clear', authMiddleware, clearCart);

module.exports = router;
