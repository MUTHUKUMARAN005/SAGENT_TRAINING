import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiAward } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    courseName: '', departmentId: '', credits: '', duration: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        API.get('/courses'), API.get('/departments'),
      ]);
      setCourses(coursesRes.data);
      setDepartments(deptsRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        courseName: formData.courseName,
        department: { departmentID: parseInt(formData.departmentId) },
        credits: parseInt(formData.credits),
        duration: formData.duration,
      };
      if (editing) {
        await API.put(`/courses/${editing.courseID}`, payload);
        toast.success('Course updated! ✅');
      } else {
        await API.post('/courses', payload);
        toast.success('Course created! 📚');
      }
      fetchData();
      setModalOpen(false);
    } catch { toast.error('Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this course?')) {
      try {
        await API.delete(`/courses/${id}`);
        toast.success('Deleted!');
        fetchData();
      } catch { toast.error('Failed to delete'); }
    }
  };

  const columns = [
    { key: 'courseID', label: 'ID' },
    {
      key: 'courseName',
      label: 'Course',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--gradient-4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            whileHover={{ scale: 1.1 }}
          >📖</motion.div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.courseName}</span>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (row) => row.department?.departmentName || 'N/A',
    },
    {
      key: 'credits',
      label: 'Credits',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiAward size={14} color="var(--warning)" /> {row.credits}
        </div>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiClock size={14} color="var(--accent)" /> {row.duration}
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
          <h1>Courses</h1>
          <p>Manage available courses and programs</p>
        </motion.div>
        <motion.button className="btn btn-primary"
          onClick={() => { setEditing(null); setFormData({ courseName: '', departmentId: '', credits: '', duration: '' }); setModalOpen(true); }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <FiPlus /> Add Course
        </motion.button>
      </div>

      <AnimatedTable
        title={`Courses (${courses.length})`}
        columns={columns}
        data={courses}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button className="btn btn-secondary btn-icon"
              onClick={() => { setEditing(row); setFormData({ courseName: row.courseName, departmentId: row.department?.departmentID || '', credits: row.credits, duration: row.duration }); setModalOpen(true); }}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
              <FiEdit2 size={15} />
            </motion.button>
            <motion.button className="btn btn-danger btn-icon"
              onClick={() => handleDelete(row.courseID)}
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
              <FiTrash2 size={15} />
            </motion.button>
          </div>
        )}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Course' : 'Add Course'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <motion.button className="btn btn-primary" onClick={handleSubmit}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {editing ? 'Update' : 'Create'}
          </motion.button>
        </>}>
        <div className="form-group">
          <label className="form-label">Course Name</label>
          <input className="form-input" placeholder="Enter course name"
            value={formData.courseName}
            onChange={(e) => setFormData({ ...formData, courseName: e.target.value })} />
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
        <div className="form-group">
          <label className="form-label">Credits</label>
          <input className="form-input" type="number" placeholder="Enter credits"
            value={formData.credits}
            onChange={(e) => setFormData({ ...formData, credits: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Duration</label>
          <input className="form-input" placeholder="e.g., 4 Years"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Courses;