import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMapPin, FiPhone, FiUser, FiTrash2 } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getStores, createStore, deleteStore } from '../api/api';
import toast from 'react-hot-toast';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ storeName: '', storeAddress: '', contactNumber: '' });

  useEffect(() => { fetchStores(); }, []);

  const fetchStores = async () => {
    try { const res = await getStores(); setStores(res.data); }
    catch (err) { toast.error('Failed to load stores'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createStore(form);
      toast.success('Store created!');
      setShowModal(false);
      fetchStores();
    } catch (err) { toast.error('Failed to create store'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this store?')) {
      try { await deleteStore(id); toast.success('Store deleted!'); fetchStores(); }
      catch (err) { toast.error('Delete failed'); }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>📍 Stores</h1>
        <p>Manage your store locations</p>
      </div>

      <motion.div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.button className="btn btn-primary"
          onClick={() => setShowModal(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <FiPlus /> Add Store
        </motion.button>
      </motion.div>

      <div className="cards-grid">
        <AnimatePresence>
          {stores.map((store, i) => (
            <motion.div
              key={store.storeId}
              className="stat-card orange"
              initial={{ opacity: 0, rotateY: -15, y: 30 }}
              animate={{ opacity: 1, rotateY: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(245,158,11,0.2)' }}
              layout
            >
              <motion.div
                style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
                whileHover={{ rotate: 15 }}
              >
                <FiMapPin size={24} color="#f59e0b" />
              </motion.div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>{store.storeName}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiMapPin size={14} /> {store.storeAddress}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiPhone size={14} /> {store.contactNumber}
                </span>
                {store.storeManager && (
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiUser size={14} /> Manager: {store.storeManager.name}
                  </span>
                )}
              </div>

              <motion.button className="btn btn-danger btn-sm" onClick={() => handleDelete(store.storeId)}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <FiTrash2 size={14} /> Delete
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2>➕ New Store</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Store Name</label>
            <input value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea value={form.storeAddress} onChange={e => setForm({...form, storeAddress: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Contact Number</label>
            <input value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} />
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

export default Stores;