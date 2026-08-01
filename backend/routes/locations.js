const express = require('express');
const router = express.Router();
const { Country, State, District, City, PoliceStation } = require('../models/index');

// GET /api/countries
router.get('/countries', async (req, res) => {
  try {
    const countries = await Country.find().sort({ name: 1 });
    res.json(countries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/states?countryId=<id>
router.get('/states', async (req, res) => {
  try {
    const { countryId } = req.query;
    const filter = countryId ? { countryId } : {};
    const states = await State.find(filter).sort({ name: 1 });
    res.json(states);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/districts?stateId=<id>
router.get('/districts', async (req, res) => {
  try {
    const { stateId } = req.query;
    if (!stateId) return res.status(400).json({ error: 'stateId is required' });
    const districts = await District.find({ stateId }).sort({ name: 1 });
    res.json(districts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cities?districtId=<id>&stateId=<id>
router.get('/cities', async (req, res) => {
  try {
    const { districtId, stateId } = req.query;
    const filter = {};
    if (districtId) filter.districtId = districtId;
    if (stateId) filter.stateId = stateId;
    if (!districtId && !stateId) {
      return res.status(400).json({ error: 'districtId or stateId is required' });
    }
    const cities = await City.find(filter).sort({ name: 1 });
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/police-stations?cityId=<id>&districtId=<id>&stateId=<id>
router.get('/police-stations', async (req, res) => {
  try {
    const { cityId, districtId, stateId } = req.query;
    const filter = {};
    if (cityId) filter.cityId = cityId;
    if (districtId) filter.districtId = districtId;
    if (stateId) filter.stateId = stateId;
    const stations = await PoliceStation.find(filter).sort({ name: 1 });
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations/chain?locationId=<id>&type=<type>
// Returns the full hierarchy chain for a given location
router.get('/chain', async (req, res) => {
  try {
    const { locationId, type } = req.query;
    if (!locationId || !type) {
      return res.status(400).json({ error: 'locationId and type are required' });
    }

    const chain = [];
    let currentId = locationId;

    if (type === 'police_station') {
      const ps = await PoliceStation.findById(currentId);
      if (ps) {
        chain.unshift({ _id: ps._id, name: ps.name, level: 'police_station' });
        currentId = ps.cityId;
      }
    }

    if (type === 'city' || currentId) {
      const city = await City.findById(currentId);
      if (city) {
        chain.unshift({ _id: city._id, name: city.name, level: 'city' });
        currentId = city.districtId;
      }
    }

    if (type === 'district' || currentId) {
      const district = await District.findById(currentId);
      if (district) {
        chain.unshift({ _id: district._id, name: district.name, level: 'district' });
        currentId = district.stateId;
      }
    }

    if (type === 'state' || currentId) {
      const state = await State.findById(currentId);
      if (state) {
        chain.unshift({ _id: state._id, name: state.name, level: 'state' });
      }
    }

    res.json(chain);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;