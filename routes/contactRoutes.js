const express = require('express');
const router = express.Router();
const {
  submitContactForm,
  getContactInfo,
  submitChatbotInquiry
} = require('../controllers/contactController');

// Submit contact form (public)
router.post('/submit', submitContactForm);

// Submit chatbot inquiry (public)
router.post('/chatbot-inquiry', submitChatbotInquiry);

// Get contact information (public)
router.get('/info', getContactInfo);

module.exports = router;
