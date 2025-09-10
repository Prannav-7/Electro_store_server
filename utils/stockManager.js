const Product = require('../models/Product');

// Utility functions for stock management

/**
 * Check if products have sufficient stock
 * @param {Array} items - Array of items with productId and quantity
 * @returns {Promise<{success: boolean, message?: string, insufficientProducts?: Array}>}
 */
const checkStockAvailability = async (items) => {
  try {
    const insufficientProducts = [];
    
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return {
          success: false,
          message: `Product not found: ${item.productId}`
        };
      }
      
      const requestedQuantity = parseInt(item.quantity) || 1;
      if (product.stock < requestedQuantity) {
        insufficientProducts.push({
          productId: item.productId,
          productName: product.name,
          available: product.stock,
          requested: requestedQuantity
        });
      }
    }
    
    if (insufficientProducts.length > 0) {
      return {
        success: false,
        message: 'Insufficient stock for some products',
        insufficientProducts
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error checking stock availability:', error);
    return {
      success: false,
      message: 'Error checking stock availability'
    };
  }
};

/**
 * Reduce stock levels for products
 * @param {Array} items - Array of items with productId and quantity
 * @returns {Promise<{success: boolean, message?: string, updatedProducts?: Array}>}
 */
const reduceStock = async (items) => {
  try {
    const updatedProducts = [];
    
    for (let item of items) {
      const requestedQuantity = parseInt(item.quantity) || 1;
      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId,
        { 
          $inc: { stock: -requestedQuantity },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );
      
      if (updatedProduct) {
        updatedProducts.push({
          productId: item.productId,
          productName: updatedProduct.name,
          previousStock: updatedProduct.stock + requestedQuantity,
          currentStock: updatedProduct.stock,
          quantityReduced: requestedQuantity
        });
        
        console.log(`Stock reduced: ${updatedProduct.name} - Reduced by ${requestedQuantity}, New stock: ${updatedProduct.stock}`);
        
        // Log low stock warning
        if (updatedProduct.stock < 10) {
          console.warn(`LOW STOCK WARNING: ${updatedProduct.name} has only ${updatedProduct.stock} units left`);
        }
        
        // Log out of stock
        if (updatedProduct.stock === 0) {
          console.warn(`OUT OF STOCK: ${updatedProduct.name} is now out of stock`);
        }
      }
    }
    
    return {
      success: true,
      updatedProducts
    };
  } catch (error) {
    console.error('Error reducing stock:', error);
    return {
      success: false,
      message: 'Error reducing stock levels'
    };
  }
};

/**
 * Restore stock levels for products (used when orders are cancelled)
 * @param {Array} items - Array of items with productId and quantity
 * @returns {Promise<{success: boolean, message?: string, updatedProducts?: Array}>}
 */
const restoreStock = async (items) => {
  try {
    const updatedProducts = [];
    
    for (let item of items) {
      const quantityToRestore = parseInt(item.quantity) || 1;
      const updatedProduct = await Product.findByIdAndUpdate(
        item.productId,
        { 
          $inc: { stock: quantityToRestore },
          $set: { updatedAt: new Date() }
        },
        { new: true }
      );
      
      if (updatedProduct) {
        updatedProducts.push({
          productId: item.productId,
          productName: updatedProduct.name,
          previousStock: updatedProduct.stock - quantityToRestore,
          currentStock: updatedProduct.stock,
          quantityRestored: quantityToRestore
        });
        
        console.log(`Stock restored: ${updatedProduct.name} - Restored ${quantityToRestore}, New stock: ${updatedProduct.stock}`);
      }
    }
    
    return {
      success: true,
      updatedProducts
    };
  } catch (error) {
    console.error('Error restoring stock:', error);
    return {
      success: false,
      message: 'Error restoring stock levels'
    };
  }
};

/**
 * Get products with low stock (less than 10 units)
 * @returns {Promise<Array>}
 */
const getLowStockProducts = async () => {
  try {
    const lowStockProducts = await Product.find({ 
      stock: { $lt: 10 },
      isActive: true 
    }).select('name stock category brand');
    
    return lowStockProducts;
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return [];
  }
};

/**
 * Get out of stock products
 * @returns {Promise<Array>}
 */
const getOutOfStockProducts = async () => {
  try {
    const outOfStockProducts = await Product.find({ 
      stock: 0,
      isActive: true 
    }).select('name stock category brand');
    
    return outOfStockProducts;
  } catch (error) {
    console.error('Error fetching out of stock products:', error);
    return [];
  }
};

module.exports = {
  checkStockAvailability,
  reduceStock,
  restoreStock,
  getLowStockProducts,
  getOutOfStockProducts
};
