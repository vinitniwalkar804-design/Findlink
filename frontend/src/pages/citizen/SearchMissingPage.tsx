import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { MissingPerson } from '../../types';
import { PersonCard } from '../../components/PersonCard';
import { Spinner, EmptyState } from '../../components/ui';
import { api } from '../../lib/api';

export default function SearchMissingPage() {
  const [persons, setPersons] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMissingPersons('active');
        setPersons(data as MissingPerson[]);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const filtered = persons.filter((p) => {
    const matchSearch = !search || p.full_name.toLowerCase().includes(search.toLowerCase()) || (p.description ?? '').toLowerCase().includes(search.toLowerCase()) || (p.last_seen_address ?? '').toLowerCase().includes(search.toLowerCase());
    const matchGender = genderFilter === 'all' || p.gender === genderFilter;
    return matchSearch && matchGender;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Search Missing Persons</h1>
        <p className="mt-2 text-gray-500">Help identify missing persons by browsing active cases</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search by name, description, or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="all">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="No results found" message="Try adjusting your search criteria" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => <PersonCard key={p.id} person={p} type="missing" />)}
        </div>
      )}
    </div>
  );
}