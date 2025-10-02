// Simple test to check if server is responding
const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

const runTests = async () => {
  try {
    console.log('Testing root endpoint...');
    const rootResponse = await testEndpoint('/');
    console.log('✅ Root endpoint:', rootResponse.statusCode, rootResponse.body.trim());

    console.log('\nTesting health endpoint...');
    const healthResponse = await testEndpoint('/health');
    console.log('✅ Health endpoint:', healthResponse.statusCode);
    console.log('Response body:', healthResponse.body);

    console.log('\nTesting products endpoint...');
    const productsResponse = await testEndpoint('/api/products');
    console.log('✅ Products endpoint:', productsResponse.statusCode);
    
    if (productsResponse.statusCode === 200) {
      const data = JSON.parse(productsResponse.body);
      console.log('Product count:', data.count);
    } else {
      console.log('Response body:', productsResponse.body);
    }

  } catch (error) {
    console.error('❌ Server test failed:', error.message);
  }
};

// Wait a bit then test
setTimeout(runTests, 2000);