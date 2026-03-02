import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiRefreshCw, FiPackage } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { AnimatedRow, AnimatedTableContainer } from '../components/AnimatedTable';
import { getInventory, updateInventory } from '../api/api';
import toast from 'react-hot-toast';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try { const res = await getInventory(); setInventory(res.data); }
    catch (err) { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  };

  const handleUpdateStock = async (item, newQty) => {
    try {
      await updateInventory(item.inventoryId, { ...item, stockQuantity: parseInt(newQty) });
      toast.success('Stock updated!');
      fetchInventory();
    } catch (err) { toast.error('Update failed'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>📦 Inventory</h1>
        <p>Monitor stock levels across all products</p>
      </div>

      {/* Low stock alerts */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', marginBottom: 30 }}>
        {inventory.filter(i => i.stockQuantity <= i.reorderLevel).map((item, idx) => (
          <motion.div
            key={item.inventoryId}
            className="stat-card orange"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <FiAlertTriangle size={24} color="#ef4444" />
            </motion.div>
            <h3 style={{ color: '#f87171', marginTop: 8 }}>Low Stock Alert</h3>
            <p style={{ fontWeight: 700, marginTop: 4 }}>{item.product?.productName}</p>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Only <strong style={{ color: '#ef4444' }}>{item.stockQuantity}</strong> left
              (Reorder: {item.reorderLevel})
            </p>
          </motion.div>
        ))}
      </div>

      <AnimatedTableContainer
        title={`Stock Levels (${inventory.length} items)`}
        action={
          <motion.button className="btn btn-primary btn-sm" onClick={fetchInventory}
            whileHover={{ scale: 1.05, rotate: 180 }}>
            <FiRefreshCw size={14} /> Refresh
          </motion.button>
        }
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th><th>Category</th><th>Stock</th>
              <th>Reorder Level</th><th>Status</th><th>Last Updated</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {inventory.map((item, i) => {
                const isLow = item.stockQuantity <= item.reorderLevel;
                return (
                  <AnimatedRow key={item.inventoryId} index={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FiPackage size={18} color="#6366f1" />
                        <strong>{item.product?.productName}</strong>
                      </div>
                    </td>
                    <td>{item.product?.category}</td>
                    <td>
                      <motion.span
                        style={{ fontWeight: 700, fontSize: '1.1rem', color: isLow ? '#ef4444' : '#10b981' }}
                        animate={isLow ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        {item.stockQuantity}
                      </motion.span>
                    </td>
                    <td>{item.reorderLevel}</td>
                    <td>
                      <span className={`status-badge ${isLow ? 'cancelled' : 'delivered'}`}>
                        {isLow ? '⚠️ LOW' : '✅ OK'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{item.lastUpdated?.substring(0, 16)}</td>
                    <td>
                      <motion.button className="btn btn-success btn-sm"
                        onClick={() => {
                          const qty = prompt('Enter new stock quantity:', item.stockQuantity);
                          if (qty) handleUpdateStock(item, qty);
                        }}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        Update
                      </motion.button>
                    </td>
                  </AnimatedRow>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </AnimatedTableContainer>
    </PageWrapper>
  );
};

export default Inventory;