// Ultra-basic server for Render deployment
const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;

// Simple routes
app.get('/', (req, res) => {
  res.json({ message: 'Electro Store Server is running!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/products', (req, res) => {
  res.json([
    {
      _id: '1',
      name: 'LED Bulb',
      price: 150,
      category: 'Lighting',
      description: 'Energy-efficient LED bulb',
      imageUrl: '/images/products/led-bulb.jpg'
    }
  ]);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});