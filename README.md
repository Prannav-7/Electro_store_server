# Jaimaaruthi Electrical Store - Node.js Server 🚀⚡

A robust Node.js/Express.js backend server for Jaimaaruthi Electrical and Hardware Store with direct UPI payment integration and comprehensive e-commerce APIs.

## 🌟 Features

### 💳 **Direct Payment Integration**
- **Primary Payment Method**: Direct UPI payment to merchant bank account
- **UPI ID**: `prannav2511@okhdfcbank`
- **Bank**: Karur Vysya Bank 1054
- **Zero Processing Fees**: Direct bank-to-bank transfer
- **Instant Credit**: Real-time payment confirmation
- **Multiple Payment Options**: UPI, Razorpay Gateway, Cash on Delivery

### 🏗️ **Core API Features**
- **RESTful API Design** with comprehensive endpoints
- **JWT Authentication** with secure user management
- **MongoDB Integration** with Mongoose ODM
- **File Upload Support** for product images
- **Real-time Stock Management** with automatic updates
- **Order Processing Pipeline** with status tracking
- **Email & WhatsApp Integration** for notifications

### 📊 **Advanced Analytics**
- **Sales Dashboard APIs** with MongoDB aggregation
- **Revenue Tracking** by day, week, month
- **Payment Method Analysis** with detailed breakdown
- **Order Status Distribution** and completion rates
- **Top Products Analysis** with quantity and revenue metrics
- **Advanced Filtering** by date range, category, payment method

## 🛠️ Technology Stack

### Backend Framework
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

### Authentication & Security
- **JWT (JSON Web Tokens)** - Secure authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Input Validation** - Request sanitization

### Payment Processing
- **Direct UPI Integration** - Bank-to-bank transfers
- **Razorpay Gateway** - Online payment processing
- **QR Code Generation** - Mobile payment support
- **Payment Verification** - Secure transaction handling

### Communication Services
- **Nodemailer** - Email notifications
- **WhatsApp API** - Order notifications
- **SMS Integration** - Order confirmations

### File Handling
- **Multer** - File upload middleware
- **Path Management** - Secure file storage
- **Image Processing** - Product image handling

## 💰 Payment System Architecture

### Direct Bank Integration
```javascript
// Primary payment method configuration
const directPayment = {
  upiId: 'prannav2511@okhdfcbank',
  bankName: 'Karur Vysya Bank',
  accountNumber: '1054',
  merchantName: 'Prannav P - Jaimaaruthi Electrical Store',
  paymentFlow: 'Direct Transfer (No Gateway)',
  processingFees: 0,
  instantCredit: true
};
```

### Payment Flow
1. **Order Creation** → Generate unique order ID
2. **Payment Initiation** → Direct UPI transfer
3. **Payment Verification** → Confirm transaction
4. **Stock Update** → Reduce inventory levels
5. **Order Confirmation** → Send notifications
6. **Delivery Processing** → Update order status

### Supported Payment Methods
- **Direct UPI Payment** (Primary) - Zero fees, instant credit
- **Razorpay Gateway** - Cards, UPI, NetBanking, Wallets
- **Cash on Delivery** - Pay on delivery option

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  address: Object,
  role: String (customer/admin),
  isVerified: Boolean,
  createdAt: Date
}
```

### Product Model
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  stock: Number,
  images: [String],
  specifications: Object,
  brand: String,
  isActive: Boolean,
  createdAt: Date
}
```

### Order Model
```javascript
{
  userId: ObjectId,
  items: [OrderItem],
  customerDetails: Object,
  orderSummary: Object,
  paymentDetails: {
    paymentId: String,
    method: String,
    status: String,
    amount: Number
  },
  status: String,
  paymentStatus: String,
  orderNumber: String,
  createdAt: Date
}
```

## 🔗 API Endpoints

