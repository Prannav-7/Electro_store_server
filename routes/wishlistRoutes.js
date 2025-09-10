const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

// Get user's wishlist
router.get('/', authMiddleware, wishlistController.getWishlist);

// Add product to wishlist
router.post('/add', authMiddleware, wishlistController.addToWishlist);

// Remove product from wishlist
router.delete('/remove/:productId', authMiddleware, wishlistController.removeFromWishlist);

// Clear entire wishlist
router.delete('/clear', authMiddleware, wishlistController.clearWishlist);

module.exports = router;
