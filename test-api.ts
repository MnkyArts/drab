#!/usr/bin/env bun

/**
 * Test Script for Discord Role Assignment Bot
 * 
 * This script helps test the API endpoints without needing a full website integration.
 * Run with: bun run test-api.ts
 */

import 'dotenv/config';

const API_BASE_URL = `http://localhost:${process.env.API_PORT || 3000}`;
const API_KEY = process.env.API_SECRET_KEY;

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
}

interface APIResponse {
  status: number;
  data: any;
  success: boolean;
}

class APITester {
  private results: TestResult[] = [];

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any, headers: Record<string, string> = {}): Promise<APIResponse> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      
      return {
        status: response.status,
        data,
        success: response.ok
      };
    } catch (error: any) {
      return {
        status: 0,
        data: { error: error?.message || 'Network error' },
        success: false
      };
    }
  }

  private addResult(test: string, success: boolean, message: string, data?: any) {
    this.results.push({ test, success, message, data });
  }

  async testHealthEndpoint() {
    console.log('🔍 Testing health endpoint...');
    
    const result = await this.makeRequest('/api/health');
    
    if (result.success && result.data?.success) {
      this.addResult('Health Check', true, 'API is healthy');
    } else {
      this.addResult('Health Check', false, `Health check failed: ${result.data?.message || 'Unknown error'}`);
    }
  }

  async testInfoEndpoint() {
    console.log('🔍 Testing info endpoint...');
    
    const result = await this.makeRequest('/api/info');
    
    if (result.success && result.data?.success) {
      this.addResult('API Info', true, 'API info retrieved successfully');
    } else {
      this.addResult('API Info', false, `Info endpoint failed: ${result.data?.message || 'Unknown error'}`);
    }
  }

  async testBotStatus() {
    console.log('🔍 Testing bot status...');
    
    const result = await this.makeRequest('/');
    
    if (result.success && result.data?.success) {
      const botConnected = result.data?.bot?.connected;
      this.addResult('Bot Status', botConnected, 
        botConnected ? `Bot connected as: ${result.data?.bot?.username}` : 'Bot not connected');
    } else {
      this.addResult('Bot Status', false, 'Failed to get bot status');
    }
  }

  async testAuthenticationRequired() {
    console.log('🔍 Testing authentication requirement...');
    
    const result = await this.makeRequest('/api/assign-role', 'POST', 
      { discordHandle: 'testuser' });
    
    if (result.status === 401) {
      this.addResult('Auth Required', true, 'Authentication properly required');
    } else {
      this.addResult('Auth Required', false, 'Authentication not properly enforced');
    }
  }

  async testInvalidApiKey() {
    console.log('🔍 Testing invalid API key handling...');
    
    const result = await this.makeRequest('/api/assign-role', 'POST',
      { discordHandle: 'testuser' },
      { 'X-API-Key': 'invalid-key' });
    
    if (result.status === 401 && result.data?.error === 'INVALID_API_KEY') {
      this.addResult('Invalid API Key', true, 'Invalid API key properly rejected');
    } else {
      this.addResult('Invalid API Key', false, 'Invalid API key not properly handled');
    }
  }

  async testValidApiKeyButInvalidHandle() {
    console.log('🔍 Testing valid API key with invalid handle...');
    
    if (!API_KEY || API_KEY === 'your_secure_api_key_here') {
      this.addResult('Valid API Key Test', false, 'API_SECRET_KEY not configured');
      return;
    }

    const result = await this.makeRequest('/api/assign-role', 'POST',
      { discordHandle: 'invalid@@handle' },
      { 'X-API-Key': API_KEY });
    
    if (result.status === 400 && result.data?.error === 'INVALID_DISCORD_HANDLE_FORMAT') {
      this.addResult('Handle Validation', true, 'Invalid handle format properly rejected');
    } else {
      this.addResult('Handle Validation', false, 'Handle validation not working correctly');
    }
  }

  async testMissingDiscordHandle() {
    console.log('🔍 Testing missing Discord handle...');
    
    if (!API_KEY || API_KEY === 'your_secure_api_key_here') {
      this.addResult('Missing Handle Test', false, 'API_SECRET_KEY not configured');
      return;
    }

    const result = await this.makeRequest('/api/assign-role', 'POST',
      {},
      { 'X-API-Key': API_KEY });
    
    if (result.status === 400 && result.data?.error === 'MISSING_DISCORD_HANDLE') {
      this.addResult('Missing Handle', true, 'Missing handle properly detected');
    } else {
      this.addResult('Missing Handle', false, 'Missing handle validation not working');
    }
  }

  async testRateLimiting() {
    console.log('🔍 Testing rate limiting (making multiple requests)...');
    
    if (!API_KEY || API_KEY === 'your_secure_api_key_here') {
      this.addResult('Rate Limiting Test', false, 'API_SECRET_KEY not configured');
      return;
    }

    // Make several requests quickly
    const promises = Array(5).fill(0).map(() => 
      this.makeRequest('/api/assign-role', 'POST',
        { discordHandle: 'testuser123' },
        { 'X-API-Key': API_KEY })
    );

    const results = await Promise.all(promises);
    const allSuccessfulOrExpectedErrors = results.every(r => 
      r.status === 400 || r.status === 404 || r.status === 429
    );

    this.addResult('Rate Limiting', allSuccessfulOrExpectedErrors, 
      'Rate limiting appears to be working (no unexpected errors)');
  }

  printResults() {
    console.log('\n📊 Test Results:');
    console.log('================');
    
    let passed = 0;
    let failed = 0;

    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
      
      if (result.success) passed++;
      else failed++;
    });

    console.log('\n📈 Summary:');
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total:  ${this.results.length}`);

    if (failed > 0) {
      console.log('\n💡 Tips for failures:');
      console.log('   - Ensure the bot is running (bun run dev)');
      console.log('   - Check your .env configuration');
      console.log('   - Verify the bot is connected to Discord');
      console.log('   - Make sure API_SECRET_KEY is set');
    } else {
      console.log('\n🎉 All tests passed! Your bot appears to be working correctly.');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting API tests...\n');

    await this.testHealthEndpoint();
    await this.testInfoEndpoint();
    await this.testBotStatus();
    await this.testAuthenticationRequired();
    await this.testInvalidApiKey();
    await this.testValidApiKeyButInvalidHandle();
    await this.testMissingDiscordHandle();
    await this.testRateLimiting();

    this.printResults();
  }
}

// Run tests if this file is executed directly
if (import.meta.main) {
  const tester = new APITester();
  
  console.log('🤖 Discord Role Assignment Bot - API Tester');
  console.log('============================================\n');
  
  if (!process.env.API_SECRET_KEY || process.env.API_SECRET_KEY === 'your_secure_api_key_here') {
    console.log('⚠️  Warning: API_SECRET_KEY not configured in .env');
    console.log('   Some tests will be skipped.\n');
  }

  await tester.runAllTests();
}

export { APITester };
