// Simple script to add sample reviews via API
const axios = require('axios');

const addSampleReviews = async () => {
  try {
    // Get a product ID first
    const productsResponse = await axios.get('http://localhost:5000/api/products');
    const products = productsResponse.data.data;
    
    if (!products || products.length === 0) {
      console.log('No products found');
      return;
    }
    
    const productId = products[0]._id;
    console.log('Adding reviews for product:', products[0].name);
    
    // Sample reviews data
    const sampleReviews = [
      {
        productId: productId,
        rating: 5,
        title: 'Excellent quality product',
        comment: 'Very good quality and fast delivery. Highly recommended for electrical work. The product exceeded my expectations.',
        userName: 'Rajesh Kumar',
        userId: '507f1f77bcf86cd799439011',
        verified: true
      },
      {
        productId: productId,
        rating: 4,
        title: 'Good value for money',
        comment: 'Good product at reasonable price. Works as expected. Installation was easy and the build quality is solid.',
        userName: 'Priya Sharma',
        userId: '507f1f77bcf86cd799439012',
        verified: true
      },
      {
        productId: productId,
        rating: 5,
        title: 'Amazing quality',
        comment: 'Top quality electrical product. Will buy again. Perfect for my electrical work requirements.',
        userName: 'Arjun Patel',
        userId: '507f1f77bcf86cd799439013',
        verified: true
      }
    ];
    
    // Add reviews directly to database
    const mongoose = require('mongoose');
    const Review = require('./models/Review');
    const Product = require('./models/Product');
    
    await mongoose.connect('mongodb+srv://prannav7:jaiprakash@cluster0.n3vnz.mongodb.net/JaimaruthiElectricalandHardwaresStore?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');
    
    // Check if reviews already exist
    const existingReviews = await Review.find({ productId: productId });
    console.log('Existing reviews:', existingReviews.length);
    
    if (existingReviews.length === 0) {
      console.log('Adding sample reviews...');
      
      const reviewDocs = sampleReviews.map(review => new Review({
        productId: review.productId,
        userId: new mongoose.Types.ObjectId(review.userId),
        userName: review.userName,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verified: review.verified
      }));
      
      await Review.insertMany(reviewDocs);
      
      // Update product rating
      const allReviews = await Review.find({ productId: productId });
      const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
      
      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: allReviews.length
      });
      
      console.log('Sample reviews added successfully');
      console.log('New average rating:', Math.round(averageRating * 10) / 10);
      console.log('New review count:', allReviews.length);
    } else {
      console.log('Reviews already exist, skipping...');
    }
    
    console.log('✅ Review setup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

addSampleReviews();