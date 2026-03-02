import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiShield, FiMail, FiPhone } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getUsers, createUser, deleteUser } from '../api/api';
import toast from 'react-hot-toast';

const userTypeColors = { ADMIN: '#ef4444', MANAGER: '#6366f1', STAFF: '#10b981' };

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', userType: 'STAFF' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { const res = await getUsers(); setUsers(res.data); }
    catch (err) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(form);
      toast.success('User created!');
      setShowModal(false);
      fetchUsers();
    } catch (err) { toast.error('Create failed'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user?')) {
      try { await deleteUser(id); toast.success('User deleted!'); fetchUsers(); }
      catch (err) { toast.error('Delete failed'); }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>👤 Users</h1>
        <p>Manage staff and admin accounts</p>
      </div>

      <motion.div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.button className="btn btn-primary" onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <FiPlus /> Add User
        </motion.button>
      </motion.div>

      <div className="cards-grid">
        <AnimatePresence>
          {users.map((user, i) => (
            <motion.div key={user.userId}
              className="stat-card purple"
              initial={{ opacity: 0, rotateX: -10, y: 30 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.08, type: 'spring' }}
              whileHover={{ y: -6 }}
              layout
            >
              <motion.div
                style={{ width: 56, height: 56, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${userTypeColors[user.userType]}, ${userTypeColors[user.userType]}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', fontWeight: 700, marginBottom: 14 }}
                whileHover={{ scale: 1.15 }}
              >
                {user.name?.charAt(0)}
              </motion.div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>{user.name}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiMail size={14} /> {user.email}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiPhone size={14} /> {user.phone}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="status-badge" style={{
                  background: `${userTypeColors[user.userType]}20`,
                  color: userTypeColors[user.userType]
                }}>
                  <FiShield size={12} /> {user.userType}
                </span>
                <motion.button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.userId)}
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <FiTrash2 size={14} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2>➕ New User</h2>
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
            <label>Role</label>
            <select value={form.userType} onChange={e => setForm({...form, userType: e.target.value})}>
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
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

export default Users;