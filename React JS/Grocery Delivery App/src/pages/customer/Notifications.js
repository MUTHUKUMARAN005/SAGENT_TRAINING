import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';

const typeIcons = {
  ORDER_CONFIRMATION: '🧾',
  SHIPPING_UPDATE: '🚚',
  ORDER_DELIVERED: '✅',
  ORDER_CANCELLED: '❌',
};

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();

  return (
    <div className="order-detail-page">
      <div className="order-detail-shell">
        <div className="order-head">
          <div>
            <h1>Notifications</h1>
            <p>
              Order confirmation and shipping updates. Unread: {unreadCount}
            </p>
          </div>
          <button className="order-cancel-btn" onClick={markAllAsRead}>
            <FiCheckCircle /> Mark all read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="order-empty">
            <h2>No notifications yet</h2>
            <Link to="/products">Start shopping</Link>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                className="order-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: index * 0.04 }}
                style={{
                  marginBottom: 10,
                  background: notification.read ? 'white' : '#eef2ff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.3rem' }}>{typeIcons[notification.type] || '🔔'}</span>
                    <div>
                      <p style={{ color: '#0f172a', fontWeight: 700 }}>{notification.title}</p>
                      <p style={{ color: '#475569', fontSize: '0.86rem', marginTop: 4 }}>
                        {notification.message}
                      </p>
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!notification.read && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <FiCheck />
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeNotification(notification.id)}
                      title="Remove"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className={`status-badge ${notification.read ? 'delivered' : 'pending'}`}>
                    {notification.read ? 'READ' : 'UNREAD'}
                  </span>
                  {notification.orderId && (
                    <Link
                      to={`/order/${notification.orderId}`}
                      style={{ marginLeft: 10, color: '#4f46e5', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                      View order
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Notifications;
