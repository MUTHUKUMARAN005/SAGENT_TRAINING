import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ departmentName: '', collegeId: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [dRes, cRes] = await Promise.all([API.get('/departments'), API.get('/colleges')]);
      setDepartments(dRes.data);
      setColleges(cRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        departmentName: formData.departmentName,
        college: { collegeID: parseInt(formData.collegeId) },
      };
      if (editing) {
        await API.put(`/departments/${editing.departmentID}`, payload);
        toast.success('Updated! ✅');
      } else {
        await API.post('/departments', payload);
        toast.success('Created! 🏢');
      }
      fetchData();
      setModalOpen(false);
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) {
      try { await API.delete(`/departments/${id}`); toast.success('Deleted!'); fetchData(); }
      catch { toast.error('Failed'); }
    }
  };

  const columns = [
    { key: 'departmentID', label: 'ID' },
    {
      key: 'departmentName',
      label: 'Department',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.departmentName}</span>
      ),
    },
    {
      key: 'college',
      label: 'College',
      render: (row) => row.college?.collegeName || 'N/A',
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <PageTransition>
      <div className="page-header">
        <motion.div className="page-header-left"
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <h1>Departments</h1>
          <p>Manage academic departments</p>
        </motion.div>
        <motion.button className="btn btn-primary"
          onClick={() => { setEditing(null); setFormData({ departmentName: '', collegeId: '' }); setModalOpen(true); }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <FiPlus /> Add Department
        </motion.button>
      </div>

      <AnimatedTable title={`Departments (${departments.length})`} columns={columns} data={departments}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button className="btn btn-secondary btn-icon"
              onClick={() => { setEditing(row); setFormData({ departmentName: row.departmentName, collegeId: row.college?.collegeID || '' }); setModalOpen(true); }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
              <FiEdit2 size={15} />
            </motion.button>
            <motion.button className="btn btn-danger btn-icon"
              onClick={() => handleDelete(row.departmentID)}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
              <FiTrash2 size={15} />
            </motion.button>
          </div>
        )} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Department' : 'Add Department'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <motion.button className="btn btn-primary" onClick={handleSubmit}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {editing ? 'Update' : 'Create'}
          </motion.button>
        </>}>
        <div className="form-group">
          <label className="form-label">Department Name</label>
          <input className="form-input" placeholder="Enter department name"
            value={formData.departmentName}
            onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">College</label>
          <select className="form-select" value={formData.collegeId}
            onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}>
            <option value="">Select College</option>
            {colleges.map((c) => (
              <option key={c.collegeID} value={c.collegeID}>{c.collegeName}</option>
            ))}
          </select>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Departments;