/**
 * VERIFY ADD PATH
 * Exercises addToIndex() (backend/services/faceMatching.js) which passes a
 * 512-D embedding to service.py --add. Before the fix this exceeded the
 * Windows command-line length limit. Now it must route through @<tempfile>.
 */
const { addToIndex } = require('./backend/services/faceMatching');

function makeEmbedding() {
  const arr = [];
  for (let i = 0; i < 512; i++) arr.push(+(Math.random() * 2 - 1).toFixed(8));
  return arr;
}

const embeddings = [makeEmbedding()];
console.log('Embedding JSON length:', JSON.stringify(embeddings).length, 'chars');
console.log('Calling addToIndex() through faceMatching.js (uses temp @file)...\n');

addToIndex('verify-add-person-' + Date.now(), embeddings, 'Verify Add Person')
  .then((result) => {
    console.log('\n=== SUCCESS ===');
    console.log('added_count :', result.added_count);
    console.log('total_vectors:', result.total_vectors);
    console.log('\n✅ --add path completed successfully (no ENAMETOOLONG).');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n=== FAILURE ===');
    console.error(err.message);
    console.error('\n❌ --add path failed.');
    process.exit(1);
  });

