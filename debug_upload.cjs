const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function verify() {
  await mongoose.connect('mongodb://127.0.0.1:27017/findlink');
  
  console.log('=== ALL Missing Persons ===');
  const allMissing = await mongoose.connection.db.collection('missingpeople').find({}).toArray();
  console.log('Count:', allMissing.length);
  for (const p of allMissing) {
    console.log('ID:', p._id.toString(), '| Name:', p.fullName, '| photoUrl:', JSON.stringify(p.photoUrl), '| Status:', p.status);
  }
  
  console.log('\n=== ALL Found Persons ===');
  const allFound = await mongoose.connection.db.collection('foundpeople').find({}).toArray();
  console.log('Count:', allFound.length);
  for (const p of allFound) {
    console.log('ID:', p._id.toString(), '| photoUrl:', JSON.stringify(p.photoUrl), '| Status:', p.status);
  }

  console.log('\n=== Check uploads directory files ===');
  const uploadsDir = path.join(__dirname, 'backend', 'uploads');
  const files = fs.readdirSync(uploadsDir);
  console.log('Uploaded files:', files.slice(0, 10), files.length > 10 ? '...' : '');
  
  // Check if files on disk match any DB records
  console.log('\n=== Cross-reference: files on disk vs DB ===');
  for (const f of files) {
    const urlInDb = allMissing.some(p => p.photoUrl && p.photoUrl.includes(f)) ||
                    allFound.some(p => p.photoUrl && p.photoUrl.includes(f));
    if (!urlInDb) {
      console.log('File NOT referenced in any DB record:', f);
    }
  }

  await mongoose.disconnect();
}
verify().catch(console.error);

