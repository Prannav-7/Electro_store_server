const mongoose = require('mongoose');

// Middleware to check database connection before handling requests
const checkDbConnection = (req, res, next) => {
  const dbState = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  console.log(`DB Check - State: ${dbState} (${stateMap[dbState]}) for ${req.method} ${req.path}`);
  
  // Allow requests when connected or connecting (for startup)
  if (dbState === 1 || dbState === 2) {
    return next();
  }
  
  // Return service unavailable for disconnected/disconnecting states
  return res.status(503).json({
    success: false,
    message: 'Database service temporarily unavailable',
    error: 'Please try again in a few moments',
    dbState: stateMap[dbState],
    timestamp: new Date().toISOString()
  });
};

module.exports = { checkDbConnection };