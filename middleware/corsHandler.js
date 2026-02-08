/**
 * Enhanced CORS middleware for handling all CORS-related headers
 */

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'https://tartel-jet.vercel.app',
  'https://tarteel-platform.vercel.app',
  // Add any additional domains here
];

/**
 * Custom CORS handler that ensures proper headers for all requests
 */
function corsHandler(req, res, next) {
  const origin = req.headers.origin;
  
  // Check if origin is in allowed list or if it's undefined (for same-origin requests)
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  // Set essential CORS headers
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD'
  );
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
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
  const origin = req.headers.origin;
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  
  next();
}

module.exports = {
  corsHandler,
  addCorsHeaders,
  allowedOrigins
};