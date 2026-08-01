/**
 * MongoDB Location Database Seed Script
 * 
 * Populates a MongoDB database (named 'findlink') with India's location hierarchy:
 *   - states:     36 documents (28 states + 8 union territories)
 *   - districts:  ~750 documents covering all states/UTs
 *   - cities:     ~200 major Indian cities mapped to districts and states
 *   - policeStations: ~85 sample police stations mapped to cities
 * 
 * Usage:
 *   1. Ensure MongoDB is running (use "net start MongoDB" or start mongod.exe)
 *   2. Set MONGO_URI in .env (or the default mongodb://127.0.0.1:27017/findlink will be used)
 *   3. Run: node seed/seed.js
 * 
 * The script is idempotent — it only inserts data if a collection is empty.
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Default MongoDB URI — set MONGO_URI in .env to override
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/findlink';
const DB_NAME = 'findlink';

async function seed() {
  console.log('========================================');
  console.log('  FindLink MongoDB Location Seed Script');
  console.log('========================================\n');

  // 1. Connect to MongoDB
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  let client;
  try {
    client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    console.log('  ✓ Connected successfully\n');
  } catch (err) {
    console.error(`  ✗ Connection failed: ${err.message}`);
    console.error('\nMake sure MongoDB Community Server is running.');
    console.error('  Start it from Services panel or run:');
    console.error('    "C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe" --dbpath "C:\\data\\db"');
    process.exit(1);
  }

  const db = client.db(DB_NAME);

  // 2. Seed states collection
  console.log('1/4  Seeding states...');
  const statesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'states.json'), 'utf-8'));
  const statesCount = await db.collection('states').countDocuments();
  if (statesCount === 0) {
    const docs = statesData.map((s) => ({
      stateCode: s.stateCode,
      name: s.name,
      type: s.type,
      createdAt: new Date(),
    }));
    const result = await db.collection('states').insertMany(docs);
    console.log(`  ✓ Inserted ${result.insertedCount} states/UTs`);
  } else {
    console.log(`  - Skipped (collection already has ${statesCount} documents)`);
  }

  // 3. Seed districts collection
  console.log('2/4  Seeding districts...');
  const districtsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'districts.json'), 'utf-8'));
  const districtsCount = await db.collection('districts').countDocuments();
  if (districtsCount === 0) {
    const docs = districtsData.map((d) => ({
      name: d.name,
      stateCode: d.stateCode,
      createdAt: new Date(),
    }));
    const result = await db.collection('districts').insertMany(docs);
    console.log(`  ✓ Inserted ${result.insertedCount} districts`);
  } else {
    console.log(`  - Skipped (collection already has ${districtsCount} documents)`);
  }

  // 4. Seed cities collection
  console.log('3/4  Seeding cities...');
  const citiesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'cities.json'), 'utf-8'));
  const citiesCount = await db.collection('cities').countDocuments();
  if (citiesCount === 0) {
    const docs = citiesData.map((c) => ({
      name: c.name,
      district: c.district,
      stateCode: c.stateCode,
      createdAt: new Date(),
    }));
    const result = await db.collection('cities').insertMany(docs);
    console.log(`  ✓ Inserted ${result.insertedCount} cities`);
  } else {
    console.log(`  - Skipped (collection already has ${citiesCount} documents)`);
  }

  // 5. Seed policeStations collection
  console.log('4/4  Seeding policeStations...');
  const psData = JSON.parse(fs.readFileSync(path.join(__dirname, 'policeStations.json'), 'utf-8'));
  const psCount = await db.collection('policeStations').countDocuments();
  if (psCount === 0) {
    const docs = psData.map((ps) => ({
      name: ps.name,
      city: ps.city,
      stateCode: ps.stateCode,
      createdAt: new Date(),
    }));
    const result = await db.collection('policeStations').insertMany(docs);
    console.log(`  ✓ Inserted ${result.insertedCount} police stations`);
  } else {
    console.log(`  - Skipped (collection already has ${psCount} documents)`);
  }

  // 6. Summary
  console.log('\n========================================');
  console.log('  Seed Summary');
  console.log('========================================');
  console.log(`  Database:     ${DB_NAME}`);
  console.log(`  States:       ${await db.collection('states').countDocuments()}`);
  console.log(`  Districts:    ${await db.collection('districts').countDocuments()}`);
  console.log(`  Cities:       ${await db.collection('cities').countDocuments()}`);
  console.log(`  PoliceStns:   ${await db.collection('policeStations').countDocuments()}`);
  console.log('========================================');
  console.log('  ✅ Location database seeded successfully!\n');

  await client.close();
}

seed().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});