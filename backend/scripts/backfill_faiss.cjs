/**
 * Backfill FAISS Index from MongoDB
 * ===================================
 * 
 * Reads all active missing persons with faceEmbedding from MongoDB
 * and adds them to the FAISS index.
 * 
 * Usage: node scripts/backfill_faiss.cjs
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { MissingPerson } = require('../models/index');
const { addToIndex } = require('../services/faceMatching');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findlink';

async function backfill() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find all active missing persons with face embeddings
  const persons = await MissingPerson.find(
    { status: 'active', faceEmbedding: { $ne: null } },
    { _id: 1, fullName: 1, faceEmbedding: 1 }
  );

  console.log(`Found ${persons.length} missing persons with embeddings`);

  let added = 0;
  let errors = 0;

  for (const person of persons) {
    try {
      const result = await addToIndex(
        person._id.toString(),
        [person.faceEmbedding],
        person.fullName
      );
      added += result.added_count || 0;
      console.log(`[OK] ${person.fullName} (${person._id}) -> added ${result.added_count} vectors`);
    } catch (err) {
      errors++;
      console.error(`[ERR] ${person.fullName} (${person._id}): ${err.message}`);
    }
  }

  console.log(`\nBackfill complete: ${added} vectors added, ${errors} errors`);
  
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

backfill().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});