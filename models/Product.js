const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: [
      'Electrical Goods',
      'Hardware & Tools', 
      'Wiring & Cables',
      'Switches & Sockets',
      'Lighting Solutions',
      'Fans & Ventilation',
      'Electrical Motors',
      'Safety Equipment',
      'Building Materials',
      'Plumbing Supplies',
      'Paint & Finishes',
      'Steel & Metal Products',
      'Pipes & Fittings',
      'Power Tools',
      'Hand Tools'
    ],
    default: 'Electrical Goods'
  },
  subcategory: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  mrp: {
    type: Number,
    min: [0, 'MRP cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    enum: ['piece', 'meter', 'kg', 'liter', 'box', 'set', 'pair', 'roll', 'bundle', 'bag', 'packet', 'bottle', 'can', 'tube', 'sheet', 'coil', 'carton', 'cubic meter'],
    default: 'piece'
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    default: '/images/default-product.jpg'
  },
  images: [{
    url: String,
    alt: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  // New review fields
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  specifications: {
    voltage: String,
    wattage: String,
    size: String,
    material: String,
    color: String,
    warranty: String,
    certification: String,
    amperage: String,
    frequency: String,
    powerConsumption: String,
    dimensions: String,
    weight: String
  },
  tags: [String],
  supplier: {
    name: String,
    contact: String,
    location: String
  },
  discount: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    validUntil: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'Out of Stock';
  if (this.stock < 10) return 'Low Stock';
  return 'In Stock';
});

// Virtual for final price after discount
productSchema.virtual('finalPrice').get(function() {
  if (this.discount.percentage > 0 && (!this.discount.validUntil || this.discount.validUntil > Date.now())) {
    return this.price * (1 - this.discount.percentage / 100);
  }
  return this.price;
});

// Virtual for savings amount
productSchema.virtual('savings').get(function() {
  if (this.mrp && this.mrp > this.price) {
    return this.mrp - this.finalPrice;
  }
  return 0;
});

module.exports = mongoose.model('Product', productSchema);
