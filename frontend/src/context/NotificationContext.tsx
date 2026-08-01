import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api } from '../lib/api';
import { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      refresh();
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      refresh();
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

