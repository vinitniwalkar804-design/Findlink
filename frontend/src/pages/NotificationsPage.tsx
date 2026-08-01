import { useNotifications } from '../context/NotificationContext';
import { Spinner, EmptyState } from '../components/ui';
import { Bell, CheckCheck, Link2, Shield, AlertCircle } from 'lucide-react';
import { NotificationType } from '../types';

const typeIcons: Record<NotificationType, typeof Bell> = {
  match: Link2,
  status_update: AlertCircle,
  approval: Shield,
  system: Bell,
};

const typeColors: Record<NotificationType, string> = {
  match: 'bg-blue-100 text-blue-600',
  status_update: 'bg-amber-100 text-amber-600',
  approval: 'bg-green-100 text-green-600',
  system: 'bg-gray-100 text-gray-600',
};

export default function NotificationsPage() {
  const { notifications, loading, markRead, markAllRead, unreadCount } = useNotifications();

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-500">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell size={48} />} title="No notifications" message="You'll be notified about matches, status updates, and approvals here" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type];
            return (
              <div
                key={n.id}
                className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors ${!n.read ? 'border-blue-200 bg-blue-50/30' : ''}`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${typeColors[n.type]} shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
