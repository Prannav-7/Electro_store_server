const express = require('express');
const cors = require('cors');

console.log('🚀 Ultra-Simple Render Server Starting...');

const app = express();

// Basic middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.json({
    success: true,
    message: '🏪 Jaimaaruthi Store Server LIVE!',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    status: 'deployed'
  });
});

// Health check
app.get('/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.json({
    success: true,
    message: 'Server is healthy and deployed!',
    timestamp: new Date().toISOString()
  });
});

// Products endpoint with sample data
app.get('/api/products', (req, res) => {
  console.log('Products endpoint hit - returning sample data');
  
  const products = [
    {
      _id: '1',
      name: 'LED Bulb 9W',
      price: 150,
      category: 'Lighting',
      imageId: 'led-bulb',
      stock: 50
    },
    {
      _id: '2', 
      name: 'Ceiling Fan 48"',
      price: 2500,
      category: 'Fans',
      imageId: 'ceiling-fan',
      stock: 25
    },
    {
      _id: '3',
      name: 'MCB 16A',
      price: 350,
      category: 'Electrical', 
      imageId: 'mcb',
      stock: 100
    }
  ];
  
  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/', '/health', '/api/products']
  });
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('✅ Ready to serve requests!');
});

module.exports = app;