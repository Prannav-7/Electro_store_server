// Test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Missing');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Database connection test successful');
    console.log('✅ MongoDB Atlas authentication working');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection test failed:', err.message);
    process.exit(1);
  });

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Connection test timeout');
  process.exit(1);
}, 10000);