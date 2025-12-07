const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  customerDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: false },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String
  },
  orderSummary: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    itemCount: { type: Number, required: true }
  },
  paymentDetails: {
    paymentId: String,
    orderId: String,
    signature: String,
    method: {
      type: String,
      enum: ['razorpay', 'cod', 'upi', 'card', 'wallet', 'netbanking'],
      default: 'cod'
    },
    status: {
      type: String,
      enum: ['pending', 'pending_verification', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    selectedOption: String, // For storing specific payment option like 'gpay', 'phonepe', etc.
    razorpay_order_id: String, // Razorpay order ID
    razorpay_payment_id: String, // Razorpay payment ID
    payment_link: String, // Payment link used
    amount: Number, // Payment amount
    timestamp: Date, // Payment timestamp
    verification_notes: String // Admin notes for payment verification
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderNumber: {
    type: String,
    unique: true
  },
  estimatedDelivery: {
    type: Date
  },
  trackingId: String
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
  }
  
  if (!this.trackingId) {
    this.trackingId = 'TRK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  
  // Set estimated delivery (7 days from order date)
  if (!this.estimatedDelivery) {
    this.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

module.exports = mongoose.model('Order', orderSchema);
