const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
  markHelpful
} = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for review image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/reviews/');
  },
  filename: function (req, file, cb) {
    cb(null, `review-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Get reviews for a product (public)
router.get('/product/:productId', getProductReviews);

// Add a review (requires authentication)
router.post('/product/:productId', authMiddleware, upload.array('images', 3), addReview);

// Update a review (requires authentication)
router.put('/:reviewId', authMiddleware, updateReview);

// Delete a review (requires authentication)
router.delete('/:reviewId', authMiddleware, deleteReview);

// Mark review as helpful (public)
router.post('/:reviewId/helpful', markHelpful);

module.exports = router;
