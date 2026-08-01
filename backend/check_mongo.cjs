const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/findlink');
  console.log('Connected to MongoDB');

  // Check missingpeople
  const missing = await mongoose.connection.db.collection('missingpeople').find({}).toArray();
  console.log('\n=== MISSING PEOPLE === Count: ' + missing.length);
  for (const p of missing) {
    const hasEmb = p.faceEmbedding ? 'YES' : 'NO';
    const embLen = p.faceEmbedding ? p.faceEmbedding.length : 0;
    const embType = p.faceEmbedding ? typeof p.faceEmbedding[0] : 'N/A';
    const first5 = p.faceEmbedding ? p.faceEmbedding.slice(0,5) : [];
    console.log('ID: ' + p._id);
    console.log('  Name: ' + (p.fullName || 'N/A'));
    console.log('  Photo: ' + (p.photoUrl || 'N/A'));
    console.log('  Status: ' + p.status);
    console.log('  faceEmbedding: ' + hasEmb + ' Len: ' + embLen + ' Type: ' + embType + ' First5: [' + first5.join(', ') + ']');
  }

  // Check foundpeople
  const found = await mongoose.connection.db.collection('foundpeople').find({}).toArray();
  console.log('\n=== FOUND PEOPLE === Count: ' + found.length);
  for (const p of found) {
    console.log('ID: ' + p._id + ' Photo: ' + (p.photoUrl || 'N/A') + ' Status: ' + p.status + ' Matched: ' + (p.matchedMissingPersonId || 'N/A'));
  }

  // Check aimatchresults
  const matches = await mongoose.connection.db.collection('aimatchresults').find({}).toArray();
  console.log('\n=== AI MATCH RESULTS === Count: ' + matches.length);
  for (const m of matches) {
    console.log('ID: ' + m._id + ' Found: ' + m.foundPersonId + ' Missing: ' + m.missingPersonId + ' Conf: ' + m.confidenceScore + ' Status: ' + m.status);
  }

  await mongoose.disconnect();
}
check().catch(e => console.error('ERROR:', e));
