require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findlink');
  console.log('Connected');
  
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('Total users:', users.length);
  for (const u of users) {
    const pw = u.password || '';
    const hashPrefix = pw.length > 4 ? pw.substring(0, 4) : pw;
    const isBcrypt = pw.startsWith('$2');
    console.log('Email:', u.email);
    console.log('Password prefix:', hashPrefix);
    console.log('Password length:', pw.length);
    console.log('Is bcrypt hash:', isBcrypt);
    console.log('Role:', u.role);
    console.log('---');
  }
  
  await mongoose.disconnect();
}
test().catch(e => console.error('ERROR:', e));

