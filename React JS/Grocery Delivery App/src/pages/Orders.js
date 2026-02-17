import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiEye, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { AnimatedRow, AnimatedTableContainer } from '../components/AnimatedTable';
import { getOrders, updateOrderStatus, deleteOrder, getOrderItems } from '../api/api';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data);
    } catch (err) { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      toast.success(`Order updated to ${status}`);
      fetchOrders();
    } catch (err) { toast.error('Update failed'); }
  };

  const handleViewDetails = async (order) => {
    setSelectedOrder(order);
    try {
      const res = await getOrderItems(order.orderId);
      setOrderItems(res.data);
    } catch (err) { setOrderItems([]); }
    setShowDetail(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this order?')) {
      try {
        await deleteOrder(id);
        toast.success('Order deleted!');
        fetchOrders();
      } catch (err) { toast.error('Delete failed'); }
    }
  };

  const filtered = orders.filter(o =>
    o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.status?.toLowerCase().includes(search.toLowerCase())
  );

  const statusOptions = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  if (loading) return <LoadingSpinner />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>🛒 Orders</h1>
        <p>Track and manage all orders</p>
      </div>

      <motion.div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <motion.button className="btn btn-primary" onClick={fetchOrders}
          whileHover={{ scale: 1.05, rotate: 180 }} whileTap={{ scale: 0.95 }}>
          <FiRefreshCw /> Refresh
        </motion.button>
      </motion.div>

      <AnimatedTableContainer title={`All Orders (${filtered.length})`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Customer</th><th>Store</th><th>Date</th>
              <th>Amount</th><th>Discount</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((order, i) => (
                <AnimatedRow key={order.orderId} index={i}>
                  <td><strong>#{order.orderId}</strong></td>
                  <td>{order.customer?.name || 'N/A'}</td>
                  <td>{order.store?.storeName || 'N/A'}</td>
                  <td>{order.orderDate?.substring(0, 10)}</td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>₹{order.totalAmount}</td>
                  <td style={{ color: '#f59e0b' }}>₹{order.discountApplied || 0}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={e => handleStatusUpdate(order.orderId, e.target.value)}
                      className={`status-badge ${order.status?.toLowerCase()}`}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <motion.button className="btn btn-primary btn-sm" onClick={() => handleViewDetails(order)}
                        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                        <FiEye size={14} />
                      </motion.button>
                      <motion.button className="btn btn-danger btn-sm" onClick={() => handleDelete(order.orderId)}
                        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                        <FiTrash2 size={14} />
                      </motion.button>
                    </div>
                  </td>
                </AnimatedRow>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </AnimatedTableContainer>

      {/* Order Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)}>
        {selectedOrder && (
          <>
            <h2>📋 Order #{selectedOrder.orderId}</h2>
            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              <div><strong>Customer:</strong> {selectedOrder.customer?.name}</div>
              <div><strong>Store:</strong> {selectedOrder.store?.storeName}</div>
              <div><strong>Date:</strong> {selectedOrder.orderDate}</div>
              <div><strong>Total:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>₹{selectedOrder.totalAmount}</span></div>
              <div><strong>Discount:</strong> ₹{selectedOrder.discountApplied}</div>
              <div><strong>Status:</strong> <span className={`status-badge ${selectedOrder.status?.toLowerCase()}`}>{selectedOrder.status}</span></div>
            </div>
            {orderItems.length > 0 && (
              <>
                <h3 style={{ marginBottom: 12 }}>Order Items</h3>
                {orderItems.map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ padding: '12px 16px', background: '#0f172a', borderRadius: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>{item.product?.productName}</span>
                    <span>x{item.quantity} — ₹{item.unitPrice}</span>
                  </motion.div>
                ))}
              </>
            )}
          </>
        )}
      </Modal>
    </PageWrapper>
  );
};

export default Orders;