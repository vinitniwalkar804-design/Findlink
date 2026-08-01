/**
 * Test how execFile handles the Python script
 * Focus on understanding if stderr is causing the hang
 */
const { spawn, execFile } = require('child_process');
const path = require('path');

const script = path.join(__dirname, 'backend', 'services', 'face_match.py');
const photo = path.join(__dirname, 'backend', 'uploads', '1784987961417-zybev9a6vpj.jpeg');
const missingJson = JSON.stringify([
  { _id: '507f1f77bcf86cd799439011', photoUrl: '/uploads/1784987961417-zybev9a6vpj.jpeg' }
]);

console.log('=== TEST 1: Using spawn (collect stderr separately) ===\n');

const child = spawn('py', ['-3', script, photo, missingJson, '0.70'], {
  timeout: 30000,
});

let stdoutData = '';
let stderrData = '';

child.stdout.on('data', (data) => {
  stdoutData += data.toString();
  console.log('STDOUT chunk:', data.toString().substring(0, 200));
});

child.stderr.on('data', (data) => {
  stderrData += data.toString();
  console.log('STDERR chunk len:', data.length);
});

child.on('error', (err) => {
  console.error('Process error:', err.message);
});

child.on('close', (code) => {
  console.log('\nProcess closed with code:', code);
  console.log('Total stdout length:', stdoutData.length);
  console.log('Total stderr length:', stderrData.length);
  
  if (stdoutData) {
    console.log('\nSTDOUT content:');
    console.log(stdoutData.substring(0, 2000));
    try {
      const result = JSON.parse(stdoutData.trim());
      console.log('\n✅ Valid JSON! Matches:', result.matches ? result.matches.length : 'N/A');
    } catch (e) {
      console.log('❌ Invalid JSON:', e.message);
    }
  } else {
    console.log('❌ No stdout output!');
  }
  
  console.log('\n=== TEST 2: Using execFile with shell ===');
  
  execFile('py', ['-3', script, photo, missingJson, '0.70'], 
    { timeout: 30000, maxBuffer: 10 * 1024 * 1024, shell: true },
    (err, stdout, stderr) => {
      console.log('ExecFile callback fired');
      if (err) console.log('Error:', err.message, 'code:', err.code, 'signal:', err.signal);
      if (stderr) console.log('Stderr len:', stderr.length);
      if (stdout) {
        console.log('Stdout len:', stdout.length);
        console.log('Stdout:', stdout.substring(0, 500));
      } else {
        console.log('❌ No stdout!');
      }
    }
  );
});

