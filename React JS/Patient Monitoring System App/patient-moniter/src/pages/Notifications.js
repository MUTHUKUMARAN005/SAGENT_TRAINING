import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import {
  FiBell, FiCalendar, FiFileText, FiMessageSquare,
  FiCheckCircle, FiAlertTriangle, FiActivity, FiThermometer, FiWind
} from 'react-icons/fi';
import { markLocalAlertAsRead, readLocalAlerts } from '../utils/vitals';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [user?.userId]);

  const fetchNotifications = async () => {
    if (!user?.userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const localAlerts = readLocalAlerts(user?.userId).map((item) => ({
      ...item,
      source: item.source || 'LIVE_MONITOR',
      isLocal: true,
    }));

    try {
      const res = await API.get(`/notifications/user/${user.userId}`);
      const apiNotifications = (Array.isArray(res.data) ? res.data : []).map((item) => ({
        ...item,
        isLocal: false,
      }));
      const combined = [...apiNotifications, ...localAlerts].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      setNotifications(combined);
    } catch (err) {
      console.error(err);
      setNotifications(localAlerts);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notification) => {
    if (notification?.isLocal) {
      const success = markLocalAlertAsRead(user.userId, notification.notificationId);
      if (success) {
        fetchNotifications();
        toast.success('Alert marked as read');
      } else {
        toast.error('Failed to update');
      }
      return;
    }

    try {
      await API.put(`/notifications/${notification.notificationId}/read`);
      fetchNotifications();
      toast.success('Marked as read');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const getIcon = (type) => {
    if (type?.includes('APPOINTMENT')) return <FiCalendar />;
    if (type?.includes('LAB') || type?.includes('PRESCRIPTION'))
      return <FiFileText />;
    if (type?.includes('MESSAGE')) return <FiMessageSquare />;
    if (type?.includes('CRITICAL')) return <FiAlertTriangle />;
    if (type?.includes('HEART')) return <FiActivity />;
    if (type?.includes('OXYGEN')) return <FiWind />;
    if (type?.includes('FEVER') || type?.includes('TEMP')) return <FiThermometer />;
    if (type?.includes('EMERGENCY')) return <FiAlertTriangle />;
    return <FiBell />;
  };

  const getIconColor = (type) => {
    if (type?.includes('APPOINTMENT'))
      return { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' };
    if (type?.includes('LAB'))
      return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' };
    if (type?.includes('PRESCRIPTION'))
      return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
    if (type?.includes('MESSAGE'))
      return { bg: 'rgba(6,182,212,0.15)', color: '#06b6d4' };
    if (type?.includes('CRITICAL'))
      return { bg: 'rgba(239,68,68,0.2)', color: '#f87171' };
    if (type?.includes('HEART'))
      return { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' };
    if (type?.includes('OXYGEN'))
      return { bg: 'rgba(14,165,233,0.15)', color: '#0ea5e9' };
    if (type?.includes('FEVER') || type?.includes('TEMP'))
      return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
    if (type?.includes('EMERGENCY'))
      return { bg: 'rgba(239,68,68,0.2)', color: '#f87171' };
    return { bg: 'rgba(100,116,139,0.15)', color: '#64748b' };
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Notifications</h1>
        <p>Stay updated with your healthcare alerts</p>
      </motion.div>

      <motion.div
        className="data-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="data-card-header">
          <h3>
            <FiBell style={{ marginRight: 8 }} />
            All Notifications ({notifications.length})
          </h3>
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notif, index) => {
              const iconStyle = getIconColor(notif.type);
              return (
                <motion.div
                  key={notif.notificationId}
                  className={`notification-item ${
                    !notif.isRead ? 'unread' : ''
                  }`}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, type: 'spring' }}
                  whileHover={{ x: 4 }}
                >
                  <motion.div
                    className="notification-icon"
                    style={{
                      background: iconStyle.bg,
                      color: iconStyle.color,
                    }}
                    whileHover={{ rotate: 15 }}
                  >
                    {getIcon(notif.type)}
                  </motion.div>
                  <div className="notification-content">
                    <h4>{notif.type?.replace(/_/g, ' ')}</h4>
                    <p>{notif.message}</p>
                    <span className="notification-time">
                      {new Date(notif.createdAt).toLocaleString()}
                      {notif.isLocal ? ' | Live monitor' : ''}
                    </span>
                  </div>
                  {!notif.isRead && (
                    <motion.button
                      className="btn btn-sm btn-secondary"
                      onClick={() => markAsRead(notif)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      style={{ flexShrink: 0 }}
                    >
                      <FiCheckCircle />
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};

export default Notifications;
