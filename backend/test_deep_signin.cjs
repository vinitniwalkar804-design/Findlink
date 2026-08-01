require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function deepDiagnose() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findlink');
  const { User } = require('./models/index');
  
  const allUsers = await User.find({});
  console.log('Total users:', allUsers.length);
  
  for (const u of allUsers) {
    const pw = u.password || '';
    const isBcrypt = pw.startsWith('$2');
    console.log('User:', u.email, '| role:', u.role);
    console.log('  password exists:', !!u.password);
    console.log('  password length:', pw.length);
    console.log('  is bcrypt hash:', isBcrypt);
    
    if (!isBcrypt && u.password) {
      console.log('  *** PLAIN TEXT PASSWORD ***:', pw.substring(0, 20));
    }
    
    // Test the signin comparison behavior
    console.log('  Testing bcrypt.compare...');
    try {
      const isValid = await bcrypt.compare('test', pw);
      console.log('  compare succeeds (no throw): OK');
    } catch(e) {
      console.log('  *** bcrypt.compare ERROR:', e.message);
    }
  }
  
  // CRITICAL: Check what the pre('save') hook does
  console.log('\n=== Checking User model pre-save hook ===');
  const UserModel = mongoose.model('User');
  const schema = UserModel.schema;
  
  // Check the pre-save middleware
  const preSaveHooks = schema.callQueue.filter(q => q[0] === 'pre' && q[1] === 'save');
  console.log('Pre-save hooks count:', preSaveHooks.length);
  
  // Check if 'password' is in the schema
  console.log('Password path in schema:', !!schema.paths['password']);
  console.log('Password options:', JSON.stringify(schema.paths['password'] ? schema.paths['password'].options : {}));

  await mongoose.disconnect();
  console.log('\n=== Deep diagnosis complete ===');
}
deepDiagnose().catch(e => console.error('FATAL:', e));

