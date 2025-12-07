const Review = require('../models/Review');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');

    const totalReviews = await Review.countDocuments({ productId });
    const totalPages = Math.ceil(totalReviews / limit);

    // Calculate average rating using proper ObjectId
    const objectId = new mongoose.Types.ObjectId(productId);
    const ratingStats = await Review.aggregate([
      { $match: { productId: objectId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingCounts: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Count ratings by stars
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingStats.length > 0) {
      ratingStats[0].ratingCounts.forEach(rating => {
        ratingBreakdown[rating]++;
      });
    }

    res.json({
      success: true,
      reviews: reviews.map(review => ({
        id: review._id,
        user: review.userName,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        verified: review.verified,
        helpful: review.helpful,
        date: review.createdAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: ratingStats.length > 0 ? {
        averageRating: Math.round(ratingStats[0].averageRating * 10) / 10,
        totalReviews: ratingStats[0].totalReviews,
        ratingBreakdown
      } : {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Add a new review
const addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user ? req.user.id : null;
    const userName = req.user ? req.user.name : 'Anonymous User';

    console.log('=== ADD REVIEW DEBUG ===');
    console.log('Product ID:', productId);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('User:', req.user ? req.user.email : 'null');
    console.log('Rating:', rating, typeof rating);
    console.log('Title:', title);
    console.log('Comment:', comment);

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate rating
    const ratingNum = parseInt(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Process uploaded images
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        imageUrls.push(`/uploads/reviews/${file.filename}`);
      });
    }

    // Create new review
    const newReview = new Review({
      productId,
      userId: userId || new mongoose.Types.ObjectId(), // Create dummy ObjectId for anonymous users
      userName,
      rating: ratingNum,
      title: title || `Review by ${userName}`,
      comment: comment || '',
      images: imageUrls,
      verified: userId ? true : false
    });

    await newReview.save();

    // Update product's average rating
    const objectIdForUpdate = new mongoose.Types.ObjectId(productId);
    const reviewStatsUpdate = await Review.aggregate([
      { $match: { productId: objectIdForUpdate } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (reviewStatsUpdate.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(reviewStatsUpdate[0].averageRating * 10) / 10,
        reviewCount: reviewStatsUpdate[0].totalReviews
      });
    }

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: {
        id: newReview._id,
        user: newReview.userName,
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
        images: newReview.images,
        verified: newReview.verified,
        helpful: newReview.helpful,
        date: newReview.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add review',
      error: error.message
    });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user ? req.user.id : null;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not authorized to update it'
      });
    }

    // Update review fields
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;

    await review.save();

    // Recalculate product's average rating
    const objectIdForRecalc = new mongoose.Types.ObjectId(review.productId);
    const reviewStatsRecalc = await Review.aggregate([
      { $match: { productId: objectIdForRecalc } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (reviewStatsRecalc.length > 0) {
      await Product.findByIdAndUpdate(review.productId, {
        averageRating: Math.round(reviewStatsRecalc[0].averageRating * 10) / 10,
        reviewCount: reviewStatsRecalc[0].totalReviews
      });
    }

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: {
        id: review._id,
        user: review.userName,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images,
        verified: review.verified,
        helpful: review.helpful,
        date: review.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user ? req.user.id : null;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you are not authorized to delete it'
      });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate product's average rating
    const objectIdForDelete = new mongoose.Types.ObjectId(productId);
    const reviewStatsDelete = await Review.aggregate([
      { $match: { productId: objectIdForDelete } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (reviewStatsDelete.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(reviewStatsDelete[0].averageRating * 10) / 10,
        reviewCount: reviewStatsDelete[0].totalReviews
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        reviewCount: 0
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// Mark review as helpful
const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review marked as helpful',
      helpful: review.helpful
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful',
      error: error.message
    });
  }
};

module.exports = {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
  markHelpful
};
