import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiClock, FiEdit2, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const toInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const getCourseMetaStorageKey = (user) => {
  const userKey = user?.userID
    || user?.userId
    || user?.id
    || user?.username
    || user?.email
    || 'anonymous';
  return `course_meta_${String(userKey).toLowerCase()}`;
};

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courseMeta, setCourseMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    courseName: '',
    departmentId: '',
    credits: '',
    duration: '',
    seatLimit: '',
  });

  const courseMetaStorageKey = useMemo(() => getCourseMetaStorageKey(user), [user]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(courseMetaStorageKey);
      if (!stored) {
        setCourseMeta({});
        return;
      }
      const parsed = JSON.parse(stored);
      setCourseMeta(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setCourseMeta({});
    }
  }, [courseMetaStorageKey]);

  useEffect(() => {
    localStorage.setItem(courseMetaStorageKey, JSON.stringify(courseMeta));
  }, [courseMeta, courseMetaStorageKey]);

  const fetchData = async () => {
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        API.get('/courses'),
        API.get('/departments'),
      ]);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const enhancedCourses = useMemo(() => (
    courses.map((course) => ({
      ...course,
      _seatLimit: (() => {
        const courseId = toInt(course?.courseID || course?.courseId || course?.id);
        const backendValue = toInt(course?.seatLimit || course?.maxSeats);
        if (backendValue !== null) return backendValue;
        return courseId ? (toInt(courseMeta[courseId]?.seatLimit) || 0) : 0;
      })(),
    }))
  ), [courses, courseMeta]);

  const persistSeatLimit = (courseId, seatLimit) => {
    const parsedSeat = toInt(seatLimit);
    if (!courseId || parsedSeat === null || parsedSeat < 0) return;
    setCourseMeta((prev) => ({
      ...prev,
      [courseId]: {
        ...(prev[courseId] || {}),
        seatLimit: parsedSeat,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleSubmit = async () => {
    const departmentId = toInt(formData.departmentId);
    const credits = toInt(formData.credits);
    const seatLimit = toInt(formData.seatLimit);

    if (!formData.courseName.trim() || !departmentId || credits === null || seatLimit === null || seatLimit < 0) {
      toast.error('Please complete all course fields, including seat limit.');
      return;
    }

    try {
      const payload = {
        courseName: formData.courseName.trim(),
        department: { departmentID: departmentId },
        credits,
        duration: formData.duration.trim(),
      };

      if (editing) {
        await API.put(`/courses/${editing.courseID}`, payload);
        persistSeatLimit(editing.courseID, seatLimit);
        toast.success('Course updated! ✅');
      } else {
        const createRes = await API.post('/courses', payload);
        let createdCourseId = toInt(createRes?.data?.courseID || createRes?.data?.courseId || createRes?.data?.id);
        if (!createdCourseId) {
          const refreshed = await API.get('/courses');
          const refreshedCourses = Array.isArray(refreshed.data) ? refreshed.data : [];
          const match = refreshedCourses.find((course) =>
            String(course?.courseName || '').trim().toLowerCase() === formData.courseName.trim().toLowerCase()
            && toInt(course?.department?.departmentID || course?.department?.departmentId) === departmentId
          );
          createdCourseId = toInt(match?.courseID || match?.courseId || match?.id);
        }
        if (createdCourseId) {
          persistSeatLimit(createdCourseId, seatLimit);
        }
        toast.success('Course created! 📚');
      }

      fetchData();
      setModalOpen(false);
      setEditing(null);
      setFormData({
        courseName: '',
        departmentId: '',
        credits: '',
        duration: '',
        seatLimit: '',
      });
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this course?')) {
      try {
        await API.delete(`/courses/${id}`);
        setCourseMeta((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        toast.success('Deleted!');
        fetchData();
      } catch {
        toast.error('Failed to delete');
      }
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
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--gradient-4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileHover={{ scale: 1.1 }}
          >
            📖
          </motion.div>
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
    {
      key: 'seatLimit',
      label: 'Seat Limit',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiUsers size={14} color="var(--primary)" />
          {row._seatLimit}
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
          <h1>Courses</h1>
          <p>Manage available courses, programs, and seat limits</p>
        </motion.div>
        <motion.button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setFormData({
              courseName: '',
              departmentId: '',
              credits: '',
              duration: '',
              seatLimit: '',
            });
            setModalOpen(true);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <FiPlus /> Add Course
        </motion.button>
      </div>

      <AnimatedTable
        title={`Courses (${enhancedCourses.length})`}
        columns={columns}
        data={enhancedCourses}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              className="btn btn-secondary btn-icon"
              onClick={() => {
                setEditing(row);
                setFormData({
                  courseName: row.courseName,
                  departmentId: row.department?.departmentID || row.department?.departmentId || '',
                  credits: row.credits,
                  duration: row.duration,
                  seatLimit: String(row._seatLimit || 0),
                });
                setModalOpen(true);
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiEdit2 size={15} />
            </motion.button>
            <motion.button
              className="btn btn-danger btn-icon"
              onClick={() => handleDelete(row.courseID)}
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
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Course' : 'Add Course'}
        footer={(
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <motion.button
              className="btn btn-primary"
              onClick={handleSubmit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {editing ? 'Update' : 'Create'}
            </motion.button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Course Name</label>
          <input
            className="form-input"
            placeholder="Enter course name"
            value={formData.courseName}
            onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Department</label>
          <select
            className="form-select"
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
          >
            <option value="">Select Department</option>
            {departments.map((department) => (
              <option key={department.departmentID} value={department.departmentID}>
                {department.departmentName}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Credits</label>
          <input
            className="form-input"
            type="number"
            placeholder="Enter credits"
            value={formData.credits}
            onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Duration</label>
          <input
            className="form-input"
            placeholder="e.g., 4 Years"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Seat Limit</label>
          <input
            className="form-input"
            type="number"
            min="0"
            placeholder="Enter seat limit"
            value={formData.seatLimit}
            onChange={(e) => setFormData({ ...formData, seatLimit: e.target.value })}
          />
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Courses;
