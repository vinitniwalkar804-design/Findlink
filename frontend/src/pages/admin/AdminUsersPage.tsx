import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Profile, UserRole } from '../../types';
import { Spinner, EmptyState } from '../../components/ui';
import { Users, Search } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getUsers();
        setUsers(data ?? []);
      } catch (err) { console.error('Error loading users:', err); }
      setLoading(false);
    })();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleColors: Record<UserRole, string> = {
    family: 'badge-blue',
    citizen: 'badge-gray',
    police: 'badge-green',
    admin: 'badge-red',
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-500">View and manage all registered users</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="family">Family</option>
          <option value="citizen">Citizen</option>
          <option value="police">Police</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="No users found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-sm font-semibold text-blue-700 shrink-0">
                          {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={roleColors[u.role]}>{u.role}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.phone || 'N/A'}</td>
                    <td className="px-4 py-3">
                      {u.role === 'police' ? (
                        <span className={u.approval_status === 'approved' ? 'badge-green' : u.approval_status === 'pending' ? 'badge-yellow' : 'badge-red'}>{u.approval_status}</span>
                      ) : (
                        <span className="badge-green">active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
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