### Authentication APIs
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
POST /api/auth/logout       - User logout
GET  /api/auth/verify       - Token verification
POST /api/auth/forgot       - Password reset
```

### Product Management APIs
```
GET    /api/products        - Get all products
GET    /api/products/:id    - Get single product
POST   /api/products        - Create product (admin)
PUT    /api/products/:id    - Update product (admin)
DELETE /api/products/:id    - Delete product (admin)
POST   /api/products/upload - Upload product images
```

### Order Management APIs
```
POST /api/orders            - Create new order
GET  /api/orders            - Get user orders
GET  /api/orders/:id        - Get specific order
PUT  /api/orders/:id        - Update order status (admin)
GET  /api/admin/orders      - Get all orders (admin)
```

### Payment Processing APIs
```
POST /api/payment/create-order    - Create payment order
POST /api/payment/verify          - Verify Razorpay payment
POST /api/payment/verify-upi      - Verify UPI payment
POST /api/payment/verify-cod      - Process COD order
GET  /api/payment/methods         - Get payment methods
POST /api/payment/upi-order       - Create UPI order
```

### Analytics APIs
```
GET /api/analytics/sales          - Sales analytics data
GET /api/analytics/revenue        - Revenue trends
GET /api/analytics/orders         - Order statistics
GET /api/analytics/products       - Product performance
GET /api/admin/sales-report       - Comprehensive sales report
```

### Cart & Wishlist APIs
```
GET    /api/cart              - Get user cart
POST   /api/cart/add          - Add item to cart
PUT    /api/cart/update       - Update cart item
DELETE /api/cart/remove       - Remove from cart
POST   /api/wishlist/add      - Add to wishlist
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/jaimaaruthi_store

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Direct Payment Configuration
MERCHANT_UPI_ID=prannav2511@okhdfcbank
MERCHANT_NAME=Prannav P - Jaimaaruthi Electrical Store
BANK_NAME=Karur Vysya Bank
ACCOUNT_NUMBER=1054

# Razorpay Configuration (Secondary)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_PAYMENT_LINK=https://razorpay.me/@jaimaaruthi

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Jaimaaruthi Store <noreply@jaimaaruthi.com>

# WhatsApp Configuration
WHATSAPP_API_URL=your_whatsapp_api_endpoint
WHATSAPP_API_KEY=your_whatsapp_api_key

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpeg,jpg,png,webp
```

### Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/Prannav-7/Electro_store_server.git
cd Electro_store_server
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# Make sure MongoDB is running on your system
mongod
```

5. **Seed the database (optional)**
```bash
node seedDatabase.js
```

6. **Create admin user**
```bash
node createAdmin.js
```

7. **Start the development server**
```bash
npm start
# or for development with nodemon
npm run dev
```

8. **Verify server is running**
```bash
# Check server status
curl http://localhost:5000/api/health
```

## 📁 Project Structure

```
server/
├── controllers/           # Request handlers
│   ├── authController.js    # Authentication logic
│   ├── productController.js # Product management
│   ├── orderController.js   # Order processing
│   ├── paymentController.js # Payment integration
│   ├── userController.js    # User management
│   └── ...
├── models/               # Database models
│   ├── User.js             # User schema
│   ├── Product.js          # Product schema
│   ├── Order.js            # Order schema
│   ├── Cart.js             # Cart schema
│   └── ...
├── routes/               # API route definitions
│   ├── authRoutes.js       # Authentication routes
│   ├── productRoutes.js    # Product routes
│   ├── orderRoutes.js      # Order routes
│   ├── paymentRoutes.js    # Payment routes
│   └── ...
├── middleware/           # Custom middleware
│   ├── authMiddleware.js   # JWT authentication
│   ├── adminMiddleware.js  # Admin authorization
│   └── uploadMiddleware.js # File upload handling
├── services/             # External services
│   ├── razorpayService.js  # Razorpay integration
│   ├── emailService.js     # Email notifications
│   └── whatsappService.js  # WhatsApp integration
├── utils/                # Utility functions
│   └── stockManager.js     # Inventory management
├── uploads/              # File storage
├── config/               # Configuration files
├── .env                  # Environment variables
├── server.js             # Main server file
└── package.json          # Dependencies and scripts
```

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens** with expiration and refresh mechanism
- **Password Hashing** using bcrypt with salt rounds
- **Role-based Access Control** (Customer, Admin)
- **Protected Routes** with middleware validation

### Data Security
- **Input Validation** with comprehensive sanitization
- **XSS Protection** through proper data handling
- **SQL Injection Prevention** via Mongoose ORM
- **CORS Configuration** for cross-origin security

### Payment Security
- **Direct Bank Transfer** without storing sensitive data
- **Payment Verification** through multiple checkpoints
- **Secure Order Processing** with transaction logging
- **Environment Variable Protection** for sensitive keys

