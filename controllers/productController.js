const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');


exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

exports.restockProduct = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity provided'
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product.stock += quantity;
    await product.save();
    
    res.status(200).json({
      success: true,
      data: product,
      message: `Product restocked with ${quantity} units`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to restock product',
      error: error.message
    });
  }
};

// Get product reviews
exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await Review.find({ productId: id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name');

    res.status(200).json({
      success: true,
      reviews: reviews.map(review => ({
        _id: review._id,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        images: review.images,
        verified: review.verified,
        helpful: review.helpful,
        createdAt: review.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Add product review (only for users who purchased the product)
exports.addProductReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;
    const userName = req.user.name;

    console.log('=== ADD PRODUCT REVIEW ===');
    console.log('User ID:', userId);
    console.log('Product ID:', productId);
    console.log('Rating:', rating);
    console.log('Comment:', comment);

    // Check if user has purchased this product
    const purchasedOrders = await Order.find({
      user: userId,
      'items.product': productId,
      status: { $in: ['confirmed', 'delivered', 'completed', 'paid'] }
    });

    if (purchasedOrders.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased'
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({ 
      productId: productId, 
      userId: userId 
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
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
      userId,
      userName,
      rating: parseInt(rating),
      title: `Review by ${userName}`,
      comment,
      images: imageUrls,
      verified: true // Always true since we verified purchase
    });

    await newReview.save();

    // Update product average rating
    const allReviews = await Review.find({ productId });
    const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
    
    await Product.findByIdAndUpdate(productId, {
      averageRating: averageRating,
      reviewCount: allReviews.length
    });

    console.log('Review created successfully');

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: {
        _id: newReview._id,
        userName: newReview.userName,
        rating: newReview.rating,
        comment: newReview.comment,
        images: newReview.images,
        verified: newReview.verified,
        createdAt: newReview.createdAt
      }
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add review',
      error: error.message
    });
  }
};

