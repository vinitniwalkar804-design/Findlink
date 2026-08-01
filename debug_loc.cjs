const mongoose = require('mongoose');
const { Country, State, District, City } = require('./backend/models/index');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/findlink');
  
  const india = await Country.findOne({ name: 'India' });
  console.log('India ID:', india._id.toString());
  
  // Test: frontend calls /api/countries
  const countries = await Country.find().sort({ name: 1 });
  console.log('GET /api/countries: returns', countries.length, 'countries');
  const indiaFound = countries.find(c => c.name === 'India');
  console.log('Found India in countries:', indiaFound ? 'YES id='+indiaFound._id : 'NO');
  
  // Test: frontend calls /api/states?countryId=<india._id>
  const states = await State.find({ countryId: india._id }).sort({ name: 1 });
  console.log('GET /api/states?countryId=' + india._id + ': returns', states.length, 'states');
  if (states.length > 0) {
    console.log('  First state:', states[0].name, 'ID:', states[0]._id);
    console.log('  Last state:', states[states.length-1].name);
  }
  
  // Test: frontend calls /api/districts?stateId=<state._id>
  if (states.length > 0) {
    const districts = await District.find({ stateId: states[0]._id }).sort({ name: 1 });
    console.log('GET /api/districts?stateId=' + states[0]._id + ' (' + states[0].name + '): returns', districts.length, 'districts');
    if (districts.length > 0) {
      console.log('  First district:', districts[0].name, 'ID:', districts[0]._id);
    }
  }
  
  // Test: frontend calls /api/cities?districtId=<district._id>
  const anyDistrict = await District.findOne();
  if (anyDistrict) {
    const cities = await City.find({ districtId: anyDistrict._id }).sort({ name: 1 });
    console.log('GET /api/cities?districtId=' + anyDistrict._id + ' (' + anyDistrict.name + '): returns', cities.length, 'cities');
    if (cities.length > 0) {
      console.log('  First city:', cities[0].name);
    }
  }
  
  // Check duplicates
  console.log('\n=== Duplicate checks ===');
  const stateNames = await State.distinct('name');
  console.log('Unique state names:', stateNames.length, '(should be 36)');
  
  const allStates = await State.find();
  const stateNameCounts = {};
  for (const s of allStates) {
    stateNameCounts[s.name] = (stateNameCounts[s.name] || 0) + 1;
  }
  const stateDups = Object.entries(stateNameCounts).filter(([_, c]) => c > 1);
  console.log('State duplicates:', stateDups.length > 0 ? stateDups : 'None');
  
  // Check collection names  
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collNames = collections.map(c => c.name).sort();
  console.log('\nCollections:', collNames);
  
  // Check for duplicate collections (state vs states)
  console.log('\n"state" collection:', await mongoose.connection.db.collection('state').countDocuments(), 'docs');
  console.log('"states" collection:', await mongoose.connection.db.collection('states').countDocuments(), 'docs');
  
  if (await mongoose.connection.db.collection('state').countDocuments() > 0) {
    console.log('WARNING: "state" collection has docs! Checking...');
    const s = await mongoose.connection.db.collection('state').findOne();
    console.log('Sample "state" doc:', JSON.stringify(s, null, 2));
  }

  await mongoose.disconnect();
}
check().catch(console.error);

