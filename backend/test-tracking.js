/**
 * Quick test script to verify tracking endpoints
 * Run with: node test-tracking.js
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

console.log('\n🧪 Testing Email Tracking Endpoints\n');
console.log('Backend URL:', BACKEND_URL);
console.log('─'.repeat(50));

// Test 1: Health Check
async function testHealthCheck() {
  try {
    console.log('\n1️⃣ Testing health endpoint...');
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Health check passed:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Test 2: Tracking Pixel (should return image)
async function testTrackingPixel() {
  try {
    console.log('\n2️⃣ Testing tracking pixel endpoint...');
    const testTrackingId = 'test-tracking-id-12345';
    const response = await axios.get(
      `${BACKEND_URL}/api/track/open/${testTrackingId}`,
      { responseType: 'arraybuffer' }
    );
    
    if (response.headers['content-type'] === 'image/gif') {
      console.log('✅ Tracking pixel endpoint working (returns GIF image)');
      console.log('   Note: Email not found in DB (expected for test ID)');
      return true;
    } else {
      console.log('❌ Unexpected content type:', response.headers['content-type']);
      return false;
    }
  } catch (error) {
    console.error('❌ Tracking pixel test failed:', error.message);
    return false;
  }
}

// Test 3: Click Tracking (should redirect)
async function testClickTracking() {
  try {
    console.log('\n3️⃣ Testing click tracking endpoint...');
    const testTrackingId = 'test-tracking-id-12345';
    const testUrl = 'https://example.com';
    
    const response = await axios.get(
      `${BACKEND_URL}/api/track/click/${testTrackingId}?url=${encodeURIComponent(testUrl)}`,
      { 
        maxRedirects: 0,
        validateStatus: (status) => status === 302 || status === 301
      }
    );
    
    if (response.status === 302 || response.status === 301) {
      console.log('✅ Click tracking endpoint working (redirects properly)');
      console.log('   Redirect location:', response.headers.location);
      return true;
    } else {
      console.log('❌ Expected redirect, got status:', response.status);
      return false;
    }
  } catch (error) {
    if (error.response && (error.response.status === 302 || error.response.status === 301)) {
      console.log('✅ Click tracking endpoint working (redirects properly)');
      return true;
    }
    console.error('❌ Click tracking test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = {
    health: await testHealthCheck(),
    pixel: await testTrackingPixel(),
    click: await testClickTracking(),
  };
  
  console.log('\n' + '─'.repeat(50));
  console.log('\n📊 Test Results:');
  console.log('   Health Check:', results.health ? '✅ PASS' : '❌ FAIL');
  console.log('   Tracking Pixel:', results.pixel ? '✅ PASS' : '❌ FAIL');
  console.log('   Click Tracking:', results.click ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('\n✅ All tests passed! Tracking endpoints are working.\n');
    console.log('💡 Next steps:');
    console.log('   1. Make sure BACKEND_URL in .env is accessible from outside');
    console.log('   2. Send a test email');
    console.log('   3. Open the email and check backend console logs');
    console.log('   4. Refresh dashboard to see tracking data\n');
  } else {
    console.log('\n❌ Some tests failed. Check if backend is running.\n');
  }
}

runTests().catch(console.error);
