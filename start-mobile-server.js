#!/usr/bin/env node

/**
 * Quick Start Script for Mobile App Server
 * This script checks and starts the server with proper mobile app configuration
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8002;
const CHECK_URL = `http://localhost:${PORT}/api/mobile/health`;

console.log('📱 Starting Tartel Mobile API Server...\n');

// Check if port is already in use
function checkPort() {
  return new Promise((resolve) => {
    exec(`lsof -ti:${PORT}`, (error, stdout) => {
      if (stdout.trim()) {
        console.log(`⚠️  Port ${PORT} is already in use (PID: ${stdout.trim()})`);
        console.log('   This might mean the mobile server is already running.');
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Check if server is responding
function checkHealth() {
  return new Promise((resolve) => {
    exec(`curl -s ${CHECK_URL}`, (error, stdout) => {
      try {
        const response = JSON.parse(stdout);
        if (response.success) {
          console.log('✅ Mobile server is already running and healthy!');
          console.log(`📊 Uptime: ${Math.round(response.uptime)}s`);
          console.log(`💾 Memory: ${response.memory?.used || 0}MB used`);
          resolve(true);
        }
      } catch (e) {
        resolve(false);
      }
    });
  });
}

// Start the server
function startServer() {
  console.log('🚀 Starting new mobile server instance...\n');
  
  // Set environment for mobile app
  const env = {
    ...process.env,
    PORT: PORT,
    NODE_ENV: 'development',
    HOST: '0.0.0.0'
  };
  
  const serverProcess = spawn('node', ['app.js'], {
    stdio: 'inherit',
    env: env,
    cwd: __dirname
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`\n📱 Mobile server stopped with code ${code}`);
    if (code !== 0) {
      console.log('💡 Server may have crashed. Check the logs above.');
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📱 Shutting down mobile server gracefully...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
  
  console.log('📱 Mobile server starting...');
  console.log(`🌐 Health check will be available at: ${CHECK_URL}`);
  console.log('Press Ctrl+C to stop\n');
}

// Start with PM2 (if available)
function startWithPM2() {
  return new Promise((resolve) => {
    exec('which pm2', (error) => {
      if (error) {
        console.log('💡 PM2 not found. Starting with Node.js directly...\n');
        resolve(false);
      } else {
        console.log('🔄 Starting with PM2 for better mobile app stability...\n');
        
        const pm2Process = spawn('pm2', ['start', 'ecosystem.config.js', '--env', 'mobile_dev'], {
          stdio: 'inherit'
        });
        
        pm2Process.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Started with PM2!');
            console.log('💡 Use "pm2 logs tartel-mobile-api" to see logs');
            console.log('💡 Use "pm2 stop tartel-mobile-api" to stop');
            resolve(true);
          } else {
            console.log('⚠️  PM2 start failed, falling back to Node.js...\n');
            resolve(false);
          }
        });
      }
    });
  });
}

// Main execution
async function main() {
  try {
    // First check if server is already healthy
    if (await checkHealth()) {
      process.exit(0);
    }
    
    // Check if port is in use
    if (!(await checkPort())) {
      console.log('💡 Try stopping the existing process first:');
      console.log(`   lsof -ti:${PORT} | xargs kill -9`);
      console.log('   Or use a different port: PORT=8003 node start-mobile-server.js\n');
      process.exit(1);
    }
    
    // Try PM2 first, fallback to regular Node.js
    if (!(await startWithPM2())) {
      startServer();
    }
    
  } catch (error) {
    console.error('❌ Error starting mobile server:', error);
    process.exit(1);
  }
}

// Show usage info
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📱 Tartel Mobile API Server

Usage:
  node start-mobile-server.js     Start the mobile server
  node start-mobile-server.js -h  Show this help

Environment variables:
  PORT=8002                       Server port (default: 8002)
  NODE_ENV=development           Environment (default: development)

Examples:
  PORT=8003 node start-mobile-server.js    Start on port 8003
  NODE_ENV=production node start-mobile-server.js

Health check:
  curl http://localhost:${PORT}/api/mobile/health

PM2 commands (if using PM2):
  pm2 logs tartel-mobile-api      Show logs
  pm2 restart tartel-mobile-api   Restart server
  pm2 stop tartel-mobile-api      Stop server
  pm2 delete tartel-mobile-api    Remove from PM2
`);
  process.exit(0);
}

main();