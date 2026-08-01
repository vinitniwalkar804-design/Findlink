/**
 * E2E HTTP CHECK
 * ==============
 * Tests the real HTTP route POST /api/police/upload-found after the server is
 * restarted with the fixed backend/services/faceMatching.js.
 *
 * Prerequisites:
 *   1. Backend server running on port 5000 (restarted AFTER the fix).
 *   2. At least one active missing person with faceEmbedding in MongoDB.
 *   3. A valid police JWT token.
 *
 * Usage: node e2e_http_check.cjs <token> <photoUrl>
 *   e.g. node e2e_http_check.cjs "<jwt>" "/uploads/1785590746868-j4thwejzuf.jpeg"
 */
const http = require('http');

function api(method, p, token, body) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 5000, path: p, method, timeout: 120000 };
    opts.headers = {};
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, data: d.substring(0, 500) }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const token = process.argv[2];
  const photoUrl = process.argv[3];
  if (!token || !photoUrl) {
    console.error('Usage: node e2e_http_check.cjs <token> <photoUrl>');
    process.exit(1);
  }

  console.log('Sending POST /api/police/upload-found with photoUrl:', photoUrl);
  const res = await api('POST', '/api/police/upload-found', token, JSON.stringify({
    photoUrl,
    possibleName: 'E2E Check',
    gender: 'male',
    description: 'E2E verification of face matching fix',
  }));

  if (res.status === 201) {
    console.log('\n✅ HTTP 201 - upload-found succeeded');
    console.log('match_count:', res.data.match_count);
    const top = (res.data.matches || []).slice(0, 3).map((m) => ({
      name: m.missing_person?.full_name,
      score: m.confidence_score,
    }));
    console.log('top matches:', top);
    process.exit(0);
  } else {
    console.error('\n❌ HTTP', res.status, JSON.stringify(res.data).substring(0, 1000));
    process.exit(1);
  }
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });

