require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function testSignin() {
  // Connect directly to MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findlink');
  console.log('Connected to MongoDB');

  // Get the User model
  const { User } = require('./models/index');

  // Test with the admin credentials
  const email = 'vinitniwalkar@gmail.com';
  const password = 'vinit@2006';

  console.log('\n--- Testing signin flow ---');
  console.log('Email:', email);
  console.log('Password:', password);

  // Step 1: Find user
  console.log('\n1. Finding user...');
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.log('FATAL: User not found!');
    process.exit(1);
  }
  console.log('User found:', user.email, 'Role:', user.role);

  // Step 2: Compare password
  console.log('\n2. Comparing password...');
  console.log('Password stored length:', user.password.length);
  console.log('Password stored prefix:', user.password.substring(0, 7));

  try {
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('\n--- Trying hashSync for diagnostics ---');
      const hashOfInput = bcrypt.hashSync(password, 12);
      console.log('Fresh hash of input password:', hashOfInput);
      console.log('Stored hash:', user.password);
      console.log('Do they match?', hashOfInput === user.password);
      console.log('(They should NOT match - bcrypt uses random salts)');
      
      // Check if stored password is actually a hash
      const isHash = user.password.startsWith('$2');
      console.log('Is stored value a bcrypt hash?', isHash);
    }
  } catch (err) {
    console.log('ERROR in bcrypt.compare:');
    console.log('Message:', err.message);
    console.log('Stack:', err.stack);
  }

  // Step 3: Test generateToken
  console.log('\n3. Testing JWT generation...');
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'findlink-jwt-secret-change-in-production';
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('Token generated successfully, length:', token.length);
  } catch (err) {
    console.log('ERROR in JWT generation:', err.message);
  }

  console.log('\n=== ALL CHECKS PASSED ===');
  await mongoose.disconnect();
}

testSignin().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});

