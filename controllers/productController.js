const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');


// Sample fallback data for when database is unavailable
const getSampleProducts = () => {
  return [
    {
      _id: "sample1",
      name: "LED Bulb 12W",
      description: "Energy efficient LED bulb suitable for home and office use",
      category: "Lighting Solutions",
      price: 150,
      mrp: 200,
      stock: 100,
      brand: "Philips",
      imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop&crop=center",
      isFeatured: true,
      averageRating: 4.5,
      reviewCount: 25,
      specifications: {
        wattage: "12W",
        voltage: "220V",
        color: "Warm White",
        warranty: "2 Years"
      }
    },
    {
      _id: "sample2",
      name: "Electric Wire 2.5mm",
      description: "High quality copper wire for electrical installations",
      category: "Wiring & Cables",
      price: 45,
      mrp: 60,
      stock: 500,
      brand: "Havells",
      imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=300&fit=crop&crop=center",
      isFeatured: true,
      averageRating: 4.2,
      reviewCount: 18,
      specifications: {
        size: "2.5mm",
        material: "Copper",
        insulation: "PVC",
        warranty: "5 Years"
      }
    },
    {
      _id: "sample3",
      name: "Power Socket 16A",
      description: "Durable power socket with safety features",
      category: "Switches & Sockets",
      price: 85,
      mrp: 110,
      stock: 75,
      brand: "Anchor",
      imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop&crop=center",
      isFeatured: true,
      averageRating: 4.7,
      reviewCount: 32,
      specifications: {
        amperage: "16A",
        voltage: "240V",
        material: "Polycarbonate",
        warranty: "3 Years"
      }
    },
    {
      _id: "sample4",
      name: "Ceiling Fan 48 inch",
      description: "High-speed ceiling fan with LED light and remote control",
      category: "Fans & Ventilation",
      price: 2500,
      mrp: 3200,
      stock: 25,
      brand: "Bajaj",
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop&crop=center",
      isFeatured: true,
      averageRating: 4.3,
      reviewCount: 45,
      specifications: {
        size: "48 inch",
        speed: "3 Speed",
        material: "Metal",
        warranty: "2 Years"
      }
    },
    {
      _id: "sample5",
      name: "MCB 32A Circuit Breaker",
      description: "Miniature Circuit Breaker for electrical safety",
      category: "Safety Equipment",
      price: 320,
      mrp: 450,
      stock: 150,
      brand: "Schneider Electric",
      imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&h=300&fit=crop&crop=center",
      isFeatured: false,
      averageRating: 4.8,
      reviewCount: 67,
      specifications: {
        amperage: "32A",
        poles: "Single Pole",
        breaking: "6kA",
        warranty: "5 Years"
      }
    },
    {
      _id: "sample6",
      name: "Extension Board 6 Socket",
      description: "Multi-socket extension board with surge protection",
      category: "Electrical Goods",
      price: 450,
      mrp: 600,
      stock: 80,
      brand: "Goldmedal",
      imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop&crop=center",
      isFeatured: false,
      averageRating: 4.1,
      reviewCount: 29,
      specifications: {
        sockets: "6 Universal",
        cord: "3 Meter",
        protection: "Surge Protection",
        warranty: "1 Year"
      }
    }
  ];
};

