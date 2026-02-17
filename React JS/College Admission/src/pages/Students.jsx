import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiMail, FiPhone } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await API.get('/students');
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingStudent) {
        await API.put(`/students/${editingStudent.studentID}`, formData);
        toast.success('Student updated successfully! 🎉');
      } else {
        await API.post('/students', formData);
        toast.success('Student created successfully! 🎉');
      }
      fetchStudents();
      closeModal();
    } catch (error) {
      toast.error('Operation failed. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await API.delete(`/students/${id}`);
        toast.success('Student deleted successfully!');
        fetchStudents();
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({ name: '', email: '', phone: '', dateOfBirth: '' });
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStudent(null);
    setFormData({ name: '', email: '', phone: '', dateOfBirth: '' });
  };

  const columns = [
    { key: 'studentID', label: 'ID' },
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--gradient-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            {row.name?.charAt(0)}
          </motion.div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {row.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiMail size={14} color="var(--primary)" />
          {row.email}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiPhone size={14} color="var(--success)" />
          {row.phone}
        </div>
      ),
    },
    { key: 'dateOfBirth', label: 'Date of Birth' },
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
          <h1>Students</h1>
          <p>Manage student records and information</p>
        </motion.div>
        <motion.button
          className="btn btn-primary"
          onClick={openCreateModal}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <FiPlus /> Add Student
        </motion.button>
      </div>

      <AnimatedTable
        title={`All Students (${students.length})`}
        columns={columns}
        data={students}
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
              onClick={() => handleDelete(row.studentID)}
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
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
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
              {editingStudent ? 'Update' : 'Create'}
            </motion.button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            className="form-input"
            type="text"
            placeholder="Enter student name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="Enter email address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input
            className="form-input"
            type="text"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Date of Birth</label>
          <input
            className="form-input"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) =>
              setFormData({ ...formData, dateOfBirth: e.target.value })
            }
          />
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Students;