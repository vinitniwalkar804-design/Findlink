const http = require('http');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function api(method, p, body) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 5000, path: p, method, timeout: 15000 };
    opts.headers = {};
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(body); }
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, data: d.substring(0,300) }); } });
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    if (body) req.write(body);
    req.end();
  });
}

function authApi(token, method, p, body) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 5000, path: p, method, timeout: 15000 };
    opts.headers = { Authorization: 'Bearer ' + token };
    if (body) { opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(body); }
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, data: d.substring(0,300) }); } });
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  let passed = 0, failed = 0;
  const ok = (name, cond) => { if (cond) { passed++; console.log('  PASS:', name); } else { failed++; console.log('  FAIL:', name); } };
  
  console.log('=== FINAL VERIFICATION ===\n');

  // 1. Login
  const log = await api('POST', '/api/auth/signin', JSON.stringify({email:'vinitniwalkar@gmail.com',password:'vinit@2006'}));
  const token = log.data?.token;
  ok('Sign in works', !!token);
  if (!token) { console.log('ABORT: cannot login'); process.exit(1); }

  // 2. Static file serving
  const stat = await new Promise(r => { http.get('http://localhost:5000/uploads/1784987961417-zybev9a6vpj.jpeg', (res) => { r(res.statusCode); }).on('error', () => r(0)); });
  ok('Existing image loads (200)', stat === 200);

  // 3. Upload image
  const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRFJiMkVic4EzQjR0RSlFNkVUcCZS/9oADAMBAAIRAxEAPwC0p6f/2Q==', 'base64');
  const boundary = '----Test' + Date.now();
  const body = Buffer.concat([
    Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="image"; filename="t.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'),
    jpeg,
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);
  
  const up = await new Promise(r => {
    const o = { hostname: 'localhost', port: 5000, method: 'POST', path: '/api/upload', timeout: 15000,
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length } };
    const req = http.request(o, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { r({ status: res.statusCode, data: JSON.parse(d) }); } catch(e) { r({ status: res.statusCode, data: d }); } }); });
    req.on('error', e => r({ status: 0, error: e.message }));
    req.write(body); req.end();
  });
  
  ok('Upload returns 200', up.status === 200);
  const photoUrl = up.data?.url;
  ok('Upload returns URL', typeof photoUrl === 'string' && photoUrl.startsWith('/uploads/'));

  if (!photoUrl) { console.log('ABORT: upload failed'); process.exit(1); }
  
  const fname = path.basename(photoUrl);
  const fpath = path.join('v:/findlink/backend/uploads', fname);

  // 4. File on disk
  ok('File saved on disk', fs.existsSync(fpath));

  // 5. Static serve for uploaded
  const ser1 = await new Promise(r => { http.get('http://localhost:5000' + photoUrl, (res) => { r(res.statusCode); }).on('error', () => r(0)); });
  ok('Uploaded image served via static (200)', ser1 === 200);

  // 6. Submit missing person report
  const rep = await authApi(token, 'POST', '/api/reports/missing', JSON.stringify({
    reporterId: log.data.user.id, fullName: 'Final Test', age: 30, gender: 'male',
    photoUrl, lastSeenAddress: 'Address', description: 'Test'
  }));
  ok('Missing person report created (201)', rep.status === 201);
  const rid = rep.data?._id;

  // 7. Fetch and verify photo_url in API response
  if (rid) {
    await new Promise(r => setTimeout(r, 500));
    const reports = await api('GET', '/api/missing-persons');
    const found = Array.isArray(reports.data) ? reports.data.find(x => x.id === rid) : null;
    ok('Report found in GET /api/missing-persons', !!found);
    if (found) {
      ok('photo_url in response matches upload URL', found.photo_url === photoUrl);
      // 8. Image loads from stored URL (after page refresh)
      const ser2 = await new Promise(r => { http.get('http://localhost:5000' + found.photo_url, (res) => { r(res.statusCode); }).on('error', () => r(0)); });
      ok('Image still loads after refresh (200)', ser2 === 200);
    }
    
    // Cleanup report
    try { await mongoose.connect('mongodb://127.0.0.1:27017/findlink'); await mongoose.connection.db.collection('missingpeople').deleteOne({ _id: new mongoose.Types.ObjectId(rid) }); await mongoose.disconnect(); } catch(e) {}
  }

  // Cleanup test file
  try { if (fs.existsSync(fpath)) fs.unlinkSync(fpath); } catch(e) {}

  // ============ LOCATION APIS ============
  console.log('\n--- Location APIs ---');
  const countries = await api('GET', '/api/countries');
  ok('/api/countries returns 1', countries.status === 200 && countries.data?.length === 1);
  
  const india = (countries.data || []).find(c => c.name === 'India');
  ok('India found', !!india);
  
  if (india) {
    const states = await api('GET', '/api/states?countryId=' + india._id);
    ok('/api/states returns 36', states.status === 200 && states.data?.length === 36);
    
    const mh = (states.data || []).find(s => s.name === 'Maharashtra');
    if (mh) {
      const dists = await api('GET', '/api/districts?stateId=' + mh._id);
      ok('/api/districts for MH >= 35', dists.status === 200 && dists.data?.length >= 35);
      
      if (dists.data?.length > 0) {
        const cities = await api('GET', '/api/cities?districtId=' + dists.data[0]._id);
        ok('/api/cities for district > 0', cities.status === 200 && cities.data?.length > 0);
        
        const cities2 = await api('GET', '/api/cities?districtId=' + dists.data[1]._id);
        ok('/api/cities for 2nd district returns data', cities2.status === 200);
        ok('Different cities for different district', cities.data[0]?.id !== cities2.data[0]?.id);
      }
    }
    
    // Invalid selections
    const bad1 = await api('GET', '/api/districts');
    ok('/api/districts no stateId = 400', bad1.status === 400);
    
    const bad2 = await api('GET', '/api/cities');
    ok('/api/cities no params = 400', bad2.status === 400);
    
    const bad3 = await api('GET', '/api/districts?stateId=000000000000000000000000');
    ok('/api/districts bad stateId = 200 (empty array)', bad3.status === 200 && bad3.data?.length === 0);
  }

  // Health
  const h = await api('GET', '/api/health');
  ok('Health check OK', h.status === 200 && h.data?.mongodb === 'connected');

  // Summary
  const total = passed + failed;
  console.log('\n=== RESULTS ===');
  console.log(`Passed: ${passed}/${total} (${failed === 0 ? 'ALL ✅' : failed + ' FAILED ❌'})`);
  process.exit(failed > 0 ? 1 : 0);
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
