import { useEffect, useState } from 'react';
import { Search, Users, AlertCircle } from 'lucide-react';
import { MissingPerson } from '../../types';
import { Spinner, EmptyState } from '../../components/ui';
import { api } from '../../lib/api';

export default function PoliceCasesPage() {
  const [cases, setCases] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMissingPersons(statusFilter !== 'all' ? statusFilter : undefined);
        setCases(data as MissingPerson[]);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateMissingPersonStatus(id, status);
      setCases((prev) => prev.map((c) => c.id === id ? { ...c, status: status as MissingPerson['status'] } : c));
    } catch (err) { console.error(err); }
  };

  const filtered = cases.filter((c) => !search || c.full_name.toLowerCase().includes(search.toLowerCase()) || (c.description ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Case Management</h1>
        <p className="mt-2 text-gray-500">View and manage all missing person cases</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search cases..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="found">Found</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<AlertCircle size={48} />} title="No cases found" />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {c.photo_url ? <img src={c.photo_url} alt={c.full_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Users size={24} className="text-gray-300" /></div>}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{c.full_name}</h3>
                      <p className="text-sm text-gray-500">{c.age ? `${c.age} yrs` : ''} {c.gender ? `· ${c.gender}` : ''}</p>
                      {c.last_seen_address && <p className="text-sm text-gray-500">Last seen: {c.last_seen_address}</p>}
                      {c.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{c.description}</p>}
                    </div>
                    <span className={c.status === 'active' ? 'badge-yellow' : c.status === 'found' ? 'badge-green' : 'badge-gray'}>{c.status}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {c.status === 'active' && (
                      <><button onClick={() => updateStatus(c.id, 'found')} className="btn-secondary text-xs">Mark Found</button>
                      <button onClick={() => updateStatus(c.id, 'closed')} className="btn-secondary text-xs">Close Case</button></>
                    )}
                    {c.status === 'found' && <button onClick={() => updateStatus(c.id, 'closed')} className="btn-secondary text-xs">Close Case</button>}
                    {(c.status === 'closed' || c.status === 'found') && <button onClick={() => updateStatus(c.id, 'active')} className="btn-secondary text-xs">Reopen</button>}
                  </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
