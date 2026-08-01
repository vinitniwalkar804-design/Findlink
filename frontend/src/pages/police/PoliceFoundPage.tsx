import { useEffect, useState } from 'react';
import { Search, Users, Link2, CheckCircle2 } from 'lucide-react';
import { FoundPerson } from '../../types';
import { Spinner, EmptyState } from '../../components/ui';
import { api } from '../../lib/api';

export default function PoliceFoundPage() {
  const [foundPersons, setFoundPersons] = useState<FoundPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getFoundPersons();
        setFoundPersons(data as FoundPerson[]);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const runFaceMatch = async (foundPersonId: string) => {
    setMatching(foundPersonId);
    alert('Photo matching will be implemented in a future update.');
    setMatching(null);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateFoundPersonStatus(id, status);
      setFoundPersons((prev) => prev.map((fp) => fp.id === id ? { ...fp, status: status as FoundPerson['status'] } : fp));
    } catch (err) { console.error(err); }
  };

  const filtered = foundPersons.filter((fp) =>
    !search || (fp.found_address ?? '').toLowerCase().includes(search.toLowerCase()) || (fp.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Found Persons</h1>
        <p className="mt-2 text-gray-500">Review found persons and run photo matching</p>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-10" placeholder="Search by address or description..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="No found persons" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((fp) => (
            <div key={fp.id || fp._id} className="card overflow-hidden">
              <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                {fp.photo_url ? <img src={fp.photo_url} alt="Found" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Users size={40} className="text-gray-300" /></div>}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={fp.status === 'unidentified' ? 'badge-yellow' : fp.status === 'identified' ? 'badge-blue' : 'badge-green'}>{fp.status}</span>
                  {fp.found_date && <span className="text-xs text-gray-400">{new Date(fp.found_date).toLocaleDateString()}</span>}
                </div>
                {fp.found_address && <p className="text-sm text-gray-500 mb-1">{fp.found_address}</p>}
                {fp.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{fp.description}</p>}
                <div className="flex gap-2">
                  <button onClick={() => runFaceMatch(fp.id)} disabled={matching === fp.id} className="btn-primary text-xs flex-1">
                    {matching === fp.id ? <><Spinner size={14} /> Matching...</> : <><Link2 size={14} /> Run Match</>}
                  </button>
                  {fp.status === 'unidentified' && (
                    <button onClick={() => updateStatus(fp.id, 'reunited')} className="btn-secondary text-xs">
                      <CheckCircle2 size={14} /> Reunited
                    </button>
                  )}
                </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
