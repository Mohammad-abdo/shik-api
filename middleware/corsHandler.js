/**
 * Enhanced CORS middleware for handling all CORS-related headers
 */

const allowedOrigins = "*"

/**
 * Custom CORS handler that ensures proper headers for all requests
 */
function corsHandler(req, res, next) {
  // Allow all origins - simple and effective for mobile + web apps
  res.header('Access-Control-Allow-Origin', '*');
  
  // Set essential CORS headers
  res.header('Access-Control-Allow-Credentials', 'false'); // Can't use credentials with '*'
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, X-App-Version, X-Platform'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD'
  );
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Additional headers for mobile apps
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Request-Id, X-Response-Time');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}

/**
 * Middleware to add CORS headers to all responses
 */
function addCorsHeaders(req, res, next) {
  // Allow all origins - simple and effective
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Vary', 'Origin');
  
  next();
}

module.exports = {
  corsHandler,
  addCorsHeaders,
  allowedOrigins
};