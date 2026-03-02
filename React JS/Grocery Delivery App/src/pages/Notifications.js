import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { getNotifications, markNotificationRead } from '../api/api';
import toast from 'react-hot-toast';

const typeIcons = {
  ORDER_PLACED: '🛒', ORDER_SHIPPED: '📦', ORDER_DELIVERED: '✅',
  PAYMENT_RECEIVED: '💰', CANCELLATION: '❌', PROMOTION: '🎉'
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try { const res = await getNotifications(); setNotifications(res.data); }
    catch (err) { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      toast.success('Marked as read');
      fetchNotifications();
    } catch (err) { toast.error('Failed'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>🔔 Notifications</h1>
        <p>Stay updated with system alerts</p>
      </div>

      <div style={{ maxWidth: 800 }}>
        <AnimatePresence>
          {notifications.map((notif, i) => (
            <motion.div key={notif.notificationId}
              initial={{ opacity: 0, x: -30, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 30, height: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
              whileHover={{ x: 4 }}
              style={{
                background: notif.status === 'READ' ? 'var(--dark-2)' : 'rgba(99,102,241,0.08)',
                border: `1px solid ${notif.status === 'READ' ? 'var(--dark-3)' : 'rgba(99,102,241,0.3)'}`,
                borderRadius: 16, padding: '20px 24px', marginBottom: 12,
                display: 'flex', alignItems: 'flex-start', gap: 16,
                transition: 'all 0.3s ease'
              }}
              layout
            >
              <motion.div
                style={{ fontSize: '2rem', flexShrink: 0 }}
                animate={notif.status !== 'READ' ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {typeIcons[notif.type] || '📢'}
              </motion.div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span className={`status-badge ${notif.type?.toLowerCase()?.includes('cancel') ? 'cancelled' : 'active'}`}>
                    {notif.type?.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {notif.sentAt?.substring(0, 16)}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: '#cbd5e1', marginBottom: 8 }}>
                  {notif.message}
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    To: {notif.user?.name} | Order #{notif.order?.orderId}
                  </span>
                  {notif.status !== 'READ' && (
                    <motion.button className="btn btn-success btn-sm"
                      onClick={() => handleMarkRead(notif.notificationId)}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <FiCheck size={12} /> Mark Read
                    </motion.button>
                  )}
                </div>
              </div>

              <span className={`status-badge ${notif.status?.toLowerCase() === 'read' ? 'delivered' : 'pending'}`}>
                {notif.status}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default Notifications;