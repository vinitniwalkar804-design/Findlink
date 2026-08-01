import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { FoundPerson } from '../types';
import { PersonCard } from '../components/PersonCard';
import { Spinner, EmptyState } from '../components/ui';
import { api } from '../lib/api';

export default function FoundPersonsPage() {
  const [persons, setPersons] = useState<FoundPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getFoundPersons(statusFilter !== 'all' ? statusFilter : undefined);
        setPersons(data as FoundPerson[]);
      } catch (err) {
        console.error('Error loading found persons:', err);
      }
      setLoading(false);
    })();
  }, [statusFilter]);

  const filtered = persons.filter((p) =>
    !search ||
    (p.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.found_address ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Found Persons</h1>
        <p className="mt-2 text-gray-500">Unknown individuals found by citizens and police</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search by description or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="unidentified">Unidentified</option>
          <option value="identified">Identified</option>
          <option value="reunited">Reunited</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="No found persons reported" message="No found person records match your search" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => <PersonCard key={p.id} person={p} type="found" />)}
        </div>
      )}
    </div>
  );
}
