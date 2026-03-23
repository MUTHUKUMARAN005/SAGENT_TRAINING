import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiSettings,
} from 'react-icons/fi';
import { pageTransition, fadeInUp, staggerContainer } from '../animations/variants';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const typeStyles = {
  donation: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  pickup: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  task: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  campaign: 'bg-green-500/10 text-green-300 border-green-500/20',
  system: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await api.getNotifications();
      if (!result.success) {
        toast.error(result.error || 'Failed to load notifications');
        setNotifications([]);
        return;
      }
      setNotifications(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      toast.error(error?.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const markAsRead = async (id) => {
    try {
      const result = await api.markNotificationRead(id);
      if (!result.success) {
        toast.error(result.error || 'Unable to mark notification as read');
        return;
      }
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    } catch (error) {
      toast.error(error?.message || 'Unable to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const result = await api.markAllNotificationsRead();
      if (!result.success) {
        toast.error(result.error || 'Unable to mark all notifications as read');
        return;
      }
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error?.message || 'Unable to mark all notifications as read');
    }
  };

  const formatWhen = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value || '-';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div {...pageTransition} className="pt-24 pb-16">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-glow-gradient opacity-20" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div
            variants={fadeInUp}
            className="flex items-start justify-between flex-wrap gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">
                Notifications <span className="gradient-text">Center</span>
              </h1>
              <p className="text-slate-400 mt-2">
                Stay updated on receipts, campaigns, security, and platform activity.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm">
              <FiBell className="w-4 h-4" />
              {unreadCount} unread
            </div>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="dashboard-card flex flex-wrap items-center justify-between gap-3"
          >
            <div className="text-sm text-slate-400">
              Signed in as <span className="text-white font-medium">{user?.name || 'User'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-2"
                type="button"
              >
                <FiCheck className="w-4 h-4" />
                Mark All Read
              </button>
              <Link
                to="/settings"
                className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-2"
              >
                <FiSettings className="w-4 h-4" />
                Notification Settings
              </Link>
            </div>
          </motion.div>

          {loading ? (
            <motion.div variants={fadeInUp} className="dashboard-card text-center py-14">
              <p className="text-slate-400">Loading notifications...</p>
            </motion.div>
          ) : notifications.length === 0 ? (
            <motion.div variants={fadeInUp} className="dashboard-card text-center py-14">
              <FiCheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-white mb-2">No notifications yet</h2>
              <p className="text-slate-400">You will see donation, pickup, and campaign updates here.</p>
            </motion.div>
          ) : (
            <motion.div variants={staggerContainer} className="space-y-3">
              {notifications.map((item) => (
                <motion.div
                  key={item.id}
                  variants={fadeInUp}
                  className={`dashboard-card border ${
                    item.isRead ? 'border-white/10' : 'border-primary-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs border capitalize ${
                            typeStyles[item.type] || typeStyles.system
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <FiClock className="w-3 h-3" />
                          {formatWhen(item.createdAt)}
                        </span>
                        {!item.isRead && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary-500/20 text-primary-300">
                            New
                          </span>
                        )}
                      </div>

                      <h3 className="text-white font-semibold">{item.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">{item.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={() => markAsRead(item.id)}
                          className="btn-secondary px-3 py-2 text-xs"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotificationsPage;
