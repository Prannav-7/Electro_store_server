const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Add item to cart
const addToCart = async (req, res) => {
  try {
    console.log('=== ADD TO CART ===');
    console.log('User:', req.user._id);
    console.log('Request body:', req.body);
    
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      // Create new cart
      cart = new Cart({
        userId,
        items: [{
          productId,
          quantity,
          price: product.price
        }]
      });
    } else {
      // Check if product already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({
          productId,
          quantity,
          price: product.price
        });
      }
    }

    await cart.save();
    await cart.populate('items.productId');

    console.log('Cart saved successfully with', cart.items.length, 'items');

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get user's cart
const getCart = async (req, res) => {
  try {
    console.log('=== GET CART ===');
    console.log('User:', req.user._id);
    
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      console.log('No cart found, returning empty');
      return res.json({ 
        success: true,
        data: { 
          items: [], 
          total: 0,
          itemCount: 0
        }
      });
    }

    // Manually populate with fresh product data to ensure current stock levels
    const itemsWithFreshProductData = await Promise.all(
      cart.items.map(async (item) => {
        const freshProduct = await Product.findById(item.productId);
        return {
          ...item.toObject(),
          productId: freshProduct
        };
      })
    );

    // Calculate totals
    const total = itemsWithFreshProductData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = itemsWithFreshProductData.reduce((sum, item) => sum + item.quantity, 0);

    console.log('Cart found with', itemsWithFreshProductData.length, 'items, total:', total);
    console.log('Fresh stock levels loaded for cart items');

    res.json({ 
      success: true,
      data: {
        items: itemsWithFreshProductData,
        total,
        itemCount,
        _id: cart._id,
        userId: cart.userId
      }
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    console.log('=== UPDATE CART ITEM ===');
    const userId = req.user._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found in cart' 
      });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.productId');

    // Calculate totals
    const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: {
        items: cart.items,
        total,
        itemCount,
        _id: cart._id,
        userId: cart.userId
      }
    });
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    console.log('=== REMOVE FROM CART ===');
    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.productId');

    // Calculate totals
    const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        items: cart.items,
        total,
        itemCount,
        _id: cart._id,
        userId: cart.userId
      }
    });
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    console.log('=== CLEAR CART ===');
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Cart not found' 
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        total: 0,
        itemCount: 0,
        _id: cart._id,
        userId: cart.userId
      }
    });
  } catch (error) {
    console.error('Error in clearCart:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
