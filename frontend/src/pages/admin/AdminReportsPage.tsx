import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner, EmptyState } from '../../components/ui';
import { Search, FileText } from 'lucide-react';

interface ReportItem {
  id: string;
  reporter_id: string;
  report_type: string;
  reference_id: string;
  created_at: string;
  reporter: { id: string; full_name: string } | null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getReports();
        setReports(data ?? []);
      } catch (err) {
        console.error('Error loading reports:', err);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = reports.filter((r) => {
    const matchSearch = !search || r.report_type.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.report_type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-500">All system activity reports</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="missing">Missing</option>
          <option value="found">Found</option>
          <option value="match">Match</option>
          <option value="reunification">Reunification</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={48} />} title="No reports found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className="badge-blue">{r.report_type}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-900">{r.reporter?.full_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{r.reference_id?.toString().slice(0, 8) ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
