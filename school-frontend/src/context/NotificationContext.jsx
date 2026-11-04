/* eslint-disable react-refresh/only-export-components -- context module exports its hook alongside the provider */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const POLL_INTERVAL_MS = 30_000;

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Non-critical: keep showing the last known list.
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch on sign-in, then poll while the tab is visible.
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchNotifications();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead: async (id) => {
        await notificationService.markAsRead(id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      },
      markAllAsRead: async () => {
        await notificationService.markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      },
      deleteNotification: async (id) => {
        const target = notifications.find((n) => n.id === id);
        await notificationService.deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (target && !target.read) setUnreadCount((prev) => Math.max(0, prev - 1));
      },
    }),
    [notifications, unreadCount, loading, fetchNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
