const { MongoClient } = require('mongodb');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/findlink';

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db('findlink');

  const count = await db.collection('countries').countDocuments();
  if (count === 0) {
    const result = await db.collection('countries').insertOne({
      name: 'India',
      code: 'IN',
      phoneCode: '+91',
      createdAt: new Date()
    });
    console.log('Inserted India country:', result.insertedId);
  } else {
    console.log('Country already exists, count:', count);
  }

  // Link states to India
  await db.collection('states').updateMany(
    { countryId: { $exists: false } },
    { $set: { countryId: (await db.collection('countries').findOne({ name: 'India' }))._id } }
  );
  console.log('Linked states to India');

  // Link districts to states
  const states = await db.collection('states').find({}).toArray();
  for (const state of states) {
    await db.collection('districts').updateMany(
      { stateCode: state.stateCode, stateId: { $exists: false } },
      { $set: { stateId: state._id } }
    );
  }
  console.log('Linked districts to states');

  // Link cities to districts
  const districts = await db.collection('districts').find({}).toArray();
  for (const district of districts) {
    await db.collection('cities').updateMany(
      { district: district.name, districtId: { $exists: false } },
      { $set: { districtId: district._id, stateId: district.stateId } }
    );
  }
  console.log('Linked cities to districts');

  // Link police stations to cities
  const cities = await db.collection('cities').find({}).toArray();
  for (const city of cities) {
    await db.collection('policeStations').updateMany(
      { city: city.name, cityId: { $exists: false } },
      { $set: { cityId: city._id, districtId: city.districtId, stateId: city.stateId } }
    );
  }
  console.log('Linked police stations to cities');

  console.log('\nDone! All locations linked.');
  await client.close();
}

main().catch(console.error);
