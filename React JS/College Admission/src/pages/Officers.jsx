import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiMail } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Officers = () => {
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', departmentId: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [oRes, dRes] = await Promise.all([API.get('/officers'), API.get('/departments')]);
      setOfficers(oRes.data);
      setDepartments(dRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        department: { departmentID: parseInt(formData.departmentId) },
      };
      if (editing) {
        await API.put(`/officers/${editing.officerID}`, payload);
        toast.success('Updated! ✅');
      } else {
        await API.post('/officers', payload);
        toast.success('Created! 👮');
      }
      fetchData();
      setModalOpen(false);
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) {
      try { await API.delete(`/officers/${id}`); toast.success('Deleted!'); fetchData(); }
      catch { toast.error('Failed'); }
    }
  };

  const columns = [
    { key: 'officerID', label: 'ID' },
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient-5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem',
          }} whileHover={{ scale: 1.1 }}>
            {row.name?.charAt(0)}
          </motion.div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiMail size={14} color="var(--primary)" /> {row.email}
        </div>
      ),
    },
    { key: 'department', label: 'Department', render: (row) => row.department?.departmentName || 'N/A' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <PageTransition>
      <div className="page-header">
        <motion.div className="page-header-left"
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <h1>Admission Officers</h1>
          <p>Manage admission officer profiles</p>
        </motion.div>
        <motion.button className="btn btn-primary"
          onClick={() => { setEditing(null); setFormData({ name: '', email: '', departmentId: '' }); setModalOpen(true); }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <FiPlus /> Add Officer
        </motion.button>
      </div>

      <AnimatedTable title={`Officers (${officers.length})`} columns={columns} data={officers}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button className="btn btn-secondary btn-icon"
              onClick={() => { setEditing(row); setFormData({ name: row.name, email: row.email, departmentId: row.department?.departmentID || '' }); setModalOpen(true); }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
              <FiEdit2 size={15} />
            </motion.button>
            <motion.button className="btn btn-danger btn-icon"
              onClick={() => handleDelete(row.officerID)}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
              <FiTrash2 size={15} />
            </motion.button>
          </div>
        )} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Officer' : 'Add Officer'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <motion.button className="btn btn-primary" onClick={handleSubmit}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {editing ? 'Update' : 'Create'}
          </motion.button>
        </>}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" placeholder="Enter name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="Enter email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <select className="form-select" value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}>
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.departmentID} value={d.departmentID}>{d.departmentName}</option>
            ))}
          </select>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Officers;