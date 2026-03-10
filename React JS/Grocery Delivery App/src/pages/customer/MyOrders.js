import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { useOrders } from '../../context/OrderContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import './MyOrders.css';

const MyOrders = () => {
  const { orders, cancelOrder } = useOrders();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'active', label: 'Active', statuses: ['ORDERED', 'PACKED', 'SHIPPED', 'PENDING', 'CONFIRMED', 'PROCESSING'] },
    { id: 'delivered', label: 'Delivered', statuses: ['DELIVERED'] },
    { id: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
  ];

  const filtered = activeTab === 'all' ? orders :
    orders.filter(o => tabs.find(t => t.id === activeTab)?.statuses?.includes(o.status));

  const getStatusIcon = (status) => {
    const icons = {
      ORDERED: '🧾',
      PACKED: '📦',
      SHIPPED: '🚚',
      DELIVERED: '✅',
      CANCELLED: '❌',
      PENDING: '⏳',
      CONFIRMED: '✅',
      PROCESSING: '🔧',
    };
    return icons[status] || '📋';
  };

  return (
    <div className="my-orders-page">
      <div className="my-orders-container">
        <motion.h1
          className="my-orders-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          My Orders
        </motion.h1>

        {/* Tabs */}
        <motion.div className="orders-tabs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              className={`order-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
              {tab.id !== 'all' && (
                <span className="tab-count">
                  {tab.statuses ? orders.filter(o => tab.statuses.includes(o.status)).length : orders.length}
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Orders List */}
        {filtered.length === 0 ? (
          <EmptyState icon="📦" title="No orders found" message="Start shopping to see your orders here!" />
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((order, i) => (
              <motion.div
                key={order.orderId}
                className="order-card-customer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                layout
              >
                <div className="occ-header">
                  <div className="occ-header-left">
                    <span className="occ-order-id">Order #{order.orderId}</span>
                    <span className="occ-date">{formatDate(order.orderDate)}</span>
                  </div>
                  <StatusBadge status={order.status} icon={getStatusIcon(order.status)} />
                </div>

                <div className="occ-body">
                  <div className="occ-store">📍 {order.shippingAddress?.city || 'FreshMart'}</div>
                  <div className="occ-amount-row">
                    <div>
                      <span className="occ-amount-label">Total</span>
                      <span className="occ-amount">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    {order.discountApplied > 0 && (
                      <div>
                        <span className="occ-amount-label">Saved</span>
                        <span className="occ-discount">{formatCurrency(order.discountApplied)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="occ-footer">
                  {['ORDERED', 'PACKED', 'PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) && (
                    <motion.button
                      className="occ-cancel-btn"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        const cancelled = cancelOrder(order.orderId);
                        if (cancelled) toast.success('Order cancelled');
                      }}
                    >
                      <FiXCircle size={16} /> Cancel
                    </motion.button>
                  )}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link to={`/order/${order.orderId}`} className="occ-track-btn">
                      <FiEye size={16} /> Track Order
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
