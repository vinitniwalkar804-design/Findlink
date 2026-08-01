import { useEffect, useState } from 'react';
import { getToken } from '../../lib/api';
import { Spinner, EmptyState } from '../../components/ui';
import { UserCheck, CheckCircle2, XCircle, Shield } from 'lucide-react';

const API_BASE = '/api';

interface PendingPolice {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  approval_status: string;
  badge_number: string;
  department: string;
  avatar_url: string;
  created_at: string;
}

export default function AdminApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingPolice[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const res = await fetch(API_BASE + '/admin/pending-police', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
      if (!res.ok) throw new Error('Failed to load pending police');
      const data = await res.json();
      setPending(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending police');
    } finally { setLoading(false); }
  };

  const approve = async (id: string) => {
    setProcessing(id); setError(null);
    try {
      const token = getToken();
      const res = await fetch(API_BASE + '/admin/approve-police', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({ police_id: id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Approval failed');
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err: any) { setError(err.message); }
    setProcessing(null);
  };

  const reject = async (id: string) => {
    setProcessing(id); setError(null);
    try {
      const token = getToken();
      const res = await fetch(API_BASE + '/admin/reject-police', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({ police_id: id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Rejection failed');
      setPending(prev => prev.filter(p => p.id !== id));
    } catch (err: any) { setError(err.message); }
    setProcessing(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Police Approvals</h1>
        <p className="mt-2 text-gray-500">Review and approve police officer registrations</p>
      </div>
      {error && <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4"><p className="text-sm text-red-700">{error}</p></div>}
      {pending.length === 0 ? (
        <EmptyState icon={<UserCheck size={48} />} title="No pending approvals" message="All police registrations have been processed" />
      ) : (
        <div className="space-y-4">
          {pending.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 shrink-0"><Shield size={24} /></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{p.full_name}</h3>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-sm text-gray-500">Badge: {p.badge_number || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Department: {p.department || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Phone: {p.phone || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Registered: {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => approve(p.id)} disabled={processing === p.id} className="btn-primary">
                    {processing === p.id ? <Spinner size={16} /> : <><CheckCircle2 size={16} /> Approve</>}
                  </button>
                  <button onClick={() => reject(p.id)} disabled={processing === p.id} className="btn-danger">
                    <XCircle size={16} /> Reject
                  </button>
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
