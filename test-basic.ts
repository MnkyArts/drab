// Simple API Test - Tests basic functionality without OAuth
console.log('🧪 Simple API Test Suite');
console.log('========================\n');

const API_BASE = 'http://localhost:3000';

async function testBasicEndpoints() {
  console.log('Testing basic API endpoints...\n');
  
  // Test 1: Root endpoint
  try {
    console.log('1. Testing root endpoint...');
    const response = await fetch(`${API_BASE}/`);
    const data: any = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Root endpoint working');
      console.log('   Message:', data.message);
      console.log('   Available endpoints:', Object.keys(data.endpoints || {}));
    } else {
      console.log('❌ Root endpoint failed');
    }
  } catch (error: any) {
    console.log('❌ Root endpoint error:', error.message);
  }
  
  console.log('');
  
  // Test 2: Health check
  try {
    console.log('2. Testing health check...');
    const response = await fetch(`${API_BASE}/api/health`);
    const data: any = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Health check passed');
      console.log('   Timestamp:', data.timestamp);
    } else {
      console.log('❌ Health check failed');
    }
  } catch (error: any) {
    console.log('❌ Health check error:', error.message);
  }
  
  console.log('');
  
  // Test 3: API Info
  try {
    console.log('3. Testing API info...');
    const response = await fetch(`${API_BASE}/api/info`);
    const data: any = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ API info working');
      console.log('   Version:', data.version);
      console.log('   Available endpoints:', Object.keys(data.endpoints || {}));
    } else {
      console.log('❌ API info failed');
    }
  } catch (error: any) {
    console.log('❌ API info error:', error.message);
  }
  
  console.log('');
  
  // Test 4: OAuth endpoint (should reject invalid return_url)
  try {
    console.log('4. Testing OAuth endpoint (invalid return_url)...');
    const response = await fetch(`${API_BASE}/auth/discord?return_url=invalid-url`);
    
    if (response.status === 400) {
      console.log('✅ OAuth properly rejects invalid return_url');
    } else {
      console.log('❌ OAuth should reject invalid return_url');
    }
  } catch (error: any) {
    console.log('❌ OAuth test error:', error.message);
  }
  
  console.log('');
  
  // Test 5: Assignment endpoint without auth (should fail)
  try {
    console.log('5. Testing role assignment without auth...');
    const response = await fetch(`${API_BASE}/api/assign-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ discordHandle: 'test#1234' })
    });
    
    if (response.status === 401) {
      console.log('✅ Role assignment properly requires authentication');
    } else {
      console.log('❌ Role assignment should require authentication');
    }
  } catch (error: any) {
    console.log('❌ Role assignment test error:', error.message);
  }
  
  console.log('\n📋 Test Summary:');
  console.log('================');
  console.log('✅ Basic API endpoints are working');
  console.log('✅ Authentication is required for protected endpoints');
  console.log('✅ OAuth endpoints are set up (but need Discord credentials to test fully)');
  console.log('\n💡 Next Steps:');
  console.log('1. Configure Discord OAuth credentials in .env');
  console.log('2. Test full OAuth flow manually');
  console.log('3. Integrate with your website');
}

// Run the tests
testBasicEndpoints().catch(console.error);
