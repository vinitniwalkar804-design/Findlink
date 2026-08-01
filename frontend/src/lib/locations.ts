import { Location, LocationLevel } from '../types';

// The Vite dev server proxies /api to the MongoDB backend at localhost:5000
const API_BASE = '/api';

/**
 * Fetch locations by parent for a given level.
 * Uses the MongoDB backend REST API.
 */
export async function getLocationsByParent(parentId: string | null, level: LocationLevel): Promise<Location[]> {
  try {
    if (level === 'state') {
      // For states, first get India's country ID, then fetch states
      const countriesRes = await fetch(`${API_BASE}/countries`);
      if (!countriesRes.ok) throw new Error('Failed to fetch countries');
      const countries = await countriesRes.json();
      const india = countries.find((c: any) => c.name === 'India');
      if (!india) return [];

      const res = await fetch(`${API_BASE}/states?countryId=${india._id}`);
      if (!res.ok) throw new Error('Failed to fetch states');
      const states = await res.json();
      return states.map((s: any) => ({
        id: s._id,
        name: s.name,
        level: 'state' as LocationLevel,
        parent_id: s.countryId,
        latitude: null,
        longitude: null,
        created_at: s.createdAt || '',
      }));
    }

    if (level === 'district') {
      if (!parentId) return [];
      const res = await fetch(`${API_BASE}/districts?stateId=${parentId}`);
      if (!res.ok) throw new Error('Failed to fetch districts');
      const districts = await res.json();
      return districts.map((d: any) => ({
        id: d._id,
        name: d.name,
        level: 'district' as LocationLevel,
        parent_id: d.stateId,
        latitude: null,
        longitude: null,
        created_at: d.createdAt || '',
      }));
    }

    if (level === 'city') {
      if (!parentId) return [];
      const res = await fetch(`${API_BASE}/cities?districtId=${parentId}`);
      if (!res.ok) throw new Error('Failed to fetch cities');
      const cities = await res.json();
      return cities.map((c: any) => ({
        id: c._id,
        name: c.name,
        level: 'city' as LocationLevel,
        parent_id: c.districtId,
        latitude: null,
        longitude: null,
        created_at: c.createdAt || '',
      }));
    }

    return [];
  } catch (err) {
    console.error('Error fetching locations:', err);
    return [];
  }
}

/**
 * Look up a single location by its _id across all location types.
 */
export async function getLocationById(id: string): Promise<Location | null> {
  try {
    // Try states
    const statesRes = await fetch(`${API_BASE}/states`);
    if (statesRes.ok) {
      const states = await statesRes.json();
      const found = states.find((s: any) => s._id === id);
      if (found) {
        return {
          id: found._id,
          name: found.name,
          level: 'state',
          parent_id: found.countryId || null,
          latitude: null,
          longitude: null,
          created_at: found.createdAt || '',
        };
      }
    }

    // Iterate states to search districts
    const allStatesRes = await fetch(`${API_BASE}/states`);
    if (allStatesRes.ok) {
      const allStates = await allStatesRes.json();
      for (const state of allStates) {
        const distRes = await fetch(`${API_BASE}/districts?stateId=${state._id}`);
        if (distRes.ok) {
          const districts = await distRes.json();
          const found = districts.find((d: any) => d._id === id);
          if (found) {
            return {
              id: found._id,
              name: found.name,
              level: 'district',
              parent_id: found.stateId,
              latitude: null,
              longitude: null,
              created_at: found.createdAt || '',
            };
          }
        }
      }
    }

    // Iterate states and districts to search cities
    const allStates2Res = await fetch(`${API_BASE}/states`);
    if (allStates2Res.ok) {
      const allStates2 = await allStates2Res.json();
      for (const state of allStates2) {
        const distRes = await fetch(`${API_BASE}/districts?stateId=${state._id}`);
        if (distRes.ok) {
          const districts = await distRes.json();
          for (const district of districts) {
            const cityRes = await fetch(`${API_BASE}/cities?districtId=${district._id}`);
            if (cityRes.ok) {
              const cities = await cityRes.json();
              const found = cities.find((c: any) => c._id === id);
              if (found) {
                return {
                  id: found._id,
                  name: found.name,
                  level: 'city',
                  parent_id: found.districtId,
                  latitude: null,
                  longitude: null,
                  created_at: found.createdAt || '',
                };
              }
            }
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Build the full hierarchy chain from a leaf location ID upward.
 */
export async function getLocationChain(id: string): Promise<Location[]> {
  try {
    const allStatesRes = await fetch(`${API_BASE}/states`);
    if (!allStatesRes.ok) return [];
    const allStates = await allStatesRes.json();

    for (const state of allStates) {
      const distRes = await fetch(`${API_BASE}/districts?stateId=${state._id}`);
      if (!distRes.ok) continue;
      const districts = await distRes.json();

      for (const district of districts) {
        const cityRes = await fetch(`${API_BASE}/cities?districtId=${district._id}`);
        if (!cityRes.ok) continue;
        const cities = await cityRes.json();

        // Check if id matches a city
        const matchedCity = cities.find((c: any) => c._id === id);
        if (matchedCity) {
          return [
            {
              id: state._id,
              name: state.name,
              level: 'state',
              parent_id: state.countryId || null,
              latitude: null,
              longitude: null,
              created_at: state.createdAt || '',
            },
            {
              id: district._id,
              name: district.name,
              level: 'district',
              parent_id: district.stateId,
              latitude: null,
              longitude: null,
              created_at: district.createdAt || '',
            },
            {
              id: matchedCity._id,
              name: matchedCity.name,
              level: 'city',
              parent_id: matchedCity.districtId,
              latitude: null,
              longitude: null,
              created_at: matchedCity.createdAt || '',
            },
          ];
        }
      }
    }

    // Check if id matches a district
    for (const state of allStates) {
      const distRes = await fetch(`${API_BASE}/districts?stateId=${state._id}`);
      if (!distRes.ok) continue;
      const districts = await distRes.json();
      const matchedDistrict = districts.find((d: any) => d._id === id);
      if (matchedDistrict) {
        return [
          {
            id: state._id,
            name: state.name,
            level: 'state',
            parent_id: state.countryId || null,
            latitude: null,
            longitude: null,
            created_at: state.createdAt || '',
          },
          {
            id: matchedDistrict._id,
            name: matchedDistrict.name,
            level: 'district',
            parent_id: matchedDistrict.stateId,
            latitude: null,
            longitude: null,
            created_at: matchedDistrict.createdAt || '',
          },
        ];
      }
    }

    // Check if id matches a state
    const matchedState = allStates.find((s: any) => s._id === id);
    if (matchedState) {
      return [
        {
          id: matchedState._id,
          name: matchedState.name,
          level: 'state',
          parent_id: matchedState.countryId || null,
          latitude: null,
          longitude: null,
          created_at: matchedState.createdAt || '',
        },
      ];
    }

    return [];
  } catch {
    return [];
  }
}
