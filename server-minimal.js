const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables
dotenv.config();

console.log('🚀 Starting Render-Compatible Server...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || 10000);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for now
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Render Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '2.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏪 Jaimaaruthi Electrical Store API - Render Deployment',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    status: 'Server running on Render',
    endpoints: {
      health: '/health',
      products: '/api/products'
    }
  });
});

// Basic products endpoint with sample data
app.get('/api/products', (req, res) => {
  console.log('Products endpoint hit');
  
  // Sample product data
  const products = [
    {
      _id: '507f1f77bcf86cd799439011',
      name: 'LED Bulb 9W',
      price: 150,
      category: 'Lighting',
      description: 'Energy efficient LED bulb',
      imageId: 'led-bulb',
      stock: 50,
      isActive: true
    },
    {
      _id: '507f1f77bcf86cd799439012',
      name: 'Ceiling Fan 48"',
      price: 2500,
      category: 'Fans',
      description: 'High speed ceiling fan',
      imageId: 'ceiling-fan',
      stock: 25,
      isActive: true
    },
    {
      _id: '507f1f77bcf86cd799439013',
      name: 'MCB 16A',
      price: 350,
      category: 'Electrical',
      description: 'Miniature Circuit Breaker',
      imageId: 'mcb',
      stock: 100,
      isActive: true
    },
    {
      _id: '507f1f77bcf86cd799439014',
      name: 'Electric Drill',
      price: 3500,
      category: 'Tools',
      description: 'Professional electric drill machine',
      imageId: 'drill',
      stock: 15,
      isActive: true
    },
    {
      _id: '507f1f77bcf86cd799439015',
      name: 'Copper Wire 2.5mm',
      price: 280,
      category: 'Wiring',
      description: 'High quality copper wire',
      imageId: 'wire',
      stock: 75,
      isActive: true
    }
  ];
  
  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
    message: 'Products fetched successfully'
  });
});

// Basic users endpoint for auth
app.post('/api/users/register', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Registration endpoint working',
    data: { id: '123', email: 'test@example.com', name: 'Test User' }
  });
});

app.post('/api/users/login', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Login endpoint working',
    token: 'sample-token',
    user: { id: '123', email: 'test@example.com', name: 'Test User' }
  });
});

// Serve static files for images
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/products',
      'POST /api/users/register',
      'POST /api/users/login'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// MongoDB connection (optional for initial test)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB connected successfully');
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      // Don't exit, continue with sample data
    });
} else {
  console.log('⚠️  No MONGO_URI provided, using sample data');
}

// Start server
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 Products API: http://localhost:${PORT}/api/products`);
  console.log('✅ Render deployment ready!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.close(() => {
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
    }
    process.exit(0);
  });
});

module.exports = app;