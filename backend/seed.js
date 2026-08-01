require('dotenv').config();
const mongoose = require('mongoose');

const STATES_DATA = require('../seed/states.json');
const DISTRICTS_DATA = require('../seed/districts.json');
const CITIES_DATA = require('../seed/cities_comprehensive.json');
const POLICE_STATIONS_DATA = require('../seed/policeStations.json');

const { Country, State, District, City, PoliceStation } = require('./models/index');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findlink');
  console.log('Connected to MongoDB');

  // Check if data already exists (idempotent seeding)
  const existingStates = await State.countDocuments();
  const existingDistricts = await District.countDocuments();
  const existingCities = await City.countDocuments();
  const existingPoliceStations = await PoliceStation.countDocuments();

  if (existingStates > 0 && existingDistricts > 0 && existingCities > 0) {
    console.log(`Location data already exists: ${existingStates} states, ${existingDistricts} districts, ${existingCities} cities, ${existingPoliceStations} police stations`);
    console.log('Skipping seed. To re-seed, drop the collections first.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Clear existing data if partially seeded
  await Promise.all([
    Country.deleteMany({}),
    State.deleteMany({}),
    District.deleteMany({}),
    City.deleteMany({}),
    PoliceStation.deleteMany({}),
  ]);
  console.log('Cleared existing location data');

  // Create India
  const india = await Country.create({ name: 'India', code: 'IN', phoneCode: '+91' });
  console.log(`Created country: ${india.name}`);

  // Create States/UTs
  const stateMap = {};
  for (const s of STATES_DATA) {
    const state = await State.create({
      name: s.name,
      stateCode: s.stateCode,
      type: s.type,
      countryId: india._id,
    });
    stateMap[s.stateCode] = state;
  }
  console.log(`Created ${STATES_DATA.length} states/union territories`);

  // Create Districts
  const districtMap = {};
  for (const d of DISTRICTS_DATA) {
    if (!stateMap[d.stateCode]) {
      console.warn(`  Warning: State code ${d.stateCode} not found for district ${d.name}`);
      continue;
    }
    const district = await District.create({
      name: d.name,
      stateId: stateMap[d.stateCode]._id,
      stateCode: d.stateCode,
    });
    const key = `${d.stateCode}:${d.name}`;
    districtMap[key] = district;
  }
  console.log(`Created ${Object.keys(districtMap).length} districts`);

  // Create Cities - using comprehensive data
  const cityMap = {};
  let cityCount = 0;
  const seenCityKeys = new Set(); // Prevent duplicate entries

  for (const c of CITIES_DATA) {
    const stateId = stateMap[c.stateCode]?._id;
    const districtKey = `${c.stateCode}:${c.district}`;
    const districtId = districtMap[districtKey]?._id;

    if (!stateId) {
      console.warn(`  Warning: State code ${c.stateCode} not found for city ${c.name}`);
      continue;
    }

    // Skip duplicate city names within the same district
    const uniqueKey = `${c.stateCode}:${c.district}:${c.name}`;
    if (seenCityKeys.has(uniqueKey)) {
      continue;
    }
    seenCityKeys.add(uniqueKey);

    const city = await City.create({
      name: c.name,
      districtId: districtId || null,
      stateId: stateId || null,
    });

    // Index by both name:stateCode for police station lookup
    const lookupKey = `${c.name}:${c.stateCode}`;
    cityMap[lookupKey] = city;
    cityCount++;
  }
  console.log(`Created ${cityCount} cities`);

  // Create Police Stations
  let psCount = 0;
  const seenPsKeys = new Set(); // Prevent duplicate police stations

  for (const ps of POLICE_STATIONS_DATA) {
    const stateId = stateMap[ps.stateCode]?._id;
    if (!stateId) {
      console.warn(`  Warning: State code ${ps.stateCode} not found for police station ${ps.name}`);
      continue;
    }

    // Skip duplicate police station names within the same state
    const psKey = `${ps.stateCode}:${ps.name}`;
    if (seenPsKeys.has(psKey)) {
      continue;
    }
    seenPsKeys.add(psKey);

    // Find the city using city name + stateCode lookup
    let cityId = null;
    if (ps.city) {
      const lookupKey = `${ps.city}:${ps.stateCode}`;
      if (cityMap[lookupKey]) {
        cityId = cityMap[lookupKey]._id;
      } else {
        console.warn(`  Warning: City "${ps.city}" in state ${ps.stateCode} not found for police station ${ps.name}`);
      }
    }

    // Find the district for this city
    let districtId = null;
    if (cityId) {
      const city = await City.findById(cityId);
      if (city && city.districtId) {
        districtId = city.districtId;
      }
    }

    await PoliceStation.create({
      name: ps.name,
      cityId: cityId,
      districtId: districtId,
      stateId: stateId,
    });
    psCount++;
  }
  console.log(`Created ${psCount} police stations`);

  console.log('\n=== Seed Complete ===');
  console.log(`Countries: 1`);
  console.log(`States/UTs: ${STATES_DATA.length}`);
  console.log(`Districts: ${Object.keys(districtMap).length}`);
  console.log(`Cities: ${cityCount}`);
  console.log(`Police Stations: ${psCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});