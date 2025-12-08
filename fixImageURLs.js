// Fix product image URLs - Update localhost to Render URL
const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

const updateProductImageURLs = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all products with localhost URLs
    const products = await Product.find({
      $or: [
        { image: /localhost:5000/ },
        { imageUrl: /localhost:5000/ }
      ]
    });

    console.log(`📦 Found ${products.length} products with localhost URLs`);

    let updated = 0;
    for (const product of products) {
      const oldImage = product.image || product.imageUrl;
      
      // Replace localhost with Render URL
      const newImage = oldImage.replace(
        'http://localhost:5000',
        'https://electro-store-server-8n0d.onrender.com'
      );

      if (product.image) {
        product.image = newImage;
      }
      if (product.imageUrl) {
        product.imageUrl = newImage;
      }

      await product.save();
      updated++;
      console.log(`✅ Updated: ${product.name} - ${newImage}`);
    }

    console.log(`\n🎉 Successfully updated ${updated} products!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

updateProductImageURLs();
