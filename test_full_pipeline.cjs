/**
 * FULL PIPELINE DEBUG SCRIPT
 * Tests exactly what the backend does when "Run AI Match" is clicked.
 */

const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const BACKEND_DIR = path.join(__dirname, 'backend');
const UPLOADS_DIR = path.join(BACKEND_DIR, 'uploads');
const FACE_MATCH_SCRIPT = path.join(BACKEND_DIR, 'services', 'face_match.py');

console.log('=== FULL PIPELINE DEBUG ===\n');
console.log('Backend dir:', BACKEND_DIR);
console.log('Uploads dir:', UPLOADS_DIR);
console.log('Face match script:', FACE_MATCH_SCRIPT);

// Find a real uploaded photo
const files = fs.readdirSync(UPLOADS_DIR).filter(f => /\.(jpe?g|png)$/i.test(f));
if (files.length === 0) {
  console.error('❌ No image files found in uploads!');
  process.exit(1);
}

const foundPhoto = files[0]; // Use first available photo
const foundPhotoPath = path.join(UPLOADS_DIR, foundPhoto);
console.log('\n1. Found photo to test:', foundPhoto);
console.log('   Full path:', foundPhotoPath);
console.log('   File exists:', fs.existsSync(foundPhotoPath));

// Create mock missing persons data
const missingPersons = [
  { _id: '507f1f77bcf86cd799439011', photoUrl: `/uploads/${foundPhoto}` } // Same photo for testing
];
const missingJson = JSON.stringify(missingPersons);
const threshold = '0.70';

console.log('\n2. Missing persons data:', missingJson.substring(0, 200) + '...');
console.log('\n3. Executing Python script...');

// Exact same execution as faceMatching.js findMatches()
const pythonExec = 'py';
const args = ['-3', FACE_MATCH_SCRIPT, foundPhotoPath, missingJson, threshold];

console.log('   Command:', pythonExec, args.join(' '));
console.log('   Timeout: 120000ms');
console.log('   MaxBuffer: 10MB');

const child = execFile(
  pythonExec,
  args,
  {
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024,
  },
  (err, stdout, stderr) => {
    console.log('\n4. Callback received!');
    
    if (err) {
      console.log('   ❌ Error:', err.message);
      console.log('   Error code:', err.code);
      console.log('   Error killed:', err.killed);
      console.log('   Error signal:', err.signal);
    } else {
      console.log('   ✅ No error (exit code 0)');
    }
    
    if (stderr) {
      console.log('\n   📋 STDERR length:', stderr.length);
      console.log('   📋 STDERR (first 500 chars):');
      console.log('   --- STDERR START ---');
      console.log(stderr.substring(0, 500));
      console.log('   --- STDERR END ---');
    } else {
      console.log('   ✅ No stderr output');
    }
    
    if (stdout) {
      console.log('\n   📋 STDOUT length:', stdout.length);
      console.log('   📋 STDOUT:');
      console.log('   --- STDOUT START ---');
      console.log(stdout.substring(0, 1000));
      console.log('   --- STDOUT END ---');
      
      try {
        const result = JSON.parse(stdout);
        console.log('\n5. ✅ Successfully parsed JSON result:');
        console.log(JSON.stringify(result, null, 2));
      } catch (parseErr) {
        console.log('\n5. ❌ Failed to parse JSON:', parseErr.message);
      }
    } else {
      console.log('   ❌ No stdout output - script may have hung!');
    }
    
    console.log('\n=== DEBUG COMPLETE ===');
  }
);

child.on('error', (err) => {
  console.error('\n❌ Process error event:', err.message);
});

let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  console.error('\n❌ TIMEOUT: Script took too long (> 120 seconds)');
  child.kill();
}, 125000);

child.on('close', (code) => {
  if (!timedOut) {
    clearTimeout(timer);
  }
  console.log('\n📋 Process closed with code:', code);
});

