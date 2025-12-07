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
  let connectionAttempt = 0;
  const maxConnectionAttempts = 3;
  
  const attemptConnection = async () => {
    try {
      connectionAttempt++;
      
      if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI environment variable is not defined');
      }

      // Force close any existing connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }

      const mongoOptions = {
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 20000, 
        connectTimeoutMS: 20000,
        maxPoolSize: 5,
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        retryReads: true,
        heartbeatFrequencyMS: 10000,
      };

      if (connectionAttempt === 1) {
        console.log('🔄 Connecting to MongoDB...');
      }
      
      // Configure mongoose settings
      mongoose.set('bufferCommands', false);
      mongoose.set('strictQuery', false);
      
      await mongoose.connect(process.env.MONGO_URI, mongoOptions);
      
      console.log('✅ MongoDB connected successfully');
      
      return true;
      
    } catch (error) {
      if (connectionAttempt < maxConnectionAttempts) {
        const delay = connectionAttempt * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptConnection();
      }
      
      throw error;
    }
  };

  try {
    await attemptConnection();
    
    // Set up connection event handlers after successful connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
      setTimeout(() => connectDB(), 5000);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      setTimeout(() => connectDB(), 3000);
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️ Server starting without database connection');
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

// Initialize database connection and start server
const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  console.log('🚀 Starting database connection...');
  await connectDB().catch(err => {
    console.error('❌ Initial database connection failed:', err.message);
    console.log('⚠️ Server starting without database connection');
  });
  
  server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Database status: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⚠️ Not connected'}`);
  });
};

startServer();

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
