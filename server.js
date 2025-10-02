const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

// Load environment variables from the .env file in the server directory
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'Missing');

const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const debugRoutes = require('./routes/debugRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const { checkDbConnection } = require('./middleware/dbMiddleware');
const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../client/public/images/products/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from public directory (for default images)
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));

// Enhanced MongoDB connection configuration for production
const connectDB = async () => {
  try {
    // Log environment info for debugging
    console.log('=== DATABASE CONNECTION DEBUG INFO ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
    console.log('MONGO_URI format check:', process.env.MONGO_URI?.startsWith('mongodb'));
    console.log('Current working directory:', process.cwd());
    console.log('Mongoose version:', mongoose.version);
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    const mongoOptions = {
      serverSelectionTimeoutMS: 60000, // Increased to 60 seconds for Render
      socketTimeoutMS: 60000, // Increased socket timeout
      connectTimeoutMS: 60000, // Added connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Reduced minimum for Render
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 5000, // Increased heartbeat frequency
    };

    console.log('Attempting to connect to MongoDB...');
    console.log('Connection options:', JSON.stringify(mongoOptions, null, 2));
    
    // Configure mongoose settings before connecting
    mongoose.set('bufferCommands', false);
    mongoose.set('strictQuery', false);
    
    const startTime = Date.now();
    await mongoose.connect(process.env.MONGO_URI, mongoOptions);
    const connectionTime = Date.now() - startTime;
    
    console.log(`✅ MongoDB connected successfully in ${connectionTime}ms`);
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      console.error('Error details:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected - attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
    mongoose.connection.on('connecting', () => {
      console.log('🔄 MongoDB connecting...');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // For Render, we want to retry connection attempts
    if (process.env.NODE_ENV === 'production') {
      console.log('⏳ Retrying connection in 5 seconds...');
      setTimeout(() => {
        console.log('🔄 Attempting database reconnection...');
        connectDB();
      }, 5000);
    } else {
      process.exit(1);
    }
  }
};

// Basic endpoints (don't require DB)
app.get('/', (req, res) => {
  res.send('API running');
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.status(dbStatus === 1 ? 200 : 503).json({
    status: dbStatus === 1 ? 'healthy' : 'unhealthy',
    database: statusMap[dbStatus],
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Debug endpoint for troubleshooting (remove in production)
app.get('/debug', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      hasMongoUri: !!process.env.MONGO_URI,
      mongoUriPrefix: process.env.MONGO_URI?.substring(0, 20) + '...',
    },
    database: {
      state: dbStatus,
      stateText: statusMap[dbStatus],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    },
    server: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: process.version,
      mongooseVersion: mongoose.version,
    }
  });
});

// Connect to database with retry logic for Render
const initializeDatabase = async () => {
  let retryCount = 0;
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds

  while (retryCount < maxRetries) {
    try {
      await connectDB();
      console.log('✅ Database initialization successful');
      return;
    } catch (error) {
      retryCount++;
      console.log(`❌ Database connection attempt ${retryCount}/${maxRetries} failed`);
      
      if (retryCount < maxRetries) {
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.log('❌ All database connection attempts failed');
        // Continue startup even if DB fails - let middleware handle it
      }
    }
  }
};

// Initialize database connection
initializeDatabase();

// Apply database connection check to all API routes
app.use('/api/products', checkDbConnection, productRoutes);
app.use('/api/users', checkDbConnection, userRoutes);
app.use('/api/orders', checkDbConnection, orderRoutes);
app.use('/api/wishlist', checkDbConnection, wishlistRoutes);
app.use('/api/cart', checkDbConnection, cartRoutes);
app.use('/api/payment', checkDbConnection, paymentRoutes);
app.use('/api/debug', debugRoutes); // Debug routes don't need DB connection
app.use('/api/reviews', checkDbConnection, reviewRoutes);
app.use('/api/contact', checkDbConnection, contactRoutes);

// File upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const imageUrl = `/images/products/${req.file.filename}`;
    res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
