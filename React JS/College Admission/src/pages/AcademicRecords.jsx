import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiAward, FiCalendar, FiBookOpen } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const AcademicRecords = () => {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    grade: '',
    year: '',
    institution: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, studentsRes] = await Promise.all([
        API.get('/academic-records'),
        API.get('/students'),
      ]);
      setRecords(recordsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast.error('Failed to load academic records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        student: { studentID: parseInt(formData.studentId) },
        grade: formData.grade,
        year: parseInt(formData.year),
        institution: formData.institution,
      };
      await API.post('/academic-records', payload);
      toast.success('Academic record added! 🎓');
      fetchData();
      setModalOpen(false);
      setFormData({ studentId: '', grade: '', year: '', institution: '' });
    } catch (error) {
      toast.error('Failed to create record');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this academic record?')) {
      try {
        await API.delete(`/academic-records/${id}`);
        toast.success('Record deleted!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'var(--text-muted)';
    if (grade.includes('A+')) return '#10b981';
    if (grade.includes('A')) return '#34d399';
    if (grade.includes('B+')) return '#f59e0b';
    if (grade.includes('B')) return '#fbbf24';
    if (grade.includes('C')) return '#f97316';
    return '#ef4444';
  };

  const getGradeEmoji = (grade) => {
    if (!grade) return '📊';
    if (grade.includes('A+')) return '🌟';
    if (grade.includes('A')) return '⭐';
    if (grade.includes('B+')) return '👍';
    if (grade.includes('B')) return '👌';
    return '📝';
  };

  const columns = [
    { key: 'recordID', label: 'ID' },
    {
      key: 'student',
      label: 'Student',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--gradient-5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.8rem',
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
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
      key: 'grade',
      label: 'Grade',
      render: (row) => (
        <motion.div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: `${getGradeColor(row.grade)}15`,
            color: getGradeColor(row.grade),
            fontWeight: 700, fontSize: '0.9rem',
            border: `2px solid ${getGradeColor(row.grade)}40`,
          }}
          whileHover={{ scale: 1.1, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>{getGradeEmoji(row.grade)}</span>
          <FiAward size={14} />
          {row.grade}
        </motion.div>
      ),
    },
    {
      key: 'year',
      label: 'Year',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiCalendar size={14} color="var(--accent)" />
          <span style={{ fontWeight: 600 }}>{row.year}</span>
        </div>
      ),
    },
    {
      key: 'institution',
      label: 'Institution',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiBookOpen size={14} color="var(--primary)" />
          {row.institution}
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
          <h1>🎓 Academic Records</h1>
          <p>View and manage student academic history</p>
        </motion.div>
        <motion.button
          className="btn btn-primary"
          onClick={() => {
            setFormData({ studentId: '', grade: '', year: '', institution: '' });
            setModalOpen(true);
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <FiPlus /> Add Record
        </motion.button>
      </div>

      {/* Grade Distribution Summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {['A+', 'A', 'A-', 'B+', 'B'].map((grade, idx) => (
          <motion.div
            key={grade}
            className={`stat-card gradient-${(idx % 5) + 1}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.5rem' }}>{getGradeEmoji(grade)}</span>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Grade {grade}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  {records.filter(r => r.grade === grade).length}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatedTable
        title={`Academic Records (${records.length})`}
        columns={columns}
        data={records}
        actions={(row) => (
          <motion.button
            className="btn btn-danger btn-icon"
            onClick={() => handleDelete(row.recordID)}
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
        title="Add Academic Record"
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
              <FiAward /> Add Record
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
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Grade</label>
          <select
            className="form-select"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          >
            <option value="">Select Grade</option>
            <option value="A+">A+ (Outstanding)</option>
            <option value="A">A (Excellent)</option>
            <option value="A-">A- (Very Good)</option>
            <option value="B+">B+ (Good)</option>
            <option value="B">B (Above Average)</option>
            <option value="B-">B- (Average)</option>
            <option value="C+">C+ (Below Average)</option>
            <option value="C">C (Satisfactory)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Year</label>
          <input
            className="form-input"
            type="number"
            placeholder="e.g., 2023"
            min="2000"
            max="2030"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Institution</label>
          <input
            className="form-input"
            type="text"
            placeholder="Enter institution name"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
          />
        </div>
      </Modal>
    </PageTransition>
  );
};

export default AcademicRecords;