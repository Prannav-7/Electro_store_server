const express = require('express');
const router = express.Router();
const {
  submitContactForm,
  getContactInfo
} = require('../controllers/contactController');

// Submit contact form (public)
router.post('/submit', submitContactForm);

// Get contact information (public)
router.get('/info', getContactInfo);

module.exports = router;
