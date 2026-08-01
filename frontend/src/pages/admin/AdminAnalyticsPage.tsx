import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui';
import { Users, AlertCircle, Link2 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    byRole: { family: 0, citizen: 0, police: 0, admin: 0 },
    missingByStatus: { active: 0, found: 0, closed: 0 },
    foundByStatus: { unidentified: 0, identified: 0, reunited: 0 },
    totalMatches: 0,
    confirmedMatches: 0,
    avgConfidence: 0,
    missingTrend: [] as { date: string; count: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics({
          byRole: data.byRole || { family: 0, citizen: 0, police: 0, admin: 0 },
          missingByStatus: data.missingByStatus || { active: 0, found: 0, closed: 0 },
          foundByStatus: data.foundByStatus || { unidentified: 0, identified: 0, reunited: 0 },
          totalMatches: data.totalMatches || 0,
          confirmedMatches: data.confirmedMatches || 0,
          avgConfidence: data.avgConfidence || 0,
          missingTrend: data.missingTrend || [],
        });
      } catch (err) {
        console.error('Error loading analytics:', err);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-500">System-wide statistics and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Users by Role</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(analytics.byRole).map(([role, count]) => {
              const total = Object.values(analytics.byRole).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={role}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 capitalize">{role}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Missing Persons by Status */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Missing Persons by Status</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(analytics.missingByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">{status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Found Persons by Status */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Found Persons by Status</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(analytics.foundByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 capitalize mt-1">{status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Match Performance */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 size={20} className="text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">Match Performance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Matches Generated</span>
              <span className="text-xl font-bold text-gray-900">{analytics.totalMatches}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confirmed Matches</span>
              <span className="text-xl font-bold text-green-600">{analytics.confirmedMatches}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Confidence</span>
              <span className="text-xl font-bold text-blue-600">{analytics.avgConfidence}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Confirmation Rate</span>
              <span className="text-xl font-bold text-gray-900">
                {analytics.totalMatches > 0 ? Math.round((analytics.confirmedMatches / analytics.totalMatches) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  

);
}