exports.getAllProducts = async (req, res) => {
  const maxRetries = 3;
  let retryCount = 0;

  const attemptQuery = async () => {
    try {
      const dbState = mongoose.connection.readyState;
      console.log(`getAllProducts attempt ${retryCount + 1} - DB state: ${dbState}`);
      
      // If database is connecting, wait a bit
      if (dbState === 2) {
        console.log('Database connecting, waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Check if database is connected after waiting
      if (mongoose.connection.readyState !== 1) {
        throw new Error(`Database not ready, state: ${mongoose.connection.readyState}`);
      }

      console.log('Attempting to fetch products from database...');
      const startTime = Date.now();
      
      const products = await Product.find()
        .maxTimeMS(10000) // Reduced timeout for faster failure detection
        .lean();
      
      const queryTime = Date.now() - startTime;
      console.log(`✅ Products fetched successfully in ${queryTime}ms, count: ${products.length}`);
        
      return {
        success: true,
        count: products.length,
        data: products,
        queryTime: queryTime,
        source: 'database'
      };
      
    } catch (error) {
      console.error(`❌ Query attempt ${retryCount + 1} failed:`, error.message);
      
      if (retryCount < maxRetries - 1) {
        retryCount++;
        const delay = retryCount * 1000; // 1s, 2s, 3s delays
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptQuery();
      }
      
      throw error;
    }
  };

  try {
    const result = await attemptQuery();
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ All product query attempts failed, returning sample data');
    console.log('🔄 Triggering database reconnection attempt...');
    
    // Trigger reconnection attempt (non-blocking)
    setTimeout(() => {
      if (mongoose.connection.readyState === 0) {
        console.log('🔄 Attempting database reconnection...');
        mongoose.connect(process.env.MONGO_URI).catch(err => {
          console.error('❌ Reconnection failed:', err.message);
        });
      }
    }, 1000);
    
    // Return sample data instead of 503 error
    const sampleProducts = getSampleProducts();
    
    return res.status(200).json({
      success: true,
      count: sampleProducts.length,
      data: sampleProducts,
      source: 'fallback',
      message: 'Using sample data - database temporarily unavailable',
      dbState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle sample product IDs (fallback data)
    if (id.startsWith('sample')) {
      console.log(`🔍 Sample product request for: ${id}`);
      const sampleProducts = getSampleProducts();
      const product = sampleProducts.find(p => p._id === id);
      
      if (product) {
        return res.status(200).json({
          success: true,
          data: product,
          source: 'fallback',
          message: 'Sample product - database temporarily unavailable'
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Sample product not found'
        });
      }
    }
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available',
        error: 'Service temporarily unavailable',
        dbState: mongoose.connection.readyState
      });
    }

    const product = await Product.findById(id)
      .maxTimeMS(10000) // 10 second timeout
      .lean();
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product,
      source: 'database'
    });
  } catch (error) {
    console.error('❌ Get product by ID error:', error.message);
    
    // Handle specific MongoDB errors
    if (error.name === 'MongooseError' || 
        error.name === 'MongoError' ||
        error.name === 'CastError' ||
        error.message.includes('Cast to ObjectId failed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: 'Please check the product ID and try again'
      });
    }
    
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
    const { id } = req.params;
    
    // Prevent deletion of sample products (fallback data)
    if (id.startsWith('sample')) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete sample product - this is fallback data'
      });
    }
    
    const product = await Product.findByIdAndDelete(id);
    
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
    console.error('❌ Delete product error:', error.message);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError' || error.message.includes('Cast to ObjectId failed')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        error: 'Please check the product ID and try again'
      });
    }
    
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
    
    // Handle sample product IDs (fallback data)
    if (id.startsWith('sample')) {
      console.log(`🔍 Sample product review request for: ${id}`);
      return res.status(200).json({
        success: true,
        reviews: [
          {
            _id: 'sample_review_1',
            userName: 'Verified Customer',
            rating: 5,
            comment: 'Excellent product quality. Highly recommended for electrical work.',
            images: [],
            verified: true,
            helpful: 12,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          },
          {
            _id: 'sample_review_2',
            userName: 'Electrical Contractor',
            rating: 4,
            comment: 'Good value for money. Works as expected.',
            images: [],
            verified: true,
            helpful: 8,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
          }
        ],
        source: 'fallback',
        message: 'Sample reviews - database temporarily unavailable'
      });
    }
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        reviews: [],
        source: 'fallback',
        message: 'No reviews available - database temporarily unavailable'
      });
    }

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
      })),
      source: 'database'
    });
  } catch (error) {
    console.error('❌ Get product reviews error:', error.message);
    
    // Return empty reviews instead of error for better UX
    res.status(200).json({
      success: true,
      reviews: [],
      source: 'fallback',
      message: 'Reviews temporarily unavailable',
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

