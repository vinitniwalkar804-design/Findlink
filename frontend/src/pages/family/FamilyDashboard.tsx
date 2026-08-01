import { Link } from 'react-router-dom';
import { UserPlus, Search, Bell, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { MissingPerson, FaceMatch } from '../../types';
import { Spinner, EmptyState } from '../../components/ui';
import { api } from '../../lib/api';

export default function FamilyDashboard() {
  const { profile } = useAuth();
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [matches, setMatches] = useState<FaceMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const mpData = await api.getMyMissingPersons();
        setMissingPersons(mpData as MissingPerson[]);
        const mpIds = (mpData ?? []).map((m: any) => m.id);
        if (mpIds.length > 0) {
          const matchData = await api.getFaceMatches({ missingPersonIds: mpIds });
          setMatches((matchData as FaceMatch[])?.slice(0, 5) || []);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  const activeCount = missingPersons.filter((m) => m.status === 'active').length;
  const foundCount = missingPersons.filter((m) => m.status === 'found').length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Family Dashboard</h1>
        <p className="mt-2 text-gray-500">Welcome back, {profile?.full_name}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 text-amber-600"><AlertCircle size={20} /></div>
            <div><p className="text-2xl font-bold text-gray-900">{activeCount}</p><p className="text-sm text-gray-500">Active Cases</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-600"><CheckCircle2 size={20} /></div>
            <div><p className="text-2xl font-bold text-gray-900">{foundCount}</p><p className="text-sm text-gray-500">Found</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600"><Bell size={20} /></div>
            <div><p className="text-2xl font-bold text-gray-900">{matches.length}</p><p className="text-sm text-gray-500">Matches</p></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Missing Person Reports</h2>
              <Link to="/family/report" className="btn-primary"><UserPlus size={16} /> Report Missing</Link>
            </div>
            {missingPersons.length === 0 ? (
              <EmptyState icon={<AlertCircle size={48} />} title="No reports yet" message="Click 'Report Missing' to file a new case" />
            ) : (
              <div className="space-y-3">
                {missingPersons.map((mp) => (
                  <div key={mp.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {mp.photo_url ? <img src={mp.photo_url} alt={mp.full_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><AlertCircle size={20} /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{mp.full_name}</p>
                      <p className="text-sm text-gray-500">{mp.age ? `${mp.age} yrs` : ''} {mp.gender ? `· ${mp.gender}` : ''}</p>
                    </div>
                    <span className={mp.status === 'active' ? 'badge-yellow' : mp.status === 'found' ? 'badge-green' : 'badge-gray'}>{mp.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Matches</h2>
            <Link to="/family/matches" className="text-sm text-blue-600 hover:underline flex items-center gap-1">View All <ArrowRight size={14} /></Link>
          </div>
          {matches.length === 0 ? (
            <EmptyState icon={<Search size={40} />} title="No matches yet" message="Matches will appear here when found persons are reported" />
          ) : (
            <div className="space-y-3">
              {matches.map((m) => (
                <div key={m.id} className="p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">Rank #{m.match_rank}</span>
                    <span className="text-sm font-bold text-blue-600">{m.confidence_score}%</span>
                  </div>
                  <p className="text-xs text-gray-500">Status: {m.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
