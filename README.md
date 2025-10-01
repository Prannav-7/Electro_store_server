# Electro Store Server

🔌 **Complete Node.js/Express backend for Jaimaaruthi Electrical and Hardware Store**

## 🚀 Features

### 🛡️ **Authentication & Authorization**
- JWT-based authentication system
- Role-based access control (Admin/Customer)
- Secure password hashing with bcrypt
- Token-based session management

### 🛒 **E-commerce Core**
- **Product Management**: CRUD operations, categories, inventory tracking
- **Order System**: Complete order lifecycle management
- **Shopping Cart**: Persistent cart functionality
- **Wishlist**: Save products for later
- **User Accounts**: Profile management, order history

### 💳 **Payment Integration**
- **Razorpay Live Integration**: Real payment processing
- **UPI Support**: Direct UPI payments
- **Cash on Delivery**: COD option available
- **Payment Verification**: Secure payment confirmation

### 🤖 **AI-Powered Features**
- **ChatGPT Integration**: Intelligent product recommendations
- **Smart Customer Support**: AI-powered chat assistance
- **Product Query Handling**: Natural language product search

### 📊 **Analytics & Reporting**
- **Sales Analytics**: Revenue tracking, order statistics
- **Monthly Reports**: Comprehensive sales reports
- **Product Performance**: Best-selling products analysis
- **Customer Insights**: User behavior analytics

### 📧 **Communication**
- **Email Service**: Order confirmations, notifications
- **WhatsApp Integration**: Order updates via WhatsApp
- **Contact Forms**: Customer inquiry handling

## 🛠️ **Tech Stack**

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Payments**: Razorpay API
- **AI**: OpenAI GPT API
- **Email**: Nodemailer
- **File Upload**: Multer
- **Environment**: dotenv

## 📦 **API Endpoints**

### 🔐 **Authentication**
```
POST /api/users/register     - User registration
POST /api/users/login        - User login
POST /api/users/admin-login  - Admin login
GET  /api/users/profile      - Get user profile
PUT  /api/users/profile      - Update profile
```

### 🛍️ **Products**
```
GET    /api/products         - Get all products
GET    /api/products/:id     - Get product by ID
POST   /api/products         - Create product (Admin)
PUT    /api/products/:id     - Update product (Admin)
DELETE /api/products/:id     - Delete product (Admin)
POST   /api/products/:id/restock - Restock product
```

### 🛒 **Orders**
```
GET  /api/orders             - Get user orders
GET  /api/orders/:id         - Get order details
POST /api/orders             - Create new order
PUT  /api/orders/:id/status  - Update order status (Admin)
GET  /api/orders/:id/invoice - Download invoice
```

### 💳 **Payments**
```
POST /api/payment/create-order    - Create Razorpay order
POST /api/payment/verify          - Verify payment
GET  /api/payment/methods         - Get payment methods
```

### 🤖 **Chatbot**
```
POST /api/chatbot/query      - Send message to AI assistant
GET  /api/chatbot/health     - Check chatbot status
```

### 📊 **Analytics**
```
GET /api/analytics/sales     - Get sales analytics
GET /api/analytics/monthly   - Monthly sales report
GET /api/analytics/products  - Product performance
```

## 🚀 **Quick Start**

### 1. **Clone Repository**
```bash
git clone https://github.com/Prannav-7/Electro_store_server.git
cd Electro_store_server
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Environment Setup**
Create `.env` file:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# OpenAI Configuration (for ChatGPT)
OPENAI_API_KEY=your_openai_api_key
```

### 4. **Start Development Server**
```bash
npm run dev
# or
node server.js
```

### 5. **Seed Database (Optional)**
```bash
node seedDatabase.js
```

## 📋 **Available Scripts**

```bash
npm start        # Production server
npm run dev      # Development with nodemon
npm run seed     # Seed sample data
npm test         # Run tests
```

## 🗄️ **Database Models**

### **User Schema**
- Authentication credentials
- Profile information
- Admin role management
- Order history references

### **Product Schema**
- Product details and specifications
- Category and subcategory classification
- Pricing and inventory tracking
- Image and brand information

### **Order Schema**
- Complete order information
- Item details and quantities
- Payment and shipping status
- Invoice generation support

### **Cart Schema**
- User-specific cart items
- Quantity management
- Product references

## 🔧 **Configuration**

### **MongoDB Setup**
- Database: `Electro`
- Collections: `users`, `products`, `orders`, `carts`, `wishlists`, `reviews`

### **Razorpay Setup**
- Live mode configuration
- UPI payment support
- Webhook handling for payment verification

### **Email Configuration**
- SMTP setup for notifications
- Order confirmation emails
- Password reset functionality

## 🚀 **Deployment**

### **Render Deployment**
This server is deployed on Render at: `https://electro-store-server-8n0d.onrender.com`

### **Environment Variables (Production)**
Set the following in your hosting platform:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `RAZORPAY_KEY_ID` - Razorpay key ID
- `RAZORPAY_KEY_SECRET` - Razorpay secret
- `EMAIL_USER` - Email service user
- `EMAIL_PASS` - Email service password
- `OPENAI_API_KEY` - OpenAI API key

## 📊 **Current Data**

- **Products**: 16+ electrical products seeded
- **Categories**: 9 main categories
- **Orders**: Sample orders with ₹2,50,975 revenue
- **Users**: Admin and customer accounts

## 🛡️ **Security Features**

- Input validation and sanitization
- CORS configuration
- JWT token expiration handling
- Password hashing with salt
- Rate limiting for API endpoints
- Secure file upload handling

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 **License**

This project is licensed under the MIT License.

## 📞 **Support**

For support and queries:
- **Email**: info.jaimaaruthi@gmail.com
- **Phone**: +91-8838686407
- **UPI**: prannav2511@okhdfcbank

---

🔌 **Built with ❤️ for Jaimaaruthi Electrical and Hardware Store**