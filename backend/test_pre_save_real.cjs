require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findlink');
  const { User } = require('./models/index');
  
  // Check pre-save hooks
  const pres = User.schema.s.hooks._pres || {};
  console.log('Pre hooks:');
  for (const [key, val] of Object.entries(pres)) {
    console.log('  ' + key + ': ' + (Array.isArray(val) ? val.length : '?'));
    if (Array.isArray(val)) {
      val.forEach((v, i) => {
        console.log('    [' + i + ']:', typeof v, v.name || '(anonymous)');
      });
    }
  }

  // Test creating a NEW user to verify pre-save hashes password
  const testEmail = 'temptest_' + Date.now() + '@delme.com';
  console.log('\n--- Creating test user: ' + testEmail + ' ---');
  
  try {
    const newUser = await User.create({
      email: testEmail,
      password: 'rawpassword123',
      fullName: 'Temp Test',
      role: 'citizen',
    });
    console.log('Created:', newUser.email);
    console.log('Password stored (first 20):', newUser.password.substring(0, 20));
    console.log('StartsWith $2:', newUser.password.startsWith('$2'));
    
    // Now test signin with raw password
    const isValid = await bcrypt.compare('rawpassword123', newUser.password);
    console.log('Signin test with raw password:', isValid);
    
    // Cleanup
    await User.findByIdAndDelete(newUser._id);
    console.log('Cleaned up test user');
  } catch(e) {
    console.log('ERROR:', e.message);
    console.log('STACK:', e.stack);
  }

  await mongoose.disconnect();
}
test().catch(e => console.error('FATAL:', e));

