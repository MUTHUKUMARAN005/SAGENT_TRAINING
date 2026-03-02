import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [filter, setFilter] = useState('All');
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    submissionDate: '',
    status: 'Pending',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, studentsRes, coursesRes] = await Promise.all([
        API.get('/applications'),
        API.get('/students'),
        API.get('/courses'),
      ]);
      setApplications(appsRes.data);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        student: { studentID: parseInt(formData.studentId) },
        course: { courseID: parseInt(formData.courseId) },
        submissionDate: formData.submissionDate,
        status: formData.status,
      };

      if (editingApp) {
        await API.put(`/applications/${editingApp.applicationID}`, payload);
        toast.success('Application updated! ✅');
      } else {
        await API.post('/applications', payload);
        toast.success('Application created! 🚀');
      }
      fetchData();
      closeModal();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this application?')) {
      try {
        await API.delete(`/applications/${id}`);
        toast.success('Application deleted!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const openCreateModal = () => {
    setEditingApp(null);
    setFormData({ studentId: '', courseId: '', submissionDate: '', status: 'Pending' });
    setModalOpen(true);
  };

  const openEditModal = (app) => {
    setEditingApp(app);
    setFormData({
      studentId: app.student?.studentID || '',
      courseId: app.course?.courseID || '',
      submissionDate: app.submissionDate || '',
      status: app.status || 'Pending',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingApp(null);
  };

  const getStatusBadge = (status) => {
    const statusClass = status?.toLowerCase().replace(' ', '-');
    return (
      <span className={`status-badge ${statusClass}`}>
        <span className="status-dot" />
        {status}
      </span>
    );
  };

  const filteredApplications =
    filter === 'All'
      ? applications
      : applications.filter((a) => a.status === filter);

  const columns = [
    { key: 'applicationID', label: 'ID' },
    {
      key: 'student',
      label: 'Student',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--gradient-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            {row.student?.name?.charAt(0) || '?'}
          </div>
          {row.student?.name || 'N/A'}
        </div>
      ),
    },
    {
      key: 'course',
      label: 'Course',
      render: (row) => row.course?.courseName || 'N/A',
    },
    { key: 'submissionDate', label: 'Submitted' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => getStatusBadge(row.status),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <PageTransition>
      <div className="page-header">
        <motion.div
          className="page-header-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1>Applications</h1>
          <p>Track and manage admission applications</p>
        </motion.div>
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <select
              className="form-select"
              style={{ width: 150 }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </motion.div>
          <motion.button
            className="btn btn-primary"
            onClick={openCreateModal}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FiPlus /> New Application
          </motion.button>
        </div>
      </div>

      <AnimatedTable
        title={`Applications (${filteredApplications.length})`}
        columns={columns}
        data={filteredApplications}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              className="btn btn-secondary btn-icon"
              onClick={() => openEditModal(row)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiEdit2 size={15} />
            </motion.button>
            <motion.button
              className="btn btn-danger btn-icon"
              onClick={() => handleDelete(row.applicationID)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiTrash2 size={15} />
            </motion.button>
          </div>
        )}
      />

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingApp ? 'Edit Application' : 'New Application'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <motion.button
              className="btn btn-primary"
              onClick={handleSubmit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {editingApp ? 'Update' : 'Submit'}
            </motion.button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Student</label>
          <select
            className="form-select"
            value={formData.studentId}
            onChange={(e) =>
              setFormData({ ...formData, studentId: e.target.value })
            }
          >
            <option value="">Select Student</option>
            {students.map((s) => (
              <option key={s.studentID} value={s.studentID}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Course</label>
          <select
            className="form-select"
            value={formData.courseId}
            onChange={(e) =>
              setFormData({ ...formData, courseId: e.target.value })
            }
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c.courseID} value={c.courseID}>
                {c.courseName}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Submission Date</label>
          <input
            className="form-input"
            type="date"
            value={formData.submissionDate}
            onChange={(e) =>
              setFormData({ ...formData, submissionDate: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Under Review">Under Review</option>
          </select>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Applications;
