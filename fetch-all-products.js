const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Product schema (basic structure)
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  price: Number,
  mrp: Number,
  stock: Number,
  brand: String,
  imageUrl: String,
  isFeatured: Boolean,
  averageRating: Number,
  reviewCount: Number,
  specifications: Object
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

async function fetchAllProducts() {
  try {
    console.log('🔍 Connecting to MongoDB Atlas...');
    console.log('Database:', process.env.MONGO_URI ? 'Found' : 'Missing');
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log('📊 Database Name:', mongoose.connection.db.databaseName);
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available Collections:', collections.map(c => c.name));
    
    // Fetch all products
    console.log('\n🛍️ Fetching all products from database...');
    const products = await Product.find({}).lean();
    
    console.log(`\n📦 Total Products Found: ${products.length}`);
    console.log('=' .repeat(80));
    
    if (products.length === 0) {
      console.log('⚠️ No products found in the database!');
      return;
    }
    
    // Display each product
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   ID: ${product._id}`);
      console.log(`   Category: ${product.category || 'N/A'}`);
      console.log(`   Brand: ${product.brand || 'N/A'}`);
      console.log(`   Price: ₹${product.price || 'N/A'}`);
      console.log(`   MRP: ₹${product.mrp || 'N/A'}`);
      console.log(`   Stock: ${product.stock || 'N/A'}`);
      console.log(`   Featured: ${product.isFeatured ? 'Yes' : 'No'}`);
      console.log(`   Rating: ${product.averageRating || 'N/A'} (${product.reviewCount || 0} reviews)`);
      console.log(`   Description: ${(product.description || '').substring(0, 100)}${product.description && product.description.length > 100 ? '...' : ''}`);
      console.log(`   Image: ${product.imageUrl || 'N/A'}`);
      console.log(`   Created: ${product.createdAt || 'N/A'}`);
      console.log('-'.repeat(50));
    });
    
    // Summary statistics
    console.log('\n📈 PRODUCT STATISTICS:');
    console.log(`Total Products: ${products.length}`);
    
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    console.log(`Categories: ${categories.length} (${categories.join(', ')})`);
    
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    console.log(`Brands: ${brands.length} (${brands.join(', ')})`);
    
    const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
    console.log(`Total Inventory Value: ₹${totalValue}`);
    
    const inStock = products.filter(p => (p.stock || 0) > 0);
    console.log(`In Stock: ${inStock.length}/${products.length} products`);
    
    const featured = products.filter(p => p.isFeatured);
    console.log(`Featured Products: ${featured.length}`);
    
    console.log('\n✅ Database fetch completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the fetch
fetchAllProducts();