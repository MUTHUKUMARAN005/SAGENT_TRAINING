import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiStar, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { AnimatedRow } from '../components/AnimatedTable';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/api';
import toast from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    preferredPaymentMethod: '', loyaltyPoints: 0
  });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomers(res.data);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCustomer(editing.customerId, form);
        toast.success('Customer updated!');
      } else {
        await createCustomer(form);
        toast.success('Customer created!');
      }
      setShowModal(false);
      setEditing(null);
      fetchCustomers();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address,
      preferredPaymentMethod: c.preferredPaymentMethod, loyaltyPoints: c.loyaltyPoints });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this customer?')) {
      try {
        await deleteCustomer(id);
        toast.success('Customer deleted!');
        fetchCustomers();
      } catch (err) { toast.error('Delete failed'); }
    }
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>👥 Customers</h1>
        <p>Manage your customer base</p>
      </div>

      <motion.div
        style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      >
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <motion.button className="btn btn-primary"
          onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '', preferredPaymentMethod: '', loyaltyPoints: 0 }); setShowModal(true); }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        >
          <FiPlus /> Add Customer
        </motion.button>
      </motion.div>

      {/* Customer Cards */}
      <div className="cards-grid">
        <AnimatePresence>
          {filtered.map((customer, i) => (
            <motion.div
              key={customer.customerId}
              className="stat-card purple"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(99,102,241,0.2)' }}
              layout
            >
              {/* Avatar */}
              <motion.div
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', fontWeight: 700, marginBottom: 16
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {customer.name?.charAt(0)}
              </motion.div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: '#fff' }}>
                {customer.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiMail size={14} /> {customer.email}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiPhone size={14} /> {customer.phone}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiMapPin size={14} /> {customer.address?.substring(0, 40)}...
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="status-badge active">
                  <FiStar size={12} /> {customer.loyaltyPoints} pts
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {customer.preferredPaymentMethod}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button className="btn btn-primary btn-sm" onClick={() => handleEdit(customer)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <FiEdit2 size={14} /> Edit
                </motion.button>
                <motion.button className="btn btn-danger btn-sm" onClick={() => handleDelete(customer.customerId)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <FiTrash2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2>{editing ? '✏️ Edit Customer' : '➕ New Customer'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select value={form.preferredPaymentMethod} onChange={e => setForm({...form, preferredPaymentMethod: e.target.value})}>
              <option value="">Select...</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
            </select>
          </div>
          <div className="form-group">
            <label>Loyalty Points</label>
            <input type="number" value={form.loyaltyPoints} onChange={e => setForm({...form, loyaltyPoints: parseInt(e.target.value)})} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-danger" onClick={() => setShowModal(false)}>Cancel</button>
            <motion.button type="submit" className="btn btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {editing ? 'Update' : 'Create'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default Customers;