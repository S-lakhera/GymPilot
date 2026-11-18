import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '../api/notificationApi.js';

/**
 * Custom hook managing user notifications, badge counters, polling, and read state.
 *
 * @param {Object} options
 * @param {boolean} [options.autoFetch=true] Whether to fetch notifications and unread count on mount.
 * @param {number} [options.pollInterval=60000] Background polling interval in ms (0 to disable).
 */
export function useNotifications({ autoFetch = true, pollInterval = 60000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationApi.getUnreadCount();
      if (isMountedRef.current && data && typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      // Background counter polling error should not break the UI
    }
  }, []);

  const fetchNotifications = useCallback(
    async ({ limit = 20, offset = 0, unreadOnly = false } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const data = await notificationApi.getNotifications({ limit, offset, unreadOnly });
        if (isMountedRef.current) {
          setNotifications(data.notifications || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message || 'Failed to load notifications.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const markAsRead = useCallback(async (id) => {
    // Optimistic state update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationApi.markAsRead(id);
    } catch (err) {
      // Revert / re-fetch on failure
      fetchUnreadCount();
      fetchNotifications();
    }
  }, [fetchUnreadCount, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Optimistic state update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await notificationApi.markAllAsRead();
    } catch (err) {
      fetchUnreadCount();
      fetchNotifications();
    }
  }, [fetchUnreadCount, fetchNotifications]);

  const deleteNotification = useCallback(async (id) => {
    // Find if was unread
    const target = notifications.find((n) => n.id === id);
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));

    try {
      await notificationApi.deleteNotification(id);
    } catch (err) {
      fetchUnreadCount();
      fetchNotifications();
    }
  }, [notifications, fetchUnreadCount, fetchNotifications]);

  // Initial load
  useEffect(() => {
    if (autoFetch) {
      fetchUnreadCount();
      fetchNotifications();
    }
  }, [autoFetch, fetchUnreadCount, fetchNotifications]);

  // Periodic polling for badge counter
  useEffect(() => {
    if (!pollInterval || pollInterval <= 0) return;
    const timer = setInterval(() => {
      fetchUnreadCount();
    }, pollInterval);
    return () => clearInterval(timer);
  }, [pollInterval, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

export default useNotifications;
