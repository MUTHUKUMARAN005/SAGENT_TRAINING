import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2, FiFile, FiUpload, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    documentType: '',
    filePath: '',
    uploadDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, studentsRes] = await Promise.all([
        API.get('/documents'),
        API.get('/students'),
      ]);
      setDocuments(docsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        student: { studentID: parseInt(formData.studentId) },
        documentType: formData.documentType,
        filePath: formData.filePath,
        uploadDate: formData.uploadDate,
      };
      await API.post('/documents', payload);
      toast.success('Document uploaded! 📄');
      fetchData();
      setModalOpen(false);
      setFormData({ studentId: '', documentType: '', filePath: '', uploadDate: '' });
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this document?')) {
      try {
        await API.delete(`/documents/${id}`);
        toast.success('Document deleted!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const getDocIcon = (type) => {
    const icons = {
      'Transcript': '📜',
      'ID Proof': '🪪',
      'Recommendation Letter': '✉️',
      'Certificate': '🏅',
    };
    return icons[type] || '📄';
  };

  const columns = [
    { key: 'documentID', label: 'ID' },
    {
      key: 'student',
      label: 'Student',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--gradient-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.8rem',
            }}
            whileHover={{ scale: 1.1 }}
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
      key: 'documentType',
      label: 'Type',
      render: (row) => (
        <motion.div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 10,
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            width: 'fit-content',
          }}
          whileHover={{ scale: 1.05 }}
        >
          <span>{getDocIcon(row.documentType)}</span>
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{row.documentType}</span>
        </motion.div>
      ),
    },
    {
      key: 'filePath',
      label: 'File Path',
      render: (row) => (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.85rem', color: 'var(--text-muted)',
          fontFamily: 'monospace',
        }}>
          <FiFile size={14} color="var(--primary)" />
          {row.filePath}
        </div>
      ),
    },
    {
      key: 'uploadDate',
      label: 'Upload Date',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiCalendar size={14} color="var(--warning)" />
          {row.uploadDate}
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
          <h1>📁 Documents</h1>
          <p>Manage uploaded student documents</p>
        </motion.div>
        <motion.button
          className="btn btn-primary"
          onClick={() => {
            setFormData({ studentId: '', documentType: '', filePath: '', uploadDate: '' });
            setModalOpen(true);
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <FiUpload /> Upload Document
        </motion.button>
      </div>

      <AnimatedTable
        title={`Documents (${documents.length})`}
        columns={columns}
        data={documents}
        actions={(row) => (
          <motion.button
            className="btn btn-danger btn-icon"
            onClick={() => handleDelete(row.documentID)}
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
        title="Upload New Document"
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
              <FiUpload /> Upload
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
          <label className="form-label">Document Type</label>
          <select
            className="form-select"
            value={formData.documentType}
            onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
          >
            <option value="">Select Type</option>
            <option value="Transcript">Transcript</option>
            <option value="ID Proof">ID Proof</option>
            <option value="Recommendation Letter">Recommendation Letter</option>
            <option value="Certificate">Certificate</option>
            <option value="Resume">Resume</option>
            <option value="Photo">Photo</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">File Path</label>
          <input
            className="form-input"
            type="text"
            placeholder="/docs/filename.pdf"
            value={formData.filePath}
            onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Upload Date</label>
          <input
            className="form-input"
            type="date"
            value={formData.uploadDate}
            onChange={(e) => setFormData({ ...formData, uploadDate: e.target.value })}
          />
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Documents;
