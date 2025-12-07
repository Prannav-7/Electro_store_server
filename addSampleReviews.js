const mongoose = require('mongoose');
const Review = require('./models/Review');
const Product = require('./models/Product');

mongoose.connect('mongodb+srv://prannav7:jaiprakash@cluster0.n3vnz.mongodb.net/JaimaruthiElectricalandHardwaresStore?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
  console.log('Connected to MongoDB');
  
  // Get first few products
  const products = await Product.find().limit(5);
  if (!products.length) {
    console.log('No products found');
    process.exit(0);
  }
  
  console.log(`Found ${products.length} products to add reviews for`);
  
  for (const product of products) {
    console.log(`\nProcessing product: ${product.name}`);
    console.log('Current rating:', product.averageRating || 0);
    console.log('Current review count:', product.reviewCount || 0);
    
    // Check existing reviews
    const existingReviews = await Review.find({ productId: product._id });
    console.log('Existing reviews:', existingReviews.length);
    
    if (existingReviews.length === 0) {
      console.log('Adding sample reviews...');
      
      // Generate random number of reviews (1-5)
      const numReviews = Math.floor(Math.random() * 5) + 1;
      const sampleUserNames = [
        'Rajesh Kumar', 'Priya Sharma', 'Arjun Patel', 'Sunitha Reddy', 
        'Vikram Singh', 'Meera Joshi', 'Ravi Krishnan', 'Deepika Nair',
        'Amit Gupta', 'Kavitha Rao'
      ];
      
      const sampleComments = [
        'Excellent quality product. Very satisfied with the purchase.',
        'Good value for money. Works as expected.',
        'Top quality electrical product. Highly recommended.',
        'Fast delivery and good packaging. Product is working fine.',
        'Reliable product from a trusted brand. Will order again.',
        'Great quality and reasonable price. Exactly what I needed.',
        'Perfect for my electrical work. Good build quality.',
        'Satisfied with the product quality and service.',
        'Good product overall. No complaints.',
        'Excellent service and product quality. Recommended.'
      ];
      
      const sampleReviews = [];
      for (let i = 0; i < numReviews; i++) {
        const rating = Math.floor(Math.random() * 2) + 4; // Rating between 4-5
        sampleReviews.push({
          productId: product._id,
          userId: new mongoose.Types.ObjectId(),
          userName: sampleUserNames[Math.floor(Math.random() * sampleUserNames.length)],
          rating: rating,
          title: rating === 5 ? 'Excellent product' : 'Good quality',
          comment: sampleComments[Math.floor(Math.random() * sampleComments.length)],
          verified: true
        });
      }
      
      await Review.insertMany(sampleReviews);
      
      // Update product rating
      const allReviews = await Review.find({ productId: product._id });
      const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
      
      await Product.findByIdAndUpdate(product._id, {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: allReviews.length
      });
      
      console.log(`Added ${numReviews} reviews`);
      console.log('New average rating:', Math.round(averageRating * 10) / 10);
      console.log('New review count:', allReviews.length);
    } else {
      console.log('Reviews already exist, skipping...');
    }
  }
  
  console.log('\n✅ Sample reviews setup completed successfully!');
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});