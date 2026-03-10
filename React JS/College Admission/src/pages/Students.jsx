import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiMail, FiPhone, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { filterStudentsForUser, findLinkedStudentForUser, isStudentRoleUser } from '../utils/ownership';

const Students = () => {
  const { user, hasPermission } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });
  const isStudentUser = isStudentRoleUser(user);
  const canCreateStudent = hasPermission('STUDENT_CREATE') && !isStudentUser;
  const canEditStudent = hasPermission('STUDENT_EDIT') && !isStudentUser;
  const canEditOwnProfile = isStudentUser || hasPermission('STUDENT_EDIT');
  const canDeleteStudent = hasPermission('STUDENT_DELETE') && !isStudentUser;
  const canManageStudents = canEditStudent || canDeleteStudent;
  const visibleStudents = filterStudentsForUser(students, user);
  const linkedStudent = findLinkedStudentForUser(students, user);
  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return visibleStudents;

    return visibleStudents.filter((student) => {
      const studentId = String(student?.studentID || student?.studentId || '').toLowerCase();
      const name = String(student?.name || '').toLowerCase();
      const email = String(student?.email || '').toLowerCase();
      const phone = String(student?.phone || '').toLowerCase();
      return studentId.includes(query) || name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [visibleStudents, searchTerm]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await API.get('/students');
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const dateOfBirth = formData.dateOfBirth;

    if (!name || !email || !phone || !dateOfBirth) {
      toast.error('Please fill in all fields.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    const payload = { name, email, phone, dateOfBirth };

    try {
      if (editingStudent) {
        await API.put(`/students/${editingStudent.studentID}`, payload);
        toast.success(isStudentUser ? 'Profile updated successfully! 🎉' : 'Student updated successfully! 🎉');
      } else {
        await API.post('/students', payload);
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

  const openProfileModal = () => {
    if (!linkedStudent) {
      toast.error('Your student profile could not be found.');
      return;
    }
    openEditModal(linkedStudent);
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
          <h1>{isStudentUser ? 'My Profile' : 'Students'}</h1>
          <p>
            {isStudentUser
              ? 'View and manage your student profile'
              : 'Manage and monitor student records'}
          </p>
        </motion.div>
        {isStudentUser && canEditOwnProfile && linkedStudent && (
          <motion.button
            className="btn btn-primary"
            onClick={openProfileModal}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <FiEdit2 /> Edit My Profile
          </motion.button>
        )}
        {canCreateStudent && (
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
        )}
      </div>

      {!isStudentUser && (
        <motion.div
          className="table-container"
          style={{ marginBottom: 16, padding: 16 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ position: 'relative', maxWidth: 380 }}>
            <FiSearch
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              className="form-input"
              type="text"
              placeholder="Search students by name, email, phone, or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </motion.div>
      )}

      {isStudentUser && students.length > 0 && visibleStudents.length === 0 && (
        <div className="table-container" style={{ marginBottom: 20 }}>
          <div className="empty-state" style={{ padding: 20 }}>
            <h3>Your student profile was not found</h3>
            <p>
              Your account is signed in as a student, but no matching student record was linked.
              Please contact an admin.
            </p>
          </div>
        </div>
      )}

      {isStudentUser && linkedStudent && (
        <motion.div
          className="table-container"
          style={{ marginBottom: 20, padding: 20 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0 }}>My Profile</h3>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>Manage your personal details</p>
            </div>
            {canEditOwnProfile && (
              <motion.button
                className="btn btn-secondary"
                onClick={openProfileModal}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiEdit2 /> Edit Profile
              </motion.button>
            )}
          </div>
          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <div className="stat-card gradient-1">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Full Name</div>
              <div style={{ fontWeight: 700 }}>{linkedStudent.name || 'N/A'}</div>
            </div>
            <div className="stat-card gradient-2">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Email</div>
              <div style={{ fontWeight: 700 }}>{linkedStudent.email || 'N/A'}</div>
            </div>
            <div className="stat-card gradient-3">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Phone</div>
              <div style={{ fontWeight: 700 }}>{linkedStudent.phone || 'N/A'}</div>
            </div>
            <div className="stat-card gradient-4">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Date of Birth</div>
              <div style={{ fontWeight: 700 }}>{linkedStudent.dateOfBirth || 'N/A'}</div>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatedTable
        title={isStudentUser
          ? `My Student Details (${filteredStudents.length})`
          : `All Students (${filteredStudents.length})`}
        columns={columns}
        data={filteredStudents}
        actions={canManageStudents ? ((row) => (
          <div style={{ display: 'flex', gap: 8 }}>
            {canEditStudent && (
              <motion.button
                className="btn btn-secondary btn-icon"
                onClick={() => openEditModal(row)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiEdit2 size={15} />
              </motion.button>
            )}
            {canDeleteStudent && (
              <motion.button
                className="btn btn-danger btn-icon"
                onClick={() => handleDelete(row.studentID)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiTrash2 size={15} />
              </motion.button>
            )}
          </div>
        )) : null}
      />

      {(canCreateStudent || canEditStudent || (isStudentUser && canEditOwnProfile)) && (
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={editingStudent ? (isStudentUser ? 'Edit My Profile' : 'Edit Student') : 'Add New Student'}
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
      )}
    </PageTransition>
  );
};

export default Students;
