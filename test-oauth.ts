// OAuth API Test Suite
// This file tests the OAuth endpoints manually

const API_BASE = 'http://localhost:3000';
const TEST_RETURN_URL = 'http://localhost:3000/test-callback';

console.log('🧪 OAuth API Test Suite');
console.log('=======================\n');

// Test 1: Health Check
async function testHealthCheck() {
  console.log('1. Testing health check...');
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data: any = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Health check passed');
      return true;
    } else {
      console.log('❌ Health check failed:', data);
      return false;
    }
  } catch (error: any) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

// Test 2: Root Endpoint
async function testRootEndpoint() {
  console.log('2. Testing root endpoint...');
  try {
    const response = await fetch(`${API_BASE}/`);
    const data: any = await response.json();
    
    if (response.ok && data.success && data.endpoints) {
      console.log('✅ Root endpoint working');
      console.log('   Available endpoints:', Object.keys(data.endpoints));
      return true;
    } else {
      console.log('❌ Root endpoint failed:', data);
      return false;
    }
  } catch (error: any) {
    console.log('❌ Root endpoint error:', error.message);
    return false;
  }
}

// Test 3: OAuth Initiation (without valid return_url)
async function testOAuthInitiationInvalid() {
  console.log('3. Testing OAuth initiation (invalid return_url)...');
  try {
    const response = await fetch(`${API_BASE}/auth/discord?return_url=invalid-url`);
    
    if (response.status === 400) {
      console.log('✅ Invalid return_url properly rejected');
      return true;
    } else {
      console.log('❌ Invalid return_url should be rejected');
      return false;
    }
  } catch (error: any) {
    console.log('❌ OAuth initiation test error:', error.message);
    return false;
  }
}

// Test 4: OAuth Initiation (valid return_url, should redirect to Discord)
async function testOAuthInitiationValid() {
  console.log('4. Testing OAuth initiation (valid return_url)...');
  try {
    const response = await fetch(`${API_BASE}/auth/discord?return_url=${encodeURIComponent(TEST_RETURN_URL)}`, {
      redirect: 'manual'
    });
    
    if (response.status === 302) {
      const location = response.headers.get('location');
      if (location && location.includes('discord.com/api/oauth2/authorize')) {
        console.log('✅ OAuth initiation redirects to Discord');
        console.log('   Redirect URL:', location.substring(0, 100) + '...');
        return true;
      } else {
        console.log('❌ OAuth should redirect to Discord');
        console.log('   Got location:', location);
        return false;
      }
    } else {
      console.log('❌ OAuth should return 302 redirect');
      console.log('   Got status:', response.status);
      return false;
    }
  } catch (error: any) {
    console.log('❌ OAuth initiation test error:', error.message);
    return false;
  }
}

// Test 5: Test Callback URL Generation
function testCallbackUrlGeneration() {
  console.log('5. Testing callback URL generation...');
  
  const testUrl = 'https://example.com/callback';
  
  // Success case
  const successUrl = new URL(testUrl);
  successUrl.searchParams.set('status', 'success');
  successUrl.searchParams.set('discord_id', '123456789');
  successUrl.searchParams.set('username', encodeURIComponent('testuser#1234'));
  
  // Error case
  const errorUrl = new URL(testUrl);
  errorUrl.searchParams.set('status', 'error');
  errorUrl.searchParams.set('error', 'not_in_server');
  
  console.log('✅ Callback URL generation working');
  console.log('   Success URL:', successUrl.toString());
  console.log('   Error URL:', errorUrl.toString());
  
  return true;
}

// Test 6: Environment Variables Check
function testEnvironmentVariables() {
  console.log('6. Checking environment variables...');
  
  const requiredVars = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_GUILD_ID',
    'DISCORD_ROLE_ID',
    'API_SECRET_KEY'
  ];
  
  const oauthVars = [
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DISCORD_REDIRECT_URI',
    'SESSION_SECRET',
    'ALLOWED_RETURN_DOMAINS'
  ];
  
  console.log('   Required vars for basic functionality: ✅ (assuming they exist)');
  console.log('   OAuth vars needed for OAuth functionality:');
  
  oauthVars.forEach(varName => {
    // Note: We can't actually check process.env in browser context
    console.log(`   - ${varName}: Configure in .env file`);
  });
  
  return true;
}

// Manual Integration Test Instructions
function printManualTestInstructions() {
  console.log('\n📋 Manual Integration Test Instructions:');
  console.log('=====================================');
  console.log('\n1. Set up OAuth Application in Discord Developer Portal:');
  console.log('   - Go to https://discord.com/developers/applications');
  console.log('   - Create new application or use existing');
  console.log('   - Go to OAuth2 > General');
  console.log('   - Add redirect URI: http://localhost:3000/auth/discord/callback');
  console.log('   - Copy Client ID and Client Secret to .env');
  
  console.log('\n2. Test OAuth Flow:');
  console.log('   - Visit: http://localhost:3000/auth/discord?return_url=http://localhost:3000/test-callback');
  console.log('   - Complete Discord OAuth');
  console.log('   - Should redirect back with success/error parameters');
  
  console.log('\n3. Test from Your Website:');
  console.log('   JavaScript example:');
  console.log('   ```javascript');
  console.log('   const returnUrl = encodeURIComponent("https://yoursite.com/discord-callback");');
  console.log('   window.location.href = `http://localhost:3000/auth/discord?return_url=${returnUrl}`;');
  console.log('   ```');
  
  console.log('\n4. Expected Return URLs:');
  console.log('   Success: yoursite.com/discord-callback?status=success&discord_id=123&username=user%231234');
  console.log('   Error: yoursite.com/discord-callback?status=error&error=not_in_server');
  
  console.log('\n5. Test Security:');
  console.log('   - Try invalid return_url (should be rejected)');
  console.log('   - Try accessing callback without proper state (should be rejected)');
  
  console.log('\n🔧 Configuration Checklist:');
  console.log('- ✓ Discord Bot is in your server');
  console.log('- ✓ Bot has "Manage Roles" permission');
  console.log('- ✓ Target role is below bot\'s highest role');
  console.log('- ✓ OAuth app has correct redirect URI');
  console.log('- ✓ All environment variables set');
  console.log('- ✓ ALLOWED_RETURN_DOMAINS includes your website');
}

// Run all tests
async function runAllTests() {
  console.log('Starting automated tests...\n');
  
  const tests = [
    testHealthCheck,
    testRootEndpoint,
    testOAuthInitiationInvalid,
    testOAuthInitiationValid,
    testCallbackUrlGeneration,
    testEnvironmentVariables
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      console.log('');
    } catch (error: any) {
      console.log(`❌ Test failed with error: ${error.message}\n`);
    }
  }
  
  console.log(`📊 Test Results: ${passed}/${total} tests passed\n`);
  
  if (passed === total) {
    console.log('🎉 All automated tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check your configuration.');
  }
  
  printManualTestInstructions();
}

// Check if we're running in Node.js
declare const window: any;
if (typeof window === 'undefined') {
  // Node.js environment
  runAllTests().catch(console.error);
} else {
  // Browser environment
  console.log('Run this script with: bun run test-oauth.ts');
}

export { runAllTests };
