/**
 * VERIFY FIX
 * Calls findMatches() (the real production function in faceMatching.js) with
 * a LARGE set of missing persons so the temp-file @<path> path is exercised.
 * Before the fix this exact scenario failed with ENAMETOOLONG.
 */
const path = require('path');
const fs = require('fs');
const { findMatches } = require('./backend/services/faceMatching');

const UPLOADS = path.join(__dirname, 'backend', 'uploads');
const files = fs.readdirSync(UPLOADS).filter((f) => /\.(jpe?g|png)$/i.test(f));
const PHOTO = path.join(UPLOADS, files[0]);

function makeEmbedding() {
  const arr = [];
  for (let i = 0; i < 512; i++) arr.push(+(Math.random() * 2 - 1).toFixed(8));
  return arr;
}

const missingPersons = [];
for (let i = 0; i < 25; i++) {
  missingPersons.push({
    _id: '507f1f77bcf86cd7994390' + String(i).padStart(2, '0'),
    fullName: 'Person ' + i,
    faceEmbedding: makeEmbedding(),
  });
}

console.log('Photo     :', PHOTO, '| exists:', fs.existsSync(PHOTO));
console.log('Persons   :', missingPersons.length);
console.log('Total JSON payload would be ~', JSON.stringify(missingPersons).length, 'chars (exceeds 32767 limit)');
console.log('Calling findMatches() through faceMatching.js (uses temp @file)...\n');

findMatches(files[0], missingPersons, UPLOADS)
  .then((result) => {
    console.log('\n=== SUCCESS ===');
    console.log('candidateCount :', result.candidateCount);
    console.log('totalCompared  :', result.totalCompared);
    console.log('totalPersonsInIndex :', result.totalPersonsInIndex);
    console.log('top candidates :', (result.candidates || []).slice(0, 3).map((c) => ({
      person: c.fullName,
      similarity: c.similarity,
      label: c.match_label || c.matchLabel,
    })));
    if (result.candidateCount > 0) {
      console.log('\n✅ LARGE embedding payload comparison completed successfully (no ENAMETOOLONG).');
      process.exit(0);
    } else {
      console.log('\n⚠️ Comparison completed but 0 candidates returned.');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('\n=== FAILURE ===');
    console.error(err.message);
    console.error('\n❌ Comparison failed.');
    process.exit(1);
  });

