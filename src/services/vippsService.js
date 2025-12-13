const axios = require('axios');
const { createVippsAuthHeader } = require('../utils/helpers');

// Debug: Log all relevant environment variables
console.log('\n=== Vipps Service Debug ===');
console.log('Environment Variables Loaded:');
const envVars = [
  'NODE_ENV',
  'VIPPS_API_URL',
  'VIPPS_CLIENT_ID',
  'VIPPS_CLIENT_SECRET',
  'VIPPS_REDIRECT_URI',
  'VIPPS_OCP_APIM_SUBSCRIPTION_KEY',
  'VIPPS_OCP_APIM_SUBSCRIPTION_KEY_SECONDARY',
  'VIPPS_MERCHANT_SERIAL_NUMBER'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  const displayValue = value ? (varName.includes('KEY') || varName.includes('SECRET') ? '***' + value.slice(-4) : value) : '❌ Not Set';
  console.log(`  ${varName}: ${displayValue}`);
});
console.log('==========================\n');

const {
  VIPPS_API_URL,
  VIPPS_CLIENT_ID,
  VIPPS_CLIENT_SECRET,
  VIPPS_REDIRECT_URI,
  VIPPS_OCP_APIM_SUBSCRIPTION_KEY,
  VIPPS_MERCHANT_SERIAL_NUMBER
} = process.env;

const VIPPS_SUBSCRIPTION_KEY = VIPPS_OCP_APIM_SUBSCRIPTION_KEY;

// Validate critical environment variables
if (!VIPPS_CLIENT_SECRET) {
  console.error('❌ CRITICAL: VIPPS_CLIENT_SECRET is not set!');
  throw new Error('VIPPS_CLIENT_SECRET environment variable is required');
}

const VIPPS_HEADERS = {
  'Vipps-System-Name': 'vipps-login-test-app',
  'Vipps-System-Version': '1.0.0',
  'Vipps-System-Plugin-Name': 'express-backend',
  'Vipps-System-Plugin-Version': '1.0.0',
  // Include merchant serial number on all Vipps requests
  'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER
};

function getAuthorizationUrl(state) {
  console.log('\n=== Generating Authorization URL ===');
  console.log('Input state:', state);
  
  const baseUrl = `${VIPPS_API_URL}/access-management-1.0/access/oauth2/auth`;
  console.log('Base URL:', baseUrl);
  
  const params = new URLSearchParams({
    client_id: VIPPS_CLIENT_ID,
    response_type: 'code',
    scope: 'openid name phoneNumber email address birthDate',
    state,
    redirect_uri: VIPPS_REDIRECT_URI
  });

  const authUrl = `${baseUrl}?${params.toString()}`;
  console.log('Generated Auth URL:', authUrl);
  console.log('==============================\n');
  
  return authUrl;
}

async function exchangeCodeForTokens(code) {
  try {
    console.log('\n=== Exchanging Code for Tokens ===');
    console.log('Code:', code ? code.substring(0, 20) + '...' : 'MISSING');
    
    const url = `${VIPPS_API_URL}/access-management-1.0/access/oauth2/token`;
    const headers = {
      ...VIPPS_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: createVippsAuthHeader(VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET),
      'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY
    };

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: VIPPS_REDIRECT_URI
    });

    console.log('Token Exchange URL:', url);
    console.log('Redirect URI:', VIPPS_REDIRECT_URI);
    console.log('Client ID:', VIPPS_CLIENT_ID);
    console.log('Subscription Key:', VIPPS_SUBSCRIPTION_KEY ? '***' + VIPPS_SUBSCRIPTION_KEY.slice(-4) : 'MISSING');

    const response = await axios.post(url, body, { headers });
    console.log('✓ Token exchange successful');
    console.log('==============================\n');
    return response.data;
  } catch (error) {
    console.error('\n❌ Token exchange failed');
    console.error('Status:', error.response?.status);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error Message:', error.message);
    console.error('==============================\n');
    
    const errorMsg = error.response?.data?.error_description || error.response?.data?.error || error.message;
    throw new Error(`Failed to exchange code for tokens: ${errorMsg}`);
  }
}

async function getUserInfo(accessToken) {
  try {
    const url = `${VIPPS_API_URL}/vipps-userinfo-api/userinfo`;
    const headers = {
      ...VIPPS_HEADERS,
      Authorization: `Bearer ${accessToken}`,
      'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to retrieve Vipps user info: ${error.message}`);
  }
}

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  getUserInfo
};
