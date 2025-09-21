const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Test endpoints
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Health check passed',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    message: 'Products endpoint working',
    data: [
      { id: 1, name: 'Test Product', price: 100 }
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`✅ Test: http://localhost:${PORT}/health`);
});