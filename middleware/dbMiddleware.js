const mongoose = require('mongoose');

// Middleware to check database connection before handling requests
const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable',
      error: 'Please try again in a few moments'
    });
  }
  next();
};

module.exports = { checkDbConnection };