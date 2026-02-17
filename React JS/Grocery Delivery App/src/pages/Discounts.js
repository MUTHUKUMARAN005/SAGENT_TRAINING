import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiPercent, FiTrash2, FiCalendar } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDiscounts, createDiscount, deleteDiscount } from '../api/api';
import toast from 'react-hot-toast';

const Discounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    minCartValue: '', discountAmount: '', validFrom: '', validTo: '', isActive: true
  });

  useEffect(() => { fetchDiscounts(); }, []);

  const fetchDiscounts = async () => {
    try { const res = await getDiscounts(); setDiscounts(res.data); }
    catch (err) { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createDiscount(form);
      toast.success('Discount rule created!');
      setShowModal(false);
      fetchDiscounts();
    } catch (err) { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this rule?')) {
      try { await deleteDiscount(id); toast.success('Deleted!'); fetchDiscounts(); }
      catch (err) { toast.error('Failed'); }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>🏷️ Discount Rules</h1>
        <p>Configure pricing and discount strategies</p>
      </div>

      <motion.div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.button className="btn btn-primary" onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <FiPlus /> Add Rule
        </motion.button>
      </motion.div>

      <div className="cards-grid">
        <AnimatePresence>
          {discounts.map((rule, i) => (
            <motion.div key={rule.ruleId}
              className={`stat-card ${rule.isActive ? 'green' : 'pink'}`}
              initial={{ opacity: 0, scale: 0.85, rotateZ: -2 }}
              animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              whileHover={{ y: -6, rotateZ: 1 }}
              layout
            >
              <motion.div
                style={{ fontSize: '2.5rem', marginBottom: 12 }}
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 3, delay: i * 0.3 }}
              >
                <FiPercent />
              </motion.div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Min Cart Value</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>₹{rule.minCartValue}</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Discount</p>
                <motion.p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  ₹{rule.discountAmount} OFF
                </motion.p>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiCalendar size={12} /> {rule.validFrom?.substring(0, 10)}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>→</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {rule.validTo?.substring(0, 10)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`status-badge ${rule.isActive ? 'delivered' : 'cancelled'}`}>
                  {rule.isActive ? '🟢 Active' : '🔴 Inactive'}
                </span>
                <motion.button className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(rule.ruleId)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <FiTrash2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2>➕ New Discount Rule</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Min Cart Value (₹)</label>
            <input type="number" step="0.01" value={form.minCartValue}
              onChange={e => setForm({...form, minCartValue: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Discount Amount (₹)</label>
            <input type="number" step="0.01" value={form.discountAmount}
              onChange={e => setForm({...form, discountAmount: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Valid From</label>
            <input type="datetime-local" value={form.validFrom}
              onChange={e => setForm({...form, validFrom: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Valid To</label>
            <input type="datetime-local" value={form.validTo}
              onChange={e => setForm({...form, validTo: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm({...form, isActive: e.target.checked})} />
              {' '} Active
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
            <motion.button type="submit" className="btn btn-primary" whileHover={{ scale: 1.05 }}>Create</motion.button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Discounts;