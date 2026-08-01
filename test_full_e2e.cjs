const http = require('http');
const fs = require('fs');
const path = require('path');

function api(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 5000, path: urlPath, method, timeout: 15000, headers };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, data: d.substring(0, 500) }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function get(urlPath) {
  return new Promise((resolve) => {
    http.get('http://localhost:5000' + urlPath, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, contentType: res.headers['content-type'], length: d.length }));
    }).on('error', (e) => resolve({ status: 0, error: e.message }));
  });
}

async function main() {
  console.log('=== FULL END-TO-END UPLOAD TEST ===\n');
  
  // 1. Login
  console.log('1. Sign in...');
  const login = await api('POST', '/api/auth/signin', JSON.stringify({email:'vinitniwalkar@gmail.com',password:'vinit@2006'}));
  const token = login.data?.token;
  if (!token) { console.log('FAILED: Could not login'); return; }
  console.log('   Token obtained: OK\n');
  
  const auth = { Authorization: 'Bearer ' + token };

  // 2. Upload test - create a small 1x1 pixel JPEG buffer
  console.log('2. Uploading test image...');
  const boundary = '----TestBoundary' + Date.now();
  const testImage = Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRFJiMkVic4EzQjR0RSlFNkVUcCZS/9oADAMBAAIRAxEAPwC0p6f/2Q==',
    'base64'
  );
  
  // Build multipart form manually
  const bodyParts = [];
  bodyParts.push('--' + boundary);
  bodyParts.push('Content-Disposition: form-data; name="image"; filename="test.jpg"');
  bodyParts.push('Content-Type: image/jpeg');
  bodyParts.push('');
  bodyParts.push(testImage.toString('binary')); // Use binary
  bodyParts.push('--' + boundary + '--');
  
  const uploadBody = Buffer.concat([
    Buffer.from('--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="image"; filename="test.jpg"\r\n' +
      'Content-Type: image/jpeg\r\n\r\n'),
    testImage,
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);
  
  const upload = await new Promise((resolve) => {
    const opts = {
      hostname: 'localhost', port: 5000, method: 'POST',
      path: '/api/upload',
      headers: {
        ...auth,
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': uploadBody.length,
      },
      timeout: 10000
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.write(uploadBody);
    req.end();
  });
  
  console.log('   Upload response:', upload.status);
  const imageUrl = upload.data?.url;
  if (!imageUrl) { console.log('FAILED: No image URL returned', JSON.stringify(upload.data)); return; }
  console.log('   Image URL:', imageUrl, '\n');

  // 3. Check the uploaded file exists on disk
  const filename = path.basename(imageUrl);
  const filepath = path.join('v:/findlink/backend/uploads', filename);
  console.log('3. Checking file on disk...');
  console.log('   Path:', filepath);
  console.log('   Exists:', fs.existsSync(filepath) ? 'YES' : 'NO\n');

  // 4. Test static file serving
  console.log('4. Testing static file serving...');
  const staticResult = await get(imageUrl);
  console.log('   Status:', staticResult.status, staticResult.status === 200 ? 'OK' : 'FAIL');
  console.log('   Content-Type:', staticResult.contentType);
  console.log('   Size:', staticResult.length, 'bytes\n');

  // 5. Submit a missing person report with this photo URL
  console.log('5. Submitting missing person report...');
  const report = await api('POST', '/api/reports/missing', JSON.stringify({
    reporterId: login.data.user.id,
    fullName: 'Test Person E2E',
    age: 30,
    gender: 'male',
    photoUrl: imageUrl,
    lastSeenAddress: 'Test Address',
    description: 'E2E test'
  }));
  
  if (report.status === 201) {
    console.log('   Report created:', report.status, 'ID:', report.data?._id);
  } else {
    console.log('   Report status:', report.status, JSON.stringify(report.data));
  }

  // 6. Fetch the report back and verify photo_url
  console.log('\n6. Fetching reports...');
  const reports = await api('GET', '/api/missing-persons');
  if (reports.data && reports.data.length > 0) {
    const last = reports.data[reports.data.length - 1];
    console.log('   Last report photo_url:', last.photo_url);
    console.log('   Match:', last.photo_url === imageUrl ? 'OK' : 'MISMATCH');
    
    // 7. Verify static file loads for the stored URL
    const imgCheck = await get(last.photo_url);
    console.log('   Image load from stored URL:', imgCheck.status === 200 ? 'OK' : 'FAIL (' + imgCheck.status + ')');
  }

  // Cleanup: delete the test file
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    console.log('\n(Cleaned up test file)');
  }

  console.log('\n=== E2E TEST COMPLETE ===');
}

main().catch(console.error);
