// Test script to verify server startup and health check
const axios = require('axios');

const testServer = async () => {
  try {
    console.log('Testing server startup...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/health', {
      timeout: 10000
    });
    
    console.log('✅ Health check response:', healthResponse.data);
    
    // Test products endpoint
    const productsResponse = await axios.get('http://localhost:5000/api/products', {
      timeout: 15000
    });
    
    console.log('✅ Products endpoint working:', {
      status: productsResponse.status,
      productCount: productsResponse.data.count
    });
    
  } catch (error) {
    console.error('❌ Server test failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

// Wait a bit for server to start, then test
setTimeout(testServer, 3000);