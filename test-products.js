// Test script to check products in the database
const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const testProducts = async () => {
  try {
    console.log('Testing product retrieval from database...');
    console.log('Connecting to:', process.env.MONGO_URI.replace(/:([^:@]{8})[^:@]*@/, ':***@'));
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');
    
    // Check if products collection exists and count documents
    const productCount = await Product.countDocuments();
    console.log(`📊 Total products in database: ${productCount}`);
    
    if (productCount > 0) {
      // Fetch first 3 products
      const products = await Product.find().limit(3).lean();
      console.log('✅ Sample products found:');
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ₹${product.price} (Stock: ${product.stock})`);
      });
    } else {
      console.log('⚠️ No products found in database');
      console.log('💡 Would you like to add some sample products?');
    }
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Available collections:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testProducts();