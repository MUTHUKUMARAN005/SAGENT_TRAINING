import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCheck,
  FiCalendar,
  FiFile,
  FiTrash2,
  FiUpload,
  FiX,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { filterRecordsForUser, filterStudentsForUser, isStudentRoleUser } from '../utils/ownership';

const normalizeDocStatus = (value) => {
  const status = String(value ?? '').trim().toLowerCase();
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
};

const toInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const getDocumentMetaStorageKey = (user) => {
  const userKey = user?.userID
    || user?.userId
    || user?.id
    || user?.username
    || user?.email
    || 'anonymous';
  return `document_verify_meta_${String(userKey).toLowerCase()}`;
};

const Documents = () => {
  const { user, hasPermission } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [documentMeta, setDocumentMeta] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    documentType: '',
    filePath: '',
    uploadDate: '',
  });
  const isStudentUser = isStudentRoleUser(user);
  const canCreateDocument = hasPermission('DOCUMENT_CREATE');
  const canDeleteDocument = hasPermission('DOCUMENT_DELETE');
  const canVerifyDocuments = hasPermission('DOCUMENT_CREATE') || hasPermission('DOCUMENT_DELETE');
  const documentMetaStorageKey = useMemo(() => getDocumentMetaStorageKey(user), [user]);
  const visibleStudents = filterStudentsForUser(students, user);
  const visibleDocuments = filterRecordsForUser(documents, user, (doc) => doc?.student);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(documentMetaStorageKey);
      if (!stored) {
        setDocumentMeta({});
        return;
      }
      const parsed = JSON.parse(stored);
      setDocumentMeta(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setDocumentMeta({});
    }
  }, [documentMetaStorageKey]);

  useEffect(() => {
    localStorage.setItem(documentMetaStorageKey, JSON.stringify(documentMeta));
  }, [documentMeta, documentMetaStorageKey]);

  const fetchData = async () => {
    try {
      const [docsRes, studentsRes] = await Promise.all([
        API.get('/documents'),
        API.get('/students'),
      ]);
      setDocuments(Array.isArray(docsRes.data) ? docsRes.data : []);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const studentId = toInt(formData.studentId);
    if (!studentId || !formData.documentType || !formData.filePath || !formData.uploadDate) {
      toast.error('Please complete all document fields.');
      return;
    }

    try {
      const payload = {
        student: { studentID: studentId },
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
        setDocumentMeta((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        toast.success('Document deleted!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const getDocIcon = (type) => {
    const icons = {
      Transcript: '📜',
      'ID Proof': '🪪',
      'Recommendation Letter': '✉️',
      Certificate: '🏅',
      Marksheet: '📄',
      Photo: '🖼️',
    };
    return icons[type] || '📄';
  };

  const getDocumentStatus = useCallback((document) => {
    const backendStatus = document?.verificationStatus || document?.status;
    if (backendStatus) return normalizeDocStatus(backendStatus);
    const documentId = toInt(document?.documentID || document?.documentId || document?.id);
    if (documentId && documentMeta[documentId]?.status) {
      return normalizeDocStatus(documentMeta[documentId].status);
    }
    return 'Pending';
  }, [documentMeta]);

  const verifyDocument = (document, nextStatus) => {
    if (!canVerifyDocuments) return;
    const documentId = toInt(document?.documentID || document?.documentId || document?.id);
    if (!documentId) return;

    setDocumentMeta((prev) => ({
      ...prev,
      [documentId]: {
        ...(prev[documentId] || {}),
        status: normalizeDocStatus(nextStatus),
        updatedAt: new Date().toISOString(),
      },
    }));
    toast.success(`Document marked as ${normalizeDocStatus(nextStatus)}.`);
  };

  const enhancedDocuments = useMemo(() => {
    return visibleDocuments.map((document) => ({
      ...document,
      _verificationStatus: getDocumentStatus(document),
    }));
  }, [visibleDocuments, getDocumentStatus]);

  const filteredDocuments = useMemo(() => {
    if (statusFilter === 'All') return enhancedDocuments;
    return enhancedDocuments.filter((document) => document._verificationStatus === statusFilter);
  }, [enhancedDocuments, statusFilter]);

  const statusSummary = useMemo(() => {
    return enhancedDocuments.reduce(
      (acc, document) => {
        acc.total += 1;
        if (document._verificationStatus === 'Approved') acc.approved += 1;
        else if (document._verificationStatus === 'Rejected') acc.rejected += 1;
        else acc.pending += 1;
        return acc;
      },
      { total: 0, approved: 0, rejected: 0, pending: 0 }
    );
  }, [enhancedDocuments]);

  const columns = [
    { key: 'documentID', label: 'ID' },
    {
      key: 'student',
      label: 'Student',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'var(--gradient-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
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
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 10,
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
      key: 'verificationStatus',
      label: 'Verification',
      render: (row) => (
        <span className={`status-badge ${row._verificationStatus.toLowerCase()}`}>
          <span className="status-dot" />
          {row._verificationStatus}
        </span>
      ),
    },
    {
      key: 'filePath',
      label: 'File Path',
      render: (row) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
          }}
        >
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
          <p>{isStudentUser ? 'View your uploaded documents and verification status' : 'Manage and verify uploaded student documents'}</p>
        </motion.div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            className="form-select"
            style={{ minWidth: 180 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Verification</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          {canCreateDocument && (
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
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card gradient-1">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{statusSummary.pending}</div>
        </div>
        <div className="stat-card gradient-4">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Approved</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{statusSummary.approved}</div>
        </div>
        <div className="stat-card gradient-2">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rejected</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{statusSummary.rejected}</div>
        </div>
      </div>

      <AnimatedTable
        title={`${isStudentUser ? 'My Documents' : 'Documents'} (${filteredDocuments.length})`}
        columns={columns}
        data={filteredDocuments}
        actions={(row) => (
          <div style={{ display: 'flex', gap: 8 }}>
            {canVerifyDocuments && normalizeDocStatus(row._verificationStatus) !== 'Approved' && (
              <motion.button
                className="btn btn-success btn-icon"
                onClick={() => verifyDocument(row, 'Approved')}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                title="Approve Document"
              >
                <FiCheck size={14} />
              </motion.button>
            )}
            {canVerifyDocuments && normalizeDocStatus(row._verificationStatus) !== 'Rejected' && (
              <motion.button
                className="btn btn-danger btn-icon"
                onClick={() => verifyDocument(row, 'Rejected')}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                title="Reject Document"
              >
                <FiX size={14} />
              </motion.button>
            )}
            {canDeleteDocument && (
              <motion.button
                className="btn btn-danger btn-icon"
                onClick={() => handleDelete(row.documentID)}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiTrash2 size={15} />
              </motion.button>
            )}
          </div>
        )}
      />

      {canCreateDocument && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Upload New Document"
          footer={(
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
          )}
        >
          <div className="form-group">
            <label className="form-label">Student</label>
            <select
              className="form-select"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            >
              <option value="">Select Student</option>
              {visibleStudents.map((student) => (
                <option key={student.studentID} value={student.studentID}>
                  {student.name}
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
              <option value="Marksheet">Marksheet</option>
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
      )}
    </PageTransition>
  );
};

export default Documents;
