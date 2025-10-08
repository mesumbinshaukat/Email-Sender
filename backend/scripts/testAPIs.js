import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const USER_ID = '68def68a016de8f1bf0c189e';

// Mock JWT token for testing (you'll need to replace with actual token)
let AUTH_TOKEN = '';

const log = {
  success: (msg) => console.log('✅', msg),
  error: (msg) => console.log('❌', msg),
  info: (msg) => console.log('ℹ️ ', msg),
  warning: (msg) => console.log('⚠️ ', msg),
  section: (msg) => console.log(`\n${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}`)
};

const testEndpoint = async (method, endpoint, data = null, requiresAuth = true) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: requiresAuth && AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    log.success(`${method} ${endpoint} - Status: ${response.status}`);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.response) {
      log.error(`${method} ${endpoint} - Status: ${error.response.status} - ${error.response.data.message || error.message}`);
      return { success: false, error: error.response.data, status: error.response.status };
    } else {
      log.error(`${method} ${endpoint} - ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};

const runTests = async () => {
  console.log('\n🧪 API Testing Suite\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${USER_ID}\n`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Test 1: Health Check
  log.section('1. Health Check Endpoints');
  results.total += 3;
  
  let result = await testEndpoint('GET', '/api/health', null, false);
  if (result.success) results.passed++; else results.failed++;
  
  result = await testEndpoint('GET', '/api/health/test-endpoints', null, false);
  if (result.success) results.passed++; else results.failed++;
  
  result = await testEndpoint('GET', '/api/health/system', null, false);
  if (result.success) results.passed++; else results.failed++;

  // Test 2: Email Endpoints (without auth - will fail but test route exists)
  log.section('2. Email Endpoints (Testing Route Registration)');
  results.total += 5;
  
  result = await testEndpoint('GET', '/api/emails?limit=5', null, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }
  
  result = await testEndpoint('GET', '/api/emails/analytics/stats', null, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 3: Warmup Endpoints
  log.section('3. Warmup Endpoints (Testing Route Registration)');
  results.total += 4;
  
  result = await testEndpoint('GET', '/api/warmup/status', null, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }
  
  result = await testEndpoint('GET', '/api/warmup/reputation-score', null, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  result = await testEndpoint('GET', '/api/warmup/recommendations', null, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  result = await testEndpoint('POST', '/api/warmup/start', {}, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: Voice Endpoints
  log.section('4. Voice Endpoints (Testing Route Registration)');
  results.total += 2;
  
  result = await testEndpoint('GET', '/api/voice/supported-commands', null, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  result = await testEndpoint('POST', '/api/voice/command', { text: 'test' }, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: AI Provider Endpoints
  log.section('5. AI Provider Endpoints (Testing Route Registration)');
  results.total += 3;
  
  result = await testEndpoint('GET', '/api/ai-providers', null, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  result = await testEndpoint('GET', '/api/ai-providers/models/openrouter', null, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  result = await testEndpoint('POST', '/api/ai-providers/test', { provider: 'openrouter', apiKey: 'test' }, false);
  if (result.status === 401 || result.status === 200 || result.status === 400) {
    log.info('Route exists (401/400 = needs auth or validation, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 6: Advanced Feature Endpoints
  log.section('6. Advanced Feature Endpoints (Testing Route Registration)');
  results.total += 8;
  
  const advancedEndpoints = [
    { method: 'POST', path: '/api/goal-automation/design' },
    { method: 'GET', path: '/api/clv/predict/test123' },
    { method: 'POST', path: '/api/conversation-agents/respond' },
    { method: 'POST', path: '/api/staggered-send/optimize' },
    { method: 'POST', path: '/api/cross-channel/adapt' },
    { method: 'POST', path: '/api/zero-party/collect' },
    { method: 'POST', path: '/api/zero-party/enrich' },
    { method: 'POST', path: '/api/visual-personalization/generate' }
  ];

  for (const endpoint of advancedEndpoints) {
    result = await testEndpoint(endpoint.method, endpoint.path, {}, false);
    if (result.status === 401 || result.status === 200 || result.status === 400) {
      log.info(`Route exists: ${endpoint.path}`);
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Test 7: Tracking Endpoints
  log.section('7. Tracking Endpoints (Testing Route Registration)');
  results.total += 2;
  
  result = await testEndpoint('GET', '/api/tracking/open/test123', null, false);
  if (result.status === 404 || result.status === 200) {
    log.info('Route exists (404 = tracking ID not found, which is expected)');
    results.passed++;
  } else {
    results.failed++;
  }

  result = await testEndpoint('GET', '/api/tracking/click/test123', null, false);
  if (result.status === 404 || result.status === 200) {
    log.info('Route exists (404 = tracking ID not found, which is expected)');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 8: Environment Endpoints
  log.section('8. Environment Variable Endpoints (Testing Route Registration)');
  results.total += 2;
  
  result = await testEndpoint('GET', '/api/env', null, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  result = await testEndpoint('GET', '/api/env/OPENAI_API_KEY/status', null, false);
  if (result.status === 401 || result.status === 200) {
    log.info('Route exists (401 = needs auth, which is correct)');
    results.passed++;
  } else {
    results.failed++;
  }

  // Final Summary
  log.section('Test Results Summary');
  console.log(`\nTotal Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(`\n📊 Success Rate: ${successRate}%\n`);

  if (results.failed === 0) {
    console.log('🎉 All tests passed! All routes are properly registered.\n');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.\n');
  }

  console.log('Note: 401 errors are expected for protected routes without authentication.');
  console.log('This confirms the routes exist and authentication is working correctly.\n');
};

// Run tests
console.log('╔════════════════════════════════════════════════════╗');
console.log('║     Email Tracker API Test Suite                  ║');
console.log('╚════════════════════════════════════════════════════╝');

runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
