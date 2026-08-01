import { Link } from 'react-router-dom';
import { UserPlus, Search, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner, EmptyState } from '../../components/ui';

export default function CitizenDashboard() {
  const { profile } = useAuth();
  const [foundPersons, setFoundPersons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    api.getMyFoundPersons()
      .then((data) => { setFoundPersons(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Citizen Dashboard</h1>
        <p className="mt-2 text-gray-500">Welcome, {profile?.full_name}. Help reunite families.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/citizen/report-found" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform"><UserPlus size={24} /></div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Report a Found Person</h2>
              <p className="text-sm text-gray-500">Found someone who may be lost or missing?</p>
            </div>
        </div>
        </Link>
        <Link to="/citizen/search" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600 group-hover:scale-110 transition-transform"><Search size={24} /></div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Search Missing Persons</h2>
              <p className="text-sm text-gray-500">Browse the missing persons database</p>
            </div>
        </div>
        </Link>
      </div>
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Found Person Reports</h2>
          </div>
<Link to="/citizen/report-found" className="btn-primary"><UserPlus size={16} /> Report Found
        </Link>
        </div>
        {foundPersons.length === 0 ? (
          <EmptyState icon={<Users size={48} />} title="No reports yet" message="Report a found person to help reunite them with their family" />
        ) : (
          <div className="space-y-3">
            {foundPersons.map((fp) => (
              <div key={fp._id || fp.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {fp.photoUrl || fp.photo_url ? <img src={fp.photoUrl || fp.photo_url} alt="Found" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Users size={20} /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{fp.foundAddress || fp.found_address || 'Unknown location'}</p>
                  <p className="text-sm text-gray-500">{fp.foundDate || fp.found_date ? new Date(fp.foundDate || fp.found_date).toLocaleDateString() : ''}</p>
                </div>
                <span className={
                  fp.status === 'unidentified' ? 'badge-yellow' :
                  fp.status === 'identified' ? 'badge-blue' :
                  'badge-green'
                }>{fp.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}