// Test script to add reviews via API
const testAddReviews = async () => {
  try {
    console.log('Starting review test...');
    
    // Sample review data
    const sampleReviews = [
      {
        rating: 5,
        title: 'Excellent quality product',
        comment: 'Very good quality and fast delivery. Highly recommended for electrical work. The product exceeded my expectations and works perfectly.',
      },
      {
        rating: 4,
        title: 'Good value for money',
        comment: 'Good product at reasonable price. Works as expected. Installation was easy and the build quality is solid. Would buy again.',
      },
      {
        rating: 5,
        title: 'Amazing quality',
        comment: 'Top quality electrical product. Will buy again. Perfect for my electrical work requirements. Highly satisfied with the purchase.',
      }
    ];
    
    // You can manually test by:
    // 1. Opening browser console on the product details page
    // 2. Copying and pasting the review submission code
    // 3. Or use the "Write Review" button on the product page
    
    console.log('Sample reviews ready to be added:', sampleReviews);
    console.log('Use the "Write Review" button on the product page to add these reviews');
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testAddReviews();
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.testAddReviews = testAddReviews;
}