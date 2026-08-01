import { useState, useEffect } from 'react';
import { getLocationsByParent } from '../lib/locations';
import { Location } from '../types';

interface LocationSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label: string;
}

export function LocationSelector({ value, onChange, label }: LocationSelectorProps) {
  const [states, setStates] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [loading, setLoading] = useState({
    states: false,
    districts: false,
    cities: false,
  });

  // Load states on mount
  useEffect(() => {
    loadStates();
  }, []);

  async function loadStates() {
    setLoading(prev => ({ ...prev, states: true }));
    const data = await getLocationsByParent(null, 'state');
    setStates(data);
    setLoading(prev => ({ ...prev, states: false }));
  }

  async function loadDistricts(stateId: string) {
    setLoading(prev => ({ ...prev, districts: true }));
    const data = await getLocationsByParent(stateId, 'district');
    setDistricts(data);
    setLoading(prev => ({ ...prev, districts: false }));
  }

  async function loadCities(districtId: string) {
    setLoading(prev => ({ ...prev, cities: true }));
    const data = await getLocationsByParent(districtId, 'city');
    setCities(data);
    setLoading(prev => ({ ...prev, cities: false }));
  }

  function handleStateChange(stateId: string) {
    setSelectedState(stateId);
    setSelectedDistrict('');
    setSelectedCity('');
    setDistricts([]);
    setCities([]);
    onChange(null);
    if (stateId) {
      loadDistricts(stateId);
    }
  }

  function handleDistrictChange(districtId: string) {
    setSelectedDistrict(districtId);
    setSelectedCity('');
    setCities([]);
    onChange(null);
    if (districtId) {
      loadCities(districtId);
    }
  }

  function handleCityChange(cityId: string) {
    setSelectedCity(cityId);
    onChange(cityId || null);
  }

  return (
    <div className="space-y-3">
      <label className="label">{label}</label>

      {/* State */}
      <div>
        <select
          className="input"
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
        >
          <option value="">Select State</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* District - loads automatically when state is selected */}
      {selectedState && (
        <div>
          <select
            className="input"
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* City - loads automatically when district is selected */}
      {selectedDistrict && (
        <div>
          <select
            className="input"
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
          >
            <option value="">Select City</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}