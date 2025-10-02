/**
 * Test if ngrok URL is accessible and working correctly
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NGROK_URL = process.env.BACKEND_URL;
const LOCAL_URL = 'http://localhost:5000';

console.log('\n🧪 Testing ngrok Setup\n');
console.log('─'.repeat(60));

async function testLocalEndpoint() {
  try {
    console.log('\n1️⃣ Testing LOCAL endpoint...');
    console.log(`   URL: ${LOCAL_URL}/api/track/open/test123`);
    
    const response = await axios.get(`${LOCAL_URL}/api/track/open/test123`, {
      responseType: 'arraybuffer'
    });
    
    if (response.status === 200 && response.headers['content-type'] === 'image/gif') {
      console.log('   ✅ Local endpoint works!');
      return true;
    }
  } catch (error) {
    console.log('   ❌ Local endpoint failed:', error.message);
    return false;
  }
}

async function testNgrokEndpoint() {
  try {
    console.log('\n2️⃣ Testing NGROK endpoint...');
    console.log(`   URL: ${NGROK_URL}/api/track/open/test123`);
    
    const response = await axios.get(`${NGROK_URL}/api/track/open/test123`, {
      responseType: 'arraybuffer',
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });
    
    console.log('   Status:', response.status);
    console.log('   Content-Type:', response.headers['content-type']);
    
    if (response.status === 200 && response.headers['content-type'] === 'image/gif') {
      console.log('   ✅ ngrok endpoint works perfectly!');
      return true;
    } else if (response.headers['content-type']?.includes('text/html')) {
      console.log('   ⚠️  ngrok is showing HTML page (warning screen)');
      console.log('   This is the FREE TIER WARNING PAGE issue!');
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.log('   ❌ ngrok endpoint failed');
      console.log('   Status:', error.response.status);
      console.log('   Content-Type:', error.response.headers['content-type']);
      
      if (error.response.headers['content-type']?.includes('text/html')) {
        console.log('\n   🚨 PROBLEM FOUND: ngrok Free Tier Warning Page!');
        console.log('   The free ngrok shows a warning page before allowing access.');
        console.log('   Email clients see this HTML page instead of the tracking pixel!');
      }
    } else {
      console.log('   ❌ ngrok endpoint failed:', error.message);
    }
    return false;
  }
}

async function testNgrokHealth() {
  try {
    console.log('\n3️⃣ Testing ngrok health endpoint...');
    const response = await axios.get(`${NGROK_URL}/api/health`);
    
    if (response.data.success) {
      console.log('   ✅ Health endpoint accessible');
      return true;
    }
  } catch (error) {
    console.log('   ❌ Health endpoint failed:', error.message);
    return false;
  }
}

async function runTests() {
  const results = {
    local: await testLocalEndpoint(),
    ngrok: await testNgrokEndpoint(),
    health: await testNgrokHealth(),
  };
  
  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 Results:');
  console.log('   Local Endpoint:', results.local ? '✅ PASS' : '❌ FAIL');
  console.log('   ngrok Endpoint:', results.ngrok ? '✅ PASS' : '❌ FAIL');
  console.log('   Health Check:', results.health ? '✅ PASS' : '❌ FAIL');
  
  console.log('\n' + '─'.repeat(60));
  
  if (!results.ngrok) {
    console.log('\n🚨 ISSUE IDENTIFIED: ngrok Free Tier Problem\n');
    console.log('The ngrok free tier shows a warning page that says:');
    console.log('"You are about to visit [your-url], served by [your-ip]"');
    console.log('with a "Visit Site" button.\n');
    console.log('Email clients cannot click this button, so tracking fails!\n');
    console.log('💡 SOLUTIONS:\n');
    console.log('1. Upgrade to ngrok paid plan ($8/month)');
    console.log('   - Removes the warning page');
    console.log('   - Get static domain\n');
    console.log('2. Deploy to Vercel/Heroku (RECOMMENDED)');
    console.log('   - Free tier available');
    console.log('   - No warning pages');
    console.log('   - Production-ready\n');
    console.log('3. Use localtunnel (alternative to ngrok)');
    console.log('   npm install -g localtunnel');
    console.log('   lt --port 5000\n');
  } else {
    console.log('\n✅ Everything is working! Tracking should work.\n');
  }
}

runTests().catch(console.error);
