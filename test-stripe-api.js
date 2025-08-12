// Test script for Stripe Connect API
// Run with: node test-stripe-api.js

import https from 'https';

const baseUrl = 'https://workspace.alexneilson02.repl.co';

// Test function to login and test Stripe Connect
async function testStripeConnect() {
  console.log('🧪 Testing Stripe Connect Integration...\n');

  // Step 1: Login
  console.log('1. Testing login...');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    username: 'sales123',
    password: 'password'
  });
  
  if (loginResult.error) {
    console.log('❌ Login failed:', loginResult.error);
    return;
  }
  console.log('✅ Login successful');

  // Step 2: Check account status
  console.log('\n2. Checking Stripe Connect status...');
  const statusResult = await makeRequest('GET', '/api/stripe-connect/accounts/status');
  console.log('📊 Account status:', statusResult);

  // Step 3: Create account if needed
  if (!statusResult.accountId) {
    console.log('\n3. Creating Stripe Connect account...');
    const createResult = await makeRequest('POST', '/api/stripe-connect/accounts/create');
    console.log('🆕 Account creation result:', createResult);
  }

  console.log('\n✅ Test complete! Check the web interface for full onboarding flow.');
}

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'workspace.alexneilson02.repl.co',
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: 'Invalid JSON response', body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Run the test
testStripeConnect().catch(console.error);