import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Users, CheckCircle2, Search, FileText, ArrowRight, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MissingPerson, FoundPerson } from '../../types';
import { Spinner, EmptyState } from '../../components/ui';
import { api } from '../../lib/api';

export default function PoliceDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ activeMissing: 0, foundPersons: 0, pendingMatches: 0, reunited: 0 });
  const [recentMissing, setRecentMissing] = useState<MissingPerson[]>([]);
  const [recentFound, setRecentFound] = useState<FoundPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'missing' | 'found'; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const statsData = await api.getStats();
        setStats({
          activeMissing: statsData.activeMissing || 0,
          foundPersons: statsData.foundPersons || 0,
          pendingMatches: statsData.pendingMatches || 0,
          reunited: statsData.reunited || 0,
        });
        const missingData = await api.getMissingPersons();
        setRecentMissing((missingData as MissingPerson[])?.slice(0, 5) || []);
        const foundData = await api.getFoundPersons();
        setRecentFound((foundData as FoundPerson[])?.slice(0, 5) || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      if (deleteConfirm.type === 'missing') {
        await api.deleteMissingPerson(deleteConfirm.id);
        setRecentMissing((prev) => prev.filter((mp) => mp.id !== deleteConfirm.id));
        setStats((prev) => ({ ...prev, activeMissing: Math.max(0, prev.activeMissing - 1) }));
      } else {
        await api.deleteFoundPerson(deleteConfirm.id);
        setRecentFound((prev) => prev.filter((fp) => fp.id !== deleteConfirm.id));
        setStats((prev) => ({ ...prev, foundPersons: Math.max(0, prev.foundPersons - 1) }));
      }
      setDeleteConfirm(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete report');
    }
    setDeleting(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Police Dashboard</h1>
          <p className="mt-2 text-gray-500">Officer: {profile?.full_name} · {profile?.badge_number} · {profile?.department}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: AlertCircle, label: 'Active Missing', value: stats.activeMissing, color: 'bg-amber-100 text-amber-600' },
            { icon: Users, label: 'Unidentified Found', value: stats.foundPersons, color: 'bg-blue-100 text-blue-600' },
            { icon: Search, label: 'Pending Matches', value: stats.pendingMatches, color: 'bg-purple-100 text-purple-600' },
            { icon: CheckCircle2, label: 'Reunited', value: stats.reunited, color: 'bg-green-100 text-green-600' },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${s.color} mb-3`}><s.icon size={20} /></div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Missing Reports</h2>
              <Link to="/police/cases" className="text-sm text-blue-600 hover:underline flex items-center gap-1">View All <ArrowRight size={14} /></Link>
            </div>
            {recentMissing.length === 0 ? (
              <EmptyState icon={<AlertCircle size={40} />} title="No missing reports" />
            ) : (
              <div className="space-y-3">
                {recentMissing.map((mp) => (
                  <div key={mp.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {mp.photo_url ? <img src={mp.photo_url} alt={mp.full_name} className="w-full h-full object-cover" /> : <Users size={20} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{mp.full_name}</p>
                      <p className="text-xs text-gray-500">{mp.last_seen_address || 'No address'}</p>
                    </div>
                    <span className={mp.status === 'active' ? 'badge-yellow' : mp.status === 'found' ? 'badge-green' : 'badge-gray'}>{mp.status}</span>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'missing', id: mp.id, name: mp.full_name })}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete report"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Found Persons</h2>
              <Link to="/police/found" className="text-sm text-blue-600 hover:underline flex items-center gap-1">View All <ArrowRight size={14} /></Link>
            </div>
            {recentFound.length === 0 ? (
              <EmptyState icon={<Users size={40} />} title="No found persons" />
            ) : (
              <div className="space-y-3">
                {recentFound.map((fp) => (
                  <div key={fp.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {fp.photo_url ? <img src={fp.photo_url} alt="Found" className="w-full h-full object-cover" /> : <Users size={20} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{fp.found_address || 'Unknown location'}</p>
                      <p className="text-xs text-gray-500">{fp.found_date ? new Date(fp.found_date).toLocaleDateString() : ''}</p>
                    </div>
                    <span className={fp.status === 'unidentified' ? 'badge-yellow' : fp.status === 'identified' ? 'badge-blue' : 'badge-green'}>{fp.status}</span>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'found', id: fp.id, name: fp.found_address || 'Unknown location' })}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete report"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/police/cases" className="card p-5 hover:shadow-md transition-shadow group">
            <FileText size={24} className="text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Manage Cases</h3>
            <p className="text-sm text-gray-500">View and update missing person cases</p>
          </Link>
          <Link to="/police/found" className="card p-5 hover:shadow-md transition-shadow group">
            <Users size={24} className="text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Found Persons</h3>
            <p className="text-sm text-gray-500">Review and verify found persons</p>
          </Link>
          <Link to="/police/upload-found" className="card p-5 hover:shadow-md transition-shadow group">
            <Search size={24} className="text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Upload Found Person</h3>
            <p className="text-sm text-gray-500">Upload photo and run photo matching</p>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Report</h3>
              <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded-md text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-primary text-sm bg-red-600 hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? <><Spinner size={14} /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}