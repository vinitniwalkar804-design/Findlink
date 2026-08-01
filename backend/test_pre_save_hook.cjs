require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findlink');
  
  // Reload the User model fresh
  delete mongoose.models.User;
  delete mongoose.modelSchemas.User;
  
  const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    fullName: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['family', 'citizen', 'police', 'admin'], default: 'citizen' },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedAt: { type: Date },
    badgeNumber: { type: String },
    department: { type: String },
    avatarUrl: { type: String },
  }, { timestamps: true });

  // Add pre-save hook
  userSchema.pre('save', async function (next) {
    console.log('  [PRE-SAVE HOOK] Running for:', this.email);
    console.log('  [PRE-SAVE HOOK] isNew:', this.isNew);
    console.log('  [PRE-SAVE HOOK] isModified password:', this.isModified('password'));
    console.log('  [PRE-SAVE HOOK] password exists:', !!this.password);
    
    if (this.isNew && this.role !== 'police') {
      this.approvalStatus = 'approved';
    }
    if (this.isModified('password') && this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      const bcrypt = require('bcryptjs');
      console.log('  [PRE-SAVE HOOK] Hashing password...');
      this.password = await bcrypt.hash(this.password, 12);
      console.log('  [PRE-SAVE HOOK] Hashed password length:', this.password.length);
    } else {
      console.log('  [PRE-SAVE HOOK] Skipping hash - condition not met');
      if (!this.isModified('password')) console.log('  [PRE-SAVE HOOK]   reason: password not modified');
      if (!this.password) console.log('  [PRE-SAVE HOOK]   reason: no password');
      if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')))
        console.log('  [PRE-SAVE HOOK]   reason: already bcrypt hash');
    }
    next();
  });

  const User = mongoose.model('User', userSchema);

  // Check if hooks are registered
  const hooks = User.schema.s.hooks;
  console.log('\nHooks registered:');
  for (const [key, val] of Object.entries(hooks)) {
    console.log('  ' + key + ': ' + (Array.isArray(val) ? val.length : '?'));
  }

  // Test creating a NEW user
  console.log('\n--- Test 1: Create new user with plain text password ---');
  const testEmail = 'test_hook_' + Date.now() + '@test.com';
  try {
    const newUser = await User.create({
      email: testEmail,
      password: 'plaintextpassword123',
      fullName: 'Test Hook User',
      role: 'citizen',
    });
    console.log('Created user:', newUser.email);
    console.log('Password stored:', newUser.password.substring(0, 20) + '...');
    console.log('Is bcrypt hash:', newUser.password.startsWith('$2'));
    
    // Clean up
    await User.findByIdAndDelete(newUser._id);
  } catch(e) {
    console.log('ERROR creating user:', e.message);
  }

  // Test 2: Create user with signup route's method (direct create with password)
  console.log('\n--- Test 2: Create user like signup route does ---');
  const testEmail2 = 'test_hook2_' + Date.now() + '@test.com';
  try {
    const newUser2 = new User({
      email: testEmail2,
      password: 'anothertest123',
      fullName: 'Test Hook User 2',
      role: 'citizen',
    });
    await newUser2.save();
    console.log('Created user:', newUser2.email);
    console.log('Password stored:', newUser2.password.substring(0, 20) + '...');
    console.log('Is bcrypt hash:', newUser2.password.startsWith('$2'));
    
    // Clean up
    await User.findByIdAndDelete(newUser2._id);
  } catch(e) {
    console.log('ERROR creating user:', e.message);
  }

  console.log('\n--- Test Complete ---');
  await mongoose.disconnect();
}

test().catch(e => console.error('FATAL:', e));

