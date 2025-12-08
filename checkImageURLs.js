// Check product image URLs
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

const checkProductURLs = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find().limit(5);
    
    console.log(`\n📦 Sample of ${products.length} products:\n`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Image: ${product.image || 'N/A'}`);
      console.log(`   ImageUrl: ${product.imageUrl || 'N/A'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkProductURLs();
