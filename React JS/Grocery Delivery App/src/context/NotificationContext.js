import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createNotification,
  deleteNotification,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const getNotificationsKey = (email) => `freshmart_notifications_${email || 'guest'}`;

const readStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const storageKey = getNotificationsKey(user?.email);
  const userId = user?.userId ?? user?.id ?? null;

  useEffect(() => {
    let mounted = true;
    const local = readStorage(storageKey);
    setNotifications(local);

    const hydrateFromBackend = async () => {
      if (!userId) return;
      try {
        const response = await getUserNotifications(userId);
        const list = Array.isArray(response?.data) ? response.data : [];
        const backend = list.map((item) => ({
          id: item?.notificationId ?? item?.id,
          backendId: item?.notificationId ?? item?.id,
          title: item?.type ? item.type.replace(/_/g, ' ') : 'Notification',
          message: item?.message || '',
          type: item?.type || 'GENERAL',
          orderId: item?.order?.orderId ?? item?.orderId ?? null,
          createdAt: item?.sentAt ?? item?.createdAt ?? new Date().toISOString(),
          read: String(item?.status || '').toUpperCase() === 'READ',
        }));

        const mergedMap = new Map(
          [...local, ...backend].map((entry) => [
            String(entry.backendId ?? `${entry.createdAt}_${entry.message}`),
            entry,
          ])
        );
        if (mounted) setNotifications(Array.from(mergedMap.values()));
      } catch {
        // Keep local notifications when backend fetch fails.
      }
    };

    hydrateFromBackend();

    return () => {
      mounted = false;
    };
  }, [storageKey, userId]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [notifications, storageKey]);

  const pushNotification = ({ title, message, type = 'GENERAL', orderId = null }) => {
    const notification = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      title,
      message,
      type,
      orderId,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [notification, ...prev]);

    if (userId) {
      const payload = {
        user: { userId },
        message,
        type,
        status: 'UNREAD',
        sentAt: notification.createdAt,
      };
      if (orderId) payload.order = { orderId };

      void createNotification({
        ...payload,
      })
        .then((response) => {
          const backendId = response?.data?.notificationId ?? response?.data?.id;
          if (!backendId) return;
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === notification.id ? { ...item, backendId } : item
            )
          );
        })
        .catch(() => {
          // Local notification remains source of truth if backend write fails.
        });
    }

    return notification;
  };

  const markAsRead = (id) => {
    const target = notifications.find((item) => String(item.id) === String(id));
    setNotifications((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? { ...item, read: true } : item))
    );
    if (target?.backendId) {
      void markNotificationRead(target.backendId).catch(() => {
        // Keep local read state even when backend call fails.
      });
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    if (userId) {
      void markAllNotificationsRead(userId).catch(() => {
        // Keep local read state even when backend call fails.
      });
    }
  };

  const removeNotification = (id) => {
    const target = notifications.find((item) => String(item.id) === String(id));
    setNotifications((prev) => prev.filter((item) => String(item.id) !== String(id)));
    if (target?.backendId) {
      void deleteNotification(target.backendId).catch(() => {
        // Local delete remains source of truth if backend delete fails.
      });
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        pushNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export default NotificationContext;
