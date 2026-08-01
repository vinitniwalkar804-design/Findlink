import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, AlertCircle, CheckCircle2, BarChart3, FileText, UserCheck, ScrollText } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { api } from '../../lib/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, pendingPolice: 0, activeMissing: 0, foundPersons: 0, reunited: 0, pendingMatches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getStats();
        setStats({
          totalUsers: data.totalUsers || 0,
          pendingPolice: data.pendingPolice || 0,
          activeMissing: data.activeMissing || 0,
          foundPersons: data.foundPersons || 0,
          reunited: data.reunited || 0,
          pendingMatches: data.pendingMatches || 0,
        });
      } catch (err) {
        console.error('Error loading admin stats:', err);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-500">System overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: 'Total Users', value: stats.totalUsers, color: 'bg-blue-100 text-blue-600', link: '/admin/users' },
          { icon: UserCheck, label: 'Pending Police Approvals', value: stats.pendingPolice, color: 'bg-amber-100 text-amber-600', link: '/admin/approvals' },
          { icon: AlertCircle, label: 'Active Missing', value: stats.activeMissing, color: 'bg-red-100 text-red-600' },
          { icon: Users, label: 'Unidentified Found', value: stats.foundPersons, color: 'bg-purple-100 text-purple-600' },
          { icon: CheckCircle2, label: 'Reunited', value: stats.reunited, color: 'bg-green-100 text-green-600' },
          { icon: BarChart3, label: 'Pending Matches', value: stats.pendingMatches, color: 'bg-teal-100 text-teal-600', link: '/admin/analytics' },
        ].map((s) => (
          <div key={s.label} className={`card p-5 ${s.link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`} {...(s.link ? { onClick: () => navigate(s.link!) } : {})}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${s.color} mb-3`}><s.icon size={20} /></div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/approvals" className="card p-5 hover:shadow-md transition-shadow">
          <UserCheck size={24} className="text-amber-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Approvals</h3>
          <p className="text-sm text-gray-500">Review police registrations</p>
        </Link>
        <Link to="/admin/users" className="card p-5 hover:shadow-md transition-shadow">
          <Users size={24} className="text-blue-600 mb-2" />
          <h3 className="font-semibold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-500">View and manage all users</p>
        </Link>
        <Link to="/admin/analytics" className="card p-5 hover:shadow-md transition-shadow">
          <BarChart3 size={24} className="text-teal-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Analytics</h3>
          <p className="text-sm text-gray-500">System statistics and trends</p>
        </Link>
        <Link to="/admin/reports" className="card p-5 hover:shadow-md transition-shadow">
          <FileText size={24} className="text-green-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Reports</h3>
          <p className="text-sm text-gray-500">View all system reports</p>
        </Link>
        <Link to="/admin/audit" className="card p-5 hover:shadow-md transition-shadow">
          <ScrollText size={24} className="text-purple-600 mb-2" />
          <h3 className="font-semibold text-gray-900">Audit Logs</h3>
          <p className="text-sm text-gray-500">Track admin actions</p>
        </Link>
      </div>
    </div>
  );
}
