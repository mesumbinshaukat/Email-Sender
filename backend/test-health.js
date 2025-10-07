import http from 'http';

const testHealthEndpoint = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Health API Test Results:');
          console.log('   Status Code:', res.statusCode);
          console.log('   Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && response.status === 'OK') {
            console.log('✅ Health API is working correctly!');
            resolve(true);
          } else {
            console.log('❌ Health API returned unexpected response');
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Health API Test Failed:', error.message);
      console.log('   Make sure the server is running on port 5000');
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('❌ Health API Test Timeout');
      resolve(false);
    });

    req.end();
  });
};

const testRootEndpoint = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('\n✅ Root Endpoint Test Results:');
          console.log('   Status Code:', res.statusCode);
          console.log('   Response:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 && response.success) {
            console.log('✅ Root endpoint is working correctly!');
            resolve(true);
          } else {
            console.log('❌ Root endpoint returned unexpected response');
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Root Endpoint Test Failed:', error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('❌ Root Endpoint Test Timeout');
      resolve(false);
    });

    req.end();
  });
};

// Run tests
console.log('🧪 Starting API Health Tests...\n');

setTimeout(async () => {
  const healthResult = await testHealthEndpoint();
  const rootResult = await testRootEndpoint();
  
  console.log('\n📊 Test Summary:');
  console.log('   Health API:', healthResult ? '✅ PASS' : '❌ FAIL');
  console.log('   Root Endpoint:', rootResult ? '✅ PASS' : '❌ FAIL');
  
  if (healthResult && rootResult) {
    console.log('\n🎉 All tests passed! Server is ready for deployment.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please check the server.');
    process.exit(1);
  }
}, 1000);
