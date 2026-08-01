const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', (e) => reject(e));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('=== TEST 1: Health Check ===');
  try {
    const health = await request('GET', '/api/health');
    console.log('Status:', health.status);
    console.log('Body:', JSON.stringify(health.body, null, 2));
    if (health.status !== 200) {
      console.error('FAIL: Health check failed');
      process.exit(1);
    }
  } catch (e) {
    console.error('FAIL: Cannot reach backend:', e.message);
    process.exit(1);
  }

  console.log('\n=== TEST 2: Signup ===');
  const testEmail = 'test_' + Date.now() + '@test.com';
  const signupResult = await request('POST', '/api/auth/signup', {
    email: testEmail,
    password: 'test123456',
    full_name: 'Test User',
    role: 'citizen',
  });
  console.log('Status:', signupResult.status);
  console.log('Body:', JSON.stringify(signupResult.body, null, 2));
  if (signupResult.status !== 201) {
    console.error('FAIL: Signup failed');
    process.exit(1);
  }
  const token = signupResult.body.token;
  console.log('Token:', token ? token.substring(0, 20) + '...' : 'NONE');

  console.log('\n=== TEST 3: Signin ===');
  const signinResult = await request('POST', '/api/auth/signin', {
    email: testEmail,
    password: 'test123456',
  });
  console.log('Status:', signinResult.status);
  console.log('Body:', JSON.stringify(signinResult.body, null, 2));
  if (signinResult.status !== 200) {
    console.error('FAIL: Signin failed');
    process.exit(1);
  }

  console.log('\n=== TEST 4: Stats (authenticated) ===');
  const statsResult = await request('GET', '/api/stats', null, token);
  console.log('Status:', statsResult.status);
  console.log('Body:', JSON.stringify(statsResult.body, null, 2));
  if (statsResult.status !== 200) {
    console.error('FAIL: Stats endpoint failed');
    process.exit(1);
  }

  console.log('\n=== TEST 5: Missing Persons (public) ===');
  const missingResult = await request('GET', '/api/missing-persons');
  console.log('Status:', missingResult.status);
  console.log('Body:', JSON.stringify(missingResult.body, null, 2));
  if (missingResult.status !== 200) {
    console.error('FAIL: Missing persons endpoint failed');
    process.exit(1);
  }

  console.log('\n=== TEST 6: Found Persons (public) ===');
  const foundResult = await request('GET', '/api/found-persons');
  console.log('Status:', foundResult.status);
  console.log('Body:', JSON.stringify(foundResult.body, null, 2));
  if (foundResult.status !== 200) {
    console.error('FAIL: Found persons endpoint failed');
    process.exit(1);
  }

  console.log('\n=== ALL TESTS PASSED ===');
  console.log('✓ Backend is running on http://localhost:5000');
  console.log('✓ MongoDB is connected');
  console.log('✓ GET /api/health returns 200');
  console.log('✓ POST /api/auth/signup works');
  console.log('✓ POST /api/auth/signin works');
  console.log('✓ GET /api/stats returns 200 (authenticated)');
  console.log('✓ GET /api/missing-persons returns 200');
  console.log('✓ GET /api/found-persons returns 200');
}

main().catch(e => {
  console.error('Test error:', e.message);
  process.exit(1);
});

