const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
  markHelpful
} = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Get reviews for a product (public)
router.get('/product/:productId', getProductReviews);

// Add a review (requires authentication)
router.post('/product/:productId', authMiddleware, addReview);

// Update a review (requires authentication)
router.put('/:reviewId', authMiddleware, updateReview);

// Delete a review (requires authentication)
router.delete('/:reviewId', authMiddleware, deleteReview);

// Mark review as helpful (public)
router.post('/:reviewId/helpful', markHelpful);

module.exports = router;
