require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const VIPPS_API_URL = process.env.VIPPS_API_URL;
const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET;
const VIPPS_REDIRECT_URI = process.env.VIPPS_REDIRECT_URI;
const APP_REDIRECT_SCHEME = process.env.APP_REDIRECT_SCHEME;

console.log('\n=== VIPPS OAuth Flow Test ===\n');
console.log('Configuration:');
console.log(`- Base URL: ${BASE_URL}`);
console.log(`- Vipps API: ${VIPPS_API_URL}`);
console.log(`- Client ID: ${VIPPS_CLIENT_ID}`);
console.log(`- Redirect URI: ${VIPPS_REDIRECT_URI}`);
console.log(`- App Scheme: ${APP_REDIRECT_SCHEME}`);
console.log('\n');

async function testOAuthFlow() {
  try {
    // Step 1: Get login URL
    console.log('STEP 1: Initiating login...');
    const loginResponse = await axios.get(`${BASE_URL}/auth/vipps/login`);
    const { authUrl, sessionId } = loginResponse.data;
    
    console.log('✓ Login initiated');
    console.log(`  Session ID: ${sessionId}`);
    console.log(`  Auth URL: ${authUrl}`);
    console.log('\nNext steps:');
    console.log('1. Open this URL in Safari: ' + authUrl);
    console.log('2. Sign in with your Vipps test account');
    console.log('3. Allow the login request');
    console.log('4. You will be redirected to: ' + VIPPS_REDIRECT_URI);
    console.log('\nThe server will then redirect you to:');
    console.log(`${APP_REDIRECT_SCHEME}://auth/callback?success=true&sessionId=${sessionId}`);
    console.log('\n---\n');

    // Step 2: Simulate callback (you would normally do this manually)
    console.log('STEP 2: Testing callback endpoint...');
    console.log(`Callback URL: ${BASE_URL}/auth/vipps/callback`);
    console.log('(In production, Vipps will call this endpoint with code and state parameters)\n');

    // Step 3: Check session endpoint
    console.log('STEP 3: Testing session check endpoint...');
    const sessionCheckUrl = `${BASE_URL}/auth/session/${sessionId}`;
    console.log(`Session Check URL: ${sessionCheckUrl}`);
    
    try {
      const sessionResponse = await axios.get(sessionCheckUrl);
      console.log('✓ Session check successful');
      console.log('Response:', JSON.stringify(sessionResponse.data, null, 2));
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('⚠ Session not authenticated yet (expected - waiting for Vipps callback)');
      } else {
        console.error('✗ Session check failed:', err.message);
      }
    }

    console.log('\n---\n');
    console.log('DEBUGGING TIPS:');
    console.log('1. Check server logs for "=== VIPPS CALLBACK RECEIVED ===" messages');
    console.log('2. Verify APP_REDIRECT_SCHEME is set correctly in .env');
    console.log('3. Check that VIPPS_REDIRECT_URI matches your Vipps portal settings');
    console.log('4. If you see "404" error, it likely means the app scheme redirect is failing');
    console.log('5. The 404 might be from your iOS app not having the deep link handler configured');
    console.log('\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOAuthFlow();
