const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const wishlist = await Wishlist.findOne({ userId }).populate('products');
    
    if (!wishlist) {
      return res.json({ 
        success: true,
        data: { userId, products: [] }
      });
    }
    
    res.json({ 
      success: true,
      data: wishlist 
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Something went wrong' 
    });
  }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    let wishlist = await Wishlist.findOne({ userId });
    
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }
    
    // Check if product is already in wishlist
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
      await wishlist.populate('products');
      res.json({ 
        success: true,
        message: 'Product added to wishlist successfully', 
        data: wishlist 
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Product already in wishlist' 
      });
    }
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Something went wrong' 
    });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ 
        success: false,
        message: 'Wishlist not found' 
      });
    }
    
    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();
    await wishlist.populate('products');
    
    res.json({ 
      success: true,
      message: 'Product removed from wishlist successfully', 
      data: wishlist 
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Something went wrong' 
    });
  }
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ 
        success: false,
        message: 'Wishlist not found' 
      });
    }
    
    wishlist.products = [];
    await wishlist.save();
    
    res.json({ 
      success: true,
      message: 'Wishlist cleared successfully', 
      data: wishlist 
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Something went wrong' 
    });
  }
};
