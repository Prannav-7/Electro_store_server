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
  const maxConnectionAttempts = process.env.NODE_ENV === 'production' ? 10 : 3; // More attempts in production
  
  const attemptConnection = async () => {
    try {
      connectionAttempt++;
      console.log(`=== DATABASE CONNECTION ATTEMPT ${connectionAttempt}/${maxConnectionAttempts} ===`);
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
      console.log('MONGO_URI format check:', process.env.MONGO_URI?.startsWith('mongodb'));
      console.log('Database name in URI:', process.env.MONGO_URI?.match(/\/([^?]+)/)?.[1]);
      console.log('Mongoose version:', mongoose.version);
      
      // Special debugging for Render deployment
      if (process.env.NODE_ENV === 'production') {
        console.log('🚀 RENDER DEPLOYMENT - IMPORTANT CHECKLIST:');
        console.log('1. ✅ MongoDB Atlas IP Whitelist must include 0.0.0.0/0 (or Render IPs)');
        console.log('2. ✅ MONGO_URI environment variable set in Render dashboard');
        console.log('3. ✅ Database user has read/write permissions');
        console.log('4. ✅ Network access configured in MongoDB Atlas');
        console.log('🔍 Current MONGO_URI format:', process.env.MONGO_URI?.substring(0, 50) + '...');
      }
      
      if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI environment variable is not defined');
      }
      
      // Validate MongoDB URI format
      if (!process.env.MONGO_URI.includes('mongodb+srv://') && !process.env.MONGO_URI.includes('mongodb://')) {
        throw new Error('Invalid MONGO_URI format - must start with mongodb:// or mongodb+srv://');
      }

      // Force close any existing connection
      if (mongoose.connection.readyState !== 0) {
        console.log('🔄 Closing existing connection...');
        await mongoose.connection.close();
      }

      // MongoDB connection options optimized for Render deployment
      const mongoOptions = {
        serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 60000 : 30000, // Longer timeout in production
        socketTimeoutMS: process.env.NODE_ENV === 'production' ? 60000 : 30000, 
        connectTimeoutMS: process.env.NODE_ENV === 'production' ? 60000 : 30000,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        retryReads: true,
        heartbeatFrequencyMS: 10000,
        // Additional options for better Render compatibility
        family: 4, // Use IPv4, skip trying IPv6
        directConnection: false, // Allow driver to determine best connection
        maxConnecting: 2, // Limit concurrent connection attempts
        authSource: 'admin', // Specify auth source
        ssl: true, // Ensure SSL connection
        tlsAllowInvalidCertificates: false, // Security
      };

      console.log('🔄 Attempting MongoDB connection...');
      
      // Configure mongoose settings
      mongoose.set('bufferCommands', false);
      mongoose.set('strictQuery', false);
      
      const startTime = Date.now();
      await mongoose.connect(process.env.MONGO_URI, mongoOptions);
      const connectionTime = Date.now() - startTime;
      
      console.log(`✅ MongoDB connected successfully in ${connectionTime}ms`);
      console.log('✅ Connection state:', mongoose.connection.readyState);
      console.log('✅ Database name:', mongoose.connection.db.databaseName);
      
      return true;
      
    } catch (error) {
      console.error(`❌ Connection attempt ${connectionAttempt} failed:`);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      if (connectionAttempt < maxConnectionAttempts) {
        const delay = Math.min(connectionAttempt * 2000, 10000); // Max 10s delay
        console.log(`⏳ Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptConnection();
      }
      
      // In production, don't give up - keep trying with longer intervals
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Production mode: Will keep retrying connection every 30 seconds...');
        setTimeout(() => {
          console.log('🔄 Retrying database connection...');
          connectDB().catch(err => console.error('❌ Retry failed:', err.message));
        }, 30000);
      }
      
      throw error;
    }
  };

  try {
    await attemptConnection();
    
    // Set up connection event handlers after successful connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime error:', err.message);
      // Attempt immediate reconnection on error
      setTimeout(() => {
        console.log('🔄 Attempting reconnection due to error...');
        connectDB();
      }, 2000);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected - attempting immediate reconnection...');
      setTimeout(() => {
        console.log('🔄 Reconnecting after disconnection...');
        connectDB();
      }, 1000);
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
    // Add periodic connection health check
    setInterval(() => {
      const dbState = mongoose.connection.readyState;
      if (dbState === 0 && process.env.NODE_ENV === 'production') {
        console.log('🔄 Periodic check: Database disconnected, attempting reconnection...');
        connectDB().catch(err => {
          console.error('❌ Periodic reconnection failed:', err.message);
        });
      }
    }, 30000); // Check every 30 seconds
    
  } catch (error) {
    console.error('❌ All MongoDB connection attempts failed');
    console.error('Final error:', error.message);
    
    // Don't crash the server - let it run without DB for now
    console.log('⚠️ Server starting without database connection');
    console.log('⚠️ Database operations will return 503 until connection is restored');
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

// Manual reconnection endpoint
app.post('/reconnect', async (req, res) => {
  try {
    console.log('🔄 Manual reconnection requested...');
    const currentState = mongoose.connection.readyState;
    
    if (currentState === 1) {
      return res.json({
        success: true,
        message: 'Database already connected',
        state: 'connected'
      });
    }
    
    // Force close existing connection if any
    if (currentState !== 0) {
      await mongoose.connection.close();
    }
    
    // Attempt reconnection
    await connectDB();
    
    res.json({
      success: true,
      message: 'Reconnection attempt initiated',
      newState: mongoose.connection.readyState
    });
  } catch (error) {
    console.error('❌ Manual reconnection failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Reconnection failed',
      error: error.message
    });
  }
});

// Test real product fetching endpoint
app.get('/test-products', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    if (dbState !== 1) {
      return res.json({
        success: false,
        message: 'Database not connected',
        dbState: dbState,
        fallbackActive: true
      });
    }
    
    const Product = require('./models/Product');
    const products = await Product.find().limit(5).lean();
    
    res.json({
      success: true,
      message: 'Real products fetched successfully',
      count: products.length,
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        brand: p.brand,
        category: p.category
      })),
      dbState: dbState
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real products',
      error: error.message,
      dbState: mongoose.connection.readyState
    });
  }
});

// Initialize database connection (non-blocking)
console.log('🚀 Starting database connection...');
connectDB().catch(err => {
  console.error('❌ Initial database connection failed:', err.message);
  console.log('⚠️ Server will continue running and retry connection');
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
