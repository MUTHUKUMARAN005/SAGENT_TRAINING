import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Colleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ collegeName: '', location: '' });

  useEffect(() => { fetchColleges(); }, []);

  const fetchColleges = async () => {
    try {
      const res = await API.get('/colleges');
      setColleges(res.data);
    } catch { toast.error('Failed to fetch colleges'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await API.put(`/colleges/${editing.collegeID}`, formData);
        toast.success('College updated! ✅');
      } else {
        await API.post('/colleges', formData);
        toast.success('College created! 🏫');
      }
      fetchColleges();
      setModalOpen(false);
    } catch { toast.error('Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this college?')) {
      try {
        await API.delete(`/colleges/${id}`);
        toast.success('Deleted!');
        fetchColleges();
      } catch { toast.error('Failed to delete'); }
    }
  };

  const columns = [
    { key: 'collegeID', label: 'ID' },
    {
      key: 'collegeName',
      label: 'College Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--gradient-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
            }}
            whileHover={{ scale: 1.1, rotate: 10 }}
          >
            🏛️
          </motion.div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.collegeName}</span>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiMapPin size={14} color="var(--secondary)" />
          {row.location}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <PageTransition>
      <div className="page-header">
        <motion.div className="page-header-left"
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <h1>Colleges</h1>
          <p>Manage partner colleges and institutions</p>
        </motion.div>
        <motion.button className="btn btn-primary"
          onClick={() => { setEditing(null); setFormData({ collegeName: '', location: '' }); setModalOpen(true); }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <FiPlus /> Add College
        </motion.button>
      </div>

      <AnimatedTable
        title={`Colleges (${colleges.length})`}
        columns={columns}
        data={colleges}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button className="btn btn-secondary btn-icon"
              onClick={() => { setEditing(row); setFormData({ collegeName: row.collegeName, location: row.location }); setModalOpen(true); }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
              <FiEdit2 size={15} />
            </motion.button>
            <motion.button className="btn btn-danger btn-icon"
              onClick={() => handleDelete(row.collegeID)}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
              <FiTrash2 size={15} />
            </motion.button>
          </div>
        )}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit College' : 'Add College'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <motion.button className="btn btn-primary" onClick={handleSubmit}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {editing ? 'Update' : 'Create'}
          </motion.button>
        </>}>
        <div className="form-group">
          <label className="form-label">College Name</label>
          <input className="form-input" type="text" placeholder="Enter college name"
            value={formData.collegeName}
            onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="form-input" type="text" placeholder="Enter location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Colleges;