/**
 * Keep Alive middleware to prevent server timeout
 * Especially important for mobile apps and long-running connections
 */

/**
 * Keep alive middleware for HTTP connections
 */
function keepAliveMiddleware(req, res, next) {
  // Set keep-alive headers
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30, max=1000');
  
  // Add mobile app friendly headers
  if (req.headers['x-platform'] || req.headers['user-agent']?.includes('Mobile')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
}

/**
 * Server configuration for keep-alive and timeouts
 */
function configureServer(server) {
  // Set keep-alive timeout
  server.keepAliveTimeout = 30000; // 30 seconds
  server.headersTimeout = 35000; // 35 seconds (should be > keepAliveTimeout)
  
  // Set max connections
  server.maxConnections = 1000;
  
  // Handle server errors gracefully
  server.on('error', (error) => {
    console.error('❌ Server error:', error.message);
    
    // Don't crash on EADDRINUSE, just log it
    if (error.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${error.port} is already in use. Server may already be running.`);
      return;
    }
    
    // Don't crash on connection errors
    if (error.code === 'ECONNRESET' || error.code === 'EPIPE') {
      console.log('⚠️  Client connection lost:', error.code);
      return;
    }
    
    // Log other errors but don't crash
    console.error('Server error details:', error);
  });
  
  // Handle client connection errors
  server.on('clientError', (error, socket) => {
    console.log('⚠️  Client error:', error.message);
    
    // Close the socket gracefully
    if (socket.writable) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
  });
  
  // Handle timeout
  server.on('timeout', (socket) => {
    console.log('⚠️  Server timeout - keeping connection alive');
    // Don't destroy the socket, just log
  });
  
  return server;
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(server) {
  const gracefulShutdown = (signal) => {
    console.log(`\n📱 ${signal} received. Starting graceful shutdown...`);
    
    server.close((err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.log('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
  
  // Handle different shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
}

/**
 * Health check for mobile apps
 */
function mobileHealthCheck(req, res, next) {
  // Special health endpoint for mobile apps
  if (req.path === '/api/mobile/health' || req.path === '/mobile/health') {
    return res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      server: {
        port: process.env.PORT || 8002,
        environment: process.env.NODE_ENV || 'development'
      },
      mobile: {
        platform: req.headers['x-platform'] || 'unknown',
        appVersion: req.headers['x-app-version'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    });
  }
  
  next();
}

module.exports = {
  keepAliveMiddleware,
  configureServer,
  setupGracefulShutdown,
  mobileHealthCheck
};