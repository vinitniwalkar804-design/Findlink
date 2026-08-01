/**
 * Comprehensive City Seed Script
 * 
 * Populates the cities collection for ALL districts in India.
 * Preserves existing cities and adds missing ones.
 * 
 * Run: node backend/scripts/seed_cities.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findlink';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const { City, District, State } = require('../models/index');

  // Load existing cities from seed file
  const seedCitiesPath = path.join(__dirname, '..', '..', 'seed', 'cities_comprehensive.json');
  const seedCities = JSON.parse(fs.readFileSync(seedCitiesPath, 'utf8'));
  console.log(`Loaded ${seedCities.length} cities from seed file`);

  // Get all districts with their state codes
  const allDistricts = await District.find().populate('stateId', 'name stateCode').sort({ name: 1 });
  console.log(`Total districts in database: ${allDistricts.length}`);

  // Build a map: stateCode:districtName -> district document
  const districtMap = {};
  for (const d of allDistricts) {
    const key = `${d.stateCode}:${d.name}`;
    districtMap[key] = d;
  }

  // Get existing cities to avoid duplicates
  const existingCities = await City.find({}, { districtId: 1 });
  const existingDistrictIds = new Set(existingCities.map(c => c.districtId ? c.districtId.toString() : null));

  // Track which districts get cities
  const coveredDistricts = new Set();
  const newCities = [];

  // Process seed data
  for (const entry of seedCities) {
    const key = `${entry.stateCode}:${entry.district}`;
    const district = districtMap[key];
    
    if (!district) {
      console.warn(`  WARNING: District not found for key "${key}" (city: ${entry.name})`);
      continue;
    }

    // Skip if city already exists for this district (exact name match)
    const existingCity = await City.findOne({ name: entry.name, districtId: district._id });
    if (existingCity) {
      coveredDistricts.add(district._id.toString());
      continue;
    }

    newCities.push({
      name: entry.name,
      districtId: district._id,
      stateId: district.stateId || district.stateId?._id || null,
    });
    coveredDistricts.add(district._id.toString());
  }

  console.log(`Cities to create from seed data: ${newCities.length}`);

  // Find districts that still have no cities
  const missingDistricts = allDistricts.filter(d => !coveredDistricts.has(d._id.toString()));
  console.log(`Districts still missing cities: ${missingDistricts.length}`);

  // Create default cities for missing districts
  for (const district of missingDistricts) {
    // Use the district name as the primary city name
    const cityName = district.name;
    newCities.push({
      name: cityName,
      districtId: district._id,
      stateId: district.stateId?._id || district.stateId || null,
    });
    coveredDistricts.add(district._id.toString());
  }

  // Batch insert all new cities
  if (newCities.length > 0) {
    // Insert in batches of 500 to avoid MongoDB document size limits
    const BATCH_SIZE = 500;
    let inserted = 0;
    for (let i = 0; i < newCities.length; i += BATCH_SIZE) {
      const batch = newCities.slice(i, i + BATCH_SIZE);
      const result = await City.insertMany(batch, { ordered: false });
      inserted += result.length;
      console.log(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${result.length} cities`);
    }
    console.log(`Total new cities inserted: ${inserted}`);
  } else {
    console.log('No new cities to insert');
  }

  // Verify results
  const totalCities = await City.countDocuments();
  const districtsWithCities = await City.distinct('districtId');
  const districtsWithNullDistrict = await City.countDocuments({ districtId: null });
  const allDistrictsCount = await District.countDocuments();

  console.log('\n=== VERIFICATION ===');
  console.log(`Total cities: ${totalCities}`);
  console.log(`Total districts: ${allDistrictsCount}`);
  console.log(`Districts with cities: ${districtsWithCities.length}`);
  console.log(`Districts WITHOUT cities: ${allDistrictsCount - districtsWithCities.length}`);
  console.log(`Cities with null districtId: ${districtsWithNullDistrict}`);

  if (districtsWithCities.length === allDistrictsCount) {
    console.log('✅ ALL districts now have cities!');
  } else {
    console.log(`❌ ${allDistrictsCount - districtsWithCities.length} districts still have no cities`);
    const missing = allDistricts.filter(d => !districtsWithCities.some(cid => cid.toString() === d._id.toString()));
    missing.forEach(d => console.log(`  Missing: ${d.name}`));
  }

  await mongoose.disconnect();
  console.log('\nDone.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});