/**
 * CORS Testing Script
 * Run this to test if CORS is working properly
 */

// Use built-in fetch (Node.js 18+) or require node-fetch
const fetch = globalThis.fetch || require('node-fetch');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8002';
const FRONTEND_ORIGIN = 'https://tartel-jet.vercel.app';

// Test endpoints
const tests = [
  {
    name: 'Server Health Check',
    url: `${BACKEND_URL}/api/health`,
    method: 'GET'
  },
  {
    name: 'Mobile App Health Check',
    url: `${BACKEND_URL}/api/mobile/health`,
    method: 'GET'
  },
  {
    name: 'Auth Me (OPTIONS)',
    url: `${BACKEND_URL}/api/auth/me`,
    method: 'OPTIONS'
  },
  {
    name: 'Teachers List (OPTIONS)',
    url: `${BACKEND_URL}/api/admin/teachers`,
    method: 'OPTIONS'
  },
  {
    name: 'Dashboard (OPTIONS)',
    url: `${BACKEND_URL}/api/admin/dashboard`,
    method: 'OPTIONS'
  },
  {
    name: 'Notifications (OPTIONS)',
    url: `${BACKEND_URL}/api/notifications`,
    method: 'OPTIONS'
  },
  {
    name: 'Mobile Auth (No Origin)',
    url: `${BACKEND_URL}/api/auth/me`,
    method: 'OPTIONS',
    noOrigin: true
  }
];

async function testCors() {
  console.log('🧪 Testing CORS Configuration...\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend Origin: ${FRONTEND_ORIGIN}\n`);
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add origin for web tests, skip for mobile tests
      if (!test.noOrigin) {
        headers['Origin'] = FRONTEND_ORIGIN;
      } else {
        headers['X-Platform'] = 'mobile';
        headers['X-App-Version'] = '1.0.0';
      }
      
      if (test.method === 'OPTIONS') {
        headers['Access-Control-Request-Method'] = 'GET';
        headers['Access-Control-Request-Headers'] = 'authorization,content-type';
      }
      
      const response = await fetch(test.url, {
        method: test.method,
        headers
      });
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      // Check CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('access-control-allow-origin'),
        'Access-Control-Allow-Credentials': response.headers.get('access-control-allow-credentials'),
        'Access-Control-Allow-Methods': response.headers.get('access-control-allow-methods'),
        'Access-Control-Allow-Headers': response.headers.get('access-control-allow-headers')
      };
      
      console.log('  CORS Headers:');
      Object.entries(corsHeaders).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`    ${status} ${key}: ${value || 'missing'}`);
      });
      
      if (test.method === 'GET' && response.ok) {
        const data = await response.json();
        console.log(`  Response: ${data.success ? '✅ Success' : '❌ Failed'}`);
        if (data.message) {
          console.log(`  Message: ${data.message}`);
        }
      }
      
      console.log('');
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log('🎯 CORS Test Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. If all tests pass ✅, deploy to production server');
  console.log('2. If tests fail ❌, check server is running and configurations');
  console.log('3. Test from browser console with actual frontend domain');
}

// Run tests
testCors().catch(console.error);