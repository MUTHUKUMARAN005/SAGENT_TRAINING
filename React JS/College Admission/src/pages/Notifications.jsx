import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiBell, FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    message: '',
    sentDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notifRes, studentsRes] = await Promise.all([
        API.get('/notifications'),
        API.get('/students'),
      ]);
      setNotifications(notifRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        student: { studentID: parseInt(formData.studentId) },
        message: formData.message,
        sentDate: formData.sentDate,
      };
      await API.post('/notifications', payload);
      toast.success('Notification sent! 🔔');
      fetchData();
      setModalOpen(false);
      setFormData({ studentId: '', message: '', sentDate: '' });
    } catch (error) {
      toast.error('Failed to send notification');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this notification?')) {
      try {
        await API.delete(`/notifications/${id}`);
        toast.success('Notification deleted!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const columns = [
    { key: 'notificationID', label: 'ID' },
    {
      key: 'student',
      label: 'Student',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--gradient-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.8rem',
            }}
            whileHover={{ scale: 1.1, rotate: -5 }}
          >
            {row.student?.name?.charAt(0) || '?'}
          </motion.div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {row.student?.name || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'message',
      label: 'Message',
      render: (row) => (
        <motion.div
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            maxWidth: 400, padding: '8px 12px',
            background: 'rgba(99, 102, 241, 0.05)',
            borderRadius: 10, border: '1px solid rgba(99, 102, 241, 0.1)',
          }}
          whileHover={{ scale: 1.02, borderColor: 'rgba(99, 102, 241, 0.3)' }}
        >
          <FiBell size={14} color="var(--warning)" style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            fontSize: '0.85rem', lineHeight: 1.4,
          }}>
            {row.message}
          </span>
        </motion.div>
      ),
    },
    {
      key: 'sentDate',
      label: 'Sent Date',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiSend size={14} color="var(--accent)" />
          {row.sentDate}
        </div>
      ),
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
          <h1>🔔 Notifications</h1>
          <p>Manage and send notifications to students</p>
        </motion.div>
        <motion.button
          className="btn btn-primary"
          onClick={() => {
            setFormData({ studentId: '', message: '', sentDate: '' });
            setModalOpen(true);
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <FiPlus /> Send Notification
        </motion.button>
      </div>

      <AnimatedTable
        title={`Notifications (${notifications.length})`}
        columns={columns}
        data={notifications}
        actions={(row) => (
          <motion.button
            className="btn btn-danger btn-icon"
            onClick={() => handleDelete(row.notificationID)}
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiTrash2 size={15} />
          </motion.button>
        )}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Send New Notification"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <motion.button
              className="btn btn-primary"
              onClick={handleSubmit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiSend /> Send
            </motion.button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Student</label>
          <select
            className="form-select"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
          >
            <option value="">Select Student</option>
            {students.map((s) => (
              <option key={s.studentID} value={s.studentID}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Type your notification message..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            style={{ resize: 'vertical', minHeight: 100 }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Sent Date</label>
          <input
            className="form-input"
            type="date"
            value={formData.sentDate}
            onChange={(e) => setFormData({ ...formData, sentDate: e.target.value })}
          />
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Notifications;
