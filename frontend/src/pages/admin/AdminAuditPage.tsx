import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner, EmptyState } from '../../components/ui';
import { ScrollText } from 'lucide-react';

interface AuditLogItem {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
  actor: { id: string; full_name: string } | null;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAuditLogs();
        setLogs(data ?? []);
      } catch (err) {
        console.error('Error loading audit logs:', err);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-2 text-gray-500">Track all administrative actions</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={<ScrollText size={48} />} title="No audit logs" message="Administrative actions will be logged here" />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-600 shrink-0">
                    <ScrollText size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-500">
                      {log.actor?.full_name || 'System'} · {log.target_type} · {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {log.target_id && (
                  <span className="text-xs text-gray-400 font-mono">{log.target_id.toString().slice(0, 8)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