## 📊 Analytics & Reporting

### Sales Analytics APIs
```javascript
// Get comprehensive sales report
GET /api/admin/sales-report?startDate=2025-01-01&endDate=2025-12-31

// Response includes:
{
  summary: {
    totalOrders: 1250,
    totalRevenue: 85000,
    averageOrderValue: 680,
    totalCustomers: 890
  },
  dailyRevenue: [...],
  paymentMethods: [...],
  orderStatus: [...],
  topProducts: [...]
}
```

### MongoDB Aggregation Examples
```javascript
// Daily revenue aggregation
const dailyRevenue = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      paymentStatus: 'paid'
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      revenue: { $sum: "$orderSummary.total" },
      orders: { $sum: 1 }
    }
  },
  { $sort: { "_id": 1 } }
]);
```

## 🔄 Order Processing Pipeline

### Order Lifecycle
1. **Order Creation** → Validate cart and customer details
2. **Payment Processing** → Handle payment method selection
3. **Payment Verification** → Confirm payment completion
4. **Inventory Update** → Reduce stock levels automatically
5. **Order Confirmation** → Send email/SMS notifications
6. **Order Fulfillment** → Update status to processing
7. **Shipping** → Track delivery status
8. **Completion** → Order delivered and closed

### Stock Management
```javascript
// Automatic stock reduction on payment confirmation
const updateStock = async (orderItems) => {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
  }
};
```

## 💌 Notification System

### Email Notifications
- **Order Confirmation** - Immediate order receipt
- **Payment Confirmation** - Payment success notification
- **Shipping Updates** - Delivery status changes
- **Admin Alerts** - Low stock, new orders

### WhatsApp Integration
- **Real-time Order Updates** via WhatsApp API
- **Payment Confirmation** messages
- **Delivery Notifications** with tracking
- **Customer Support** integration

## 🧪 Testing & Debugging

### Available Test Scripts
```bash
# Test database connection
node test-db-connection.js

# Test email configuration
node test-email-detailed.js

# Test WhatsApp integration
node test-whatsapp-integration.js

# Generate sample sales data
node generateSampleSales.js
```

### Debug Logging
- **Payment Debug Log** - `upi-debug.log`
- **Server Logs** - Console output with timestamps
- **Error Handling** - Comprehensive error responses
- **Request Logging** - API endpoint monitoring

## 📈 Performance Optimization

### Database Optimization
- **MongoDB Indexing** for faster queries
- **Aggregation Pipelines** for complex analytics
- **Connection Pooling** for better performance
- **Query Optimization** with proper field selection

### Caching Strategy
- **Memory Caching** for frequently accessed data
- **Database Query Optimization** with lean queries
- **File Caching** for uploaded images
- **API Response Optimization** with minimal payloads

## 🔧 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] MongoDB database secured
- [ ] SSL certificates installed
- [ ] File upload limits set
- [ ] Error logging enabled
- [ ] Payment credentials verified
- [ ] Email service configured
- [ ] Performance monitoring setup

### Deployment Commands
```bash
# Build for production
npm run build

# Start production server
npm run start:prod

# Process manager (PM2)
pm2 start server.js --name "jaimaaruthi-server"
pm2 save
pm2 startup
```

## 🤝 API Integration Guide

### Frontend Integration Example
```javascript
// Initialize API client
const API_BASE_URL = 'https://your-server-url.com/api';

// Authentication
const login = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return response.json();
};

// Direct UPI Payment
const createUPIOrder = async (orderData) => {
  const response = await fetch(`${API_BASE_URL}/payment/upi-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  return response.json();
};
```

## 📞 Support & Contact

**Store Information:**
- **Name**: Jaimaaruthi Electrical and Hardware Store
- **Owner**: Prannav P
- **UPI ID**: prannav2511@okhdfcbank
- **Bank**: Karur Vysya Bank 1054

**Technical Support:**
- **Repository**: https://github.com/Prannav-7/Electro_store_server.git
- **Issues**: Create GitHub issues for bug reports
- **Documentation**: Comprehensive API documentation included

## 📄 License

This project is proprietary software for Jaimaaruthi Electrical Store.

---

**Built with ⚡ for Jaimaaruthi Electrical and Hardware Store**

**Direct Payment Integration • Comprehensive APIs • Professional Backend Architecture**