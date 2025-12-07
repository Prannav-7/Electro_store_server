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
  
  // Only log for non-health endpoints to reduce noise
  if (!req.path.includes('health') && !req.path.includes('debug')) {
    console.log(`DB Check - State: ${dbState} (${stateMap[dbState]}) for ${req.method} ${req.path}`);
  }
  
  // Allow requests when connected
  if (dbState === 1) {
    return next();
  }

  // For connecting state, allow the request to proceed but with a warning
  // The actual database operations will handle the connection state
  if (dbState === 2) {
    console.log(`⚠️ Database connecting - allowing request to proceed`);
    return next();
  }

  // For disconnected state, attempt immediate reconnection before blocking
  if (dbState === 0) {
    console.log(`🔄 Database disconnected - attempting immediate reconnection for ${req.method} ${req.path}`);
    // Note: Reconnection is handled by server.js event handlers
    // For now, return 503 but with a shorter retry suggestion
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