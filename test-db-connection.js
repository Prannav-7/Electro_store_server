// MongoDB Connection Test
const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection string:', process.env.MONGO_URI.replace(/:([^:@]{8})[^:@]*@/, ':***HIDDEN***@'));
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connection successful!');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✅ Database accessible - Collections:', collections.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 8000) {
      console.log('\n🔧 Solutions:');
      console.log('1. Check MongoDB Atlas Database Access - verify user exists');
      console.log('2. Check Network Access - whitelist your IP address');
      console.log('3. Verify username and password in connection string');
      console.log('4. Check if user has proper permissions');
    }
    
    process.exit(1);
  }
};

testConnection();