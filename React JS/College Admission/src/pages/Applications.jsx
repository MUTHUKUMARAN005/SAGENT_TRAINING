import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCheck,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiPlus,
  FiSave,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import {
  filterRecordsForUser,
  filterStudentsForUser,
  findLinkedStudentForUser,
  isStudentRoleUser,
} from '../utils/ownership';
import { downloadTextPdf } from '../utils/pdf';

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const normalizeValue = (value) => String(value ?? '').trim().toLowerCase();

const toInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeStatus = (status) => {
  const raw = String(status ?? '').trim().toLowerCase();
  if (raw === 'approved') return 'Approved';
  if (raw === 'rejected') return 'Rejected';
  return 'Pending';
};

const getProgressPercentForStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'Approved') return 100;
  if (normalized === 'Rejected') return 100;
  return 35;
};

const getDraftStorageKey = (user) => {
  const userKey = user?.userID
    || user?.userId
    || user?.id
    || user?.username
    || user?.email
    || 'anonymous';
  return `admission_form_draft_${String(userKey).toLowerCase()}`;
};

const getApplicationMetaStorageKey = (user) => {
  const userKey = user?.userID
    || user?.userId
    || user?.id
    || user?.username
    || user?.email
    || 'anonymous';
  return `application_meta_${String(userKey).toLowerCase()}`;
};

const Applications = () => {
  const { user, hasPermission } = useAuth();
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [filter, setFilter] = useState('All');
  const [hasDraft, setHasDraft] = useState(false);
  const [applicationMeta, setApplicationMeta] = useState({});
  const isStudentUser = isStudentRoleUser(user);
  const canCreateApplication = hasPermission('APPLICATION_CREATE');
  const canEditApplication = hasPermission('APPLICATION_EDIT');
  const canDeleteApplication = hasPermission('APPLICATION_DELETE');
  const canCreateNotification = hasPermission('NOTIFICATION_CREATE');
  const canManageApplications = canEditApplication || canDeleteApplication;
  const canSyncStudentDetails = hasPermission('STUDENT_EDIT') || isStudentUser;
  const visibleStudents = filterStudentsForUser(students, user);
  const visibleApplications = filterRecordsForUser(applications, user, (app) => app?.student);
  const linkedStudent = findLinkedStudentForUser(students, user);
  const draftStorageKey = useMemo(() => getDraftStorageKey(user), [user]);
  const applicationMetaStorageKey = useMemo(() => getApplicationMetaStorageKey(user), [user]);

  const getDefaultFormData = () => ({
    studentId: linkedStudent?.studentID || linkedStudent?.studentId || '',
    courseId: '',
    submissionDate: getTodayIsoDate(),
    status: 'Pending',
    personalName: linkedStudent?.name || user?.fullName || '',
    personalEmail: linkedStudent?.email || user?.email || '',
    personalPhone: linkedStudent?.phone || '',
    personalDob: linkedStudent?.dateOfBirth || '',
    academicInstitution: '',
    academicYear: '',
    academicGrade: '',
    marksheetPath: '',
    photoPath: '',
    idProofPath: '',
    remarks: '',
  });

  const [formData, setFormData] = useState(getDefaultFormData);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setHasDraft(!!localStorage.getItem(draftStorageKey));
  }, [draftStorageKey]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(applicationMetaStorageKey);
      if (!stored) {
        setApplicationMeta({});
        return;
      }
      const parsed = JSON.parse(stored);
      setApplicationMeta(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setApplicationMeta({});
    }
  }, [applicationMetaStorageKey]);

  useEffect(() => {
    localStorage.setItem(applicationMetaStorageKey, JSON.stringify(applicationMeta));
  }, [applicationMeta, applicationMetaStorageKey]);

  const fetchData = async () => {
    try {
      const [
        appsRes,
        studentsRes,
        coursesRes,
        docsRes,
        recordsRes,
      ] = await Promise.allSettled([
        API.get('/applications'),
        API.get('/students'),
        API.get('/courses'),
        API.get('/documents'),
        API.get('/academic-records'),
      ]);

      const criticalFailure = [appsRes, studentsRes, coursesRes].some((result) => result.status === 'rejected');
      if (criticalFailure) {
        toast.error('Failed to fetch some admission data.');
      }

      setApplications(
        appsRes.status === 'fulfilled' && Array.isArray(appsRes.value.data)
          ? appsRes.value.data
          : []
      );
      setStudents(
        studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value.data)
          ? studentsRes.value.data
          : []
      );
      setCourses(
        coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value.data)
          ? coursesRes.value.data
          : []
      );
      setDocuments(
        docsRes.status === 'fulfilled' && Array.isArray(docsRes.value.data)
          ? docsRes.value.data
          : []
      );
      setRecords(
        recordsRes.status === 'fulfilled' && Array.isArray(recordsRes.value.data)
          ? recordsRes.value.data
          : []
      );
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingApp(null);
    setFormData(getDefaultFormData());
  };

  const openCreateModal = () => {
    if (isStudentUser && !linkedStudent) {
      toast.error('Your student profile is not linked. Please contact an admin.');
      return;
    }
    setEditingApp(null);
    setFormData(getDefaultFormData());
    setModalOpen(true);
  };

  const openEditModal = (app) => {
    const selectedStudentId = app.student?.studentID || app.student?.studentId || '';
    const selectedStudentIdNum = toInt(selectedStudentId);

    const studentRecords = records
      .filter((record) => toInt(record?.student?.studentID || record?.student?.studentId) === selectedStudentIdNum)
      .sort((a, b) => (toInt(b.year) || 0) - (toInt(a.year) || 0));
    const latestRecord = studentRecords[0];

    const studentDocs = documents.filter(
      (doc) => toInt(doc?.student?.studentID || doc?.student?.studentId) === selectedStudentIdNum
    );
    const findDocumentPath = (type) => {
      const match = studentDocs.find((doc) => normalizeValue(doc.documentType) === normalizeValue(type));
      return match?.filePath || '';
    };

    setEditingApp(app);
    setFormData({
      studentId: selectedStudentId,
      courseId: app.course?.courseID || app.course?.courseId || '',
      submissionDate: app.submissionDate || getTodayIsoDate(),
      status: normalizeStatus(app.status),
      personalName: app.student?.name || '',
      personalEmail: app.student?.email || '',
      personalPhone: app.student?.phone || '',
      personalDob: app.student?.dateOfBirth || '',
      academicInstitution: latestRecord?.institution || '',
      academicYear: latestRecord?.year ? String(latestRecord.year) : '',
      academicGrade: latestRecord?.grade || '',
      marksheetPath: findDocumentPath('Marksheet') || findDocumentPath('Transcript'),
      photoPath: findDocumentPath('Photo'),
      idProofPath: findDocumentPath('ID Proof'),
      remarks: app.remarks || app.remark || applicationMeta[app.applicationID]?.remarks || '',
    });
    setModalOpen(true);
  };

  const saveDraft = () => {
    const selectedStudentId = isStudentUser
      ? (linkedStudent?.studentID || linkedStudent?.studentId || formData.studentId)
      : formData.studentId;

    const draftPayload = {
      ...formData,
      studentId: selectedStudentId,
      _savedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftStorageKey, JSON.stringify(draftPayload));
    setHasDraft(true);
    toast.success('Admission draft saved locally.');
  };

  const loadDraft = () => {
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) {
      toast.info('No saved draft found.');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setFormData((prev) => ({
        ...prev,
        ...parsed,
        studentId: isStudentUser
          ? (linkedStudent?.studentID || linkedStudent?.studentId || prev.studentId)
          : (parsed.studentId || prev.studentId),
      }));
      setModalOpen(true);
      toast.success('Draft loaded.');
    } catch (error) {
      toast.error('Draft is invalid and could not be loaded.');
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(draftStorageKey);
    setHasDraft(false);
    toast.info('Draft cleared.');
  };

  const handleDocumentFileChange = (field, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, [field]: `/uploads/${file.name}` }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const selectedStudentId = isStudentUser
      ? (linkedStudent?.studentID || linkedStudent?.studentId || formData.studentId)
      : formData.studentId;
    const studentIdNum = toInt(selectedStudentId);
    const courseIdNum = toInt(formData.courseId);
    const academicYearNum = toInt(formData.academicYear);
    const email = formData.personalEmail.trim();
    const remarks = formData.remarks.trim();
    const normalizedStatus = normalizeStatus(formData.status);
    const requiredValues = [
      studentIdNum,
      courseIdNum,
      formData.submissionDate,
      formData.personalName.trim(),
      email,
      formData.personalPhone.trim(),
      formData.personalDob,
      formData.academicInstitution.trim(),
      academicYearNum,
      formData.academicGrade.trim(),
      formData.marksheetPath.trim(),
      formData.photoPath.trim(),
      formData.idProofPath.trim(),
    ];

    if (requiredValues.some((value) => !value)) {
      toast.error('Please complete all admission form fields, including required documents.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (academicYearNum < 1950 || academicYearNum > new Date().getFullYear()) {
      toast.error('Please enter a valid academic passing year.');
      return;
    }

    const warnings = [];
    setSubmitting(true);
    try {
      if (canSyncStudentDetails && studentIdNum) {
        try {
          await API.put(`/students/${studentIdNum}`, {
            name: formData.personalName.trim(),
            email,
            phone: formData.personalPhone.trim(),
            dateOfBirth: formData.personalDob,
          });
        } catch {
          warnings.push('Personal details could not be synced to student profile.');
        }
      }

      const applicationPayload = {
        student: { studentID: studentIdNum },
        course: { courseID: courseIdNum },
        submissionDate: formData.submissionDate,
        status: normalizedStatus,
      };

      let savedApplication = null;
      if (editingApp) {
        const updateRes = await API.put(`/applications/${editingApp.applicationID}`, applicationPayload);
        savedApplication = updateRes?.data || { applicationID: editingApp.applicationID };
      } else {
        const createRes = await API.post('/applications', applicationPayload);
        savedApplication = createRes?.data || null;
      }

      const savedApplicationId = savedApplication?.applicationID || editingApp?.applicationID;
      if (savedApplicationId) {
        setApplicationMeta((prev) => {
          const next = { ...prev };
          if (remarks) {
            next[savedApplicationId] = {
              ...(next[savedApplicationId] || {}),
              remarks,
              savedAt: new Date().toISOString(),
            };
          } else {
            delete next[savedApplicationId];
          }
          return next;
        });
      }

      const academicExists = records.some((record) =>
        toInt(record?.student?.studentID || record?.student?.studentId) === studentIdNum
        && normalizeValue(record.grade) === normalizeValue(formData.academicGrade)
        && toInt(record.year) === academicYearNum
        && normalizeValue(record.institution) === normalizeValue(formData.academicInstitution)
      );

      if (!academicExists) {
        try {
          await API.post('/academic-records', {
            student: { studentID: studentIdNum },
            grade: formData.academicGrade.trim(),
            year: academicYearNum,
            institution: formData.academicInstitution.trim(),
          });
        } catch {
          warnings.push('Academic details could not be saved to records.');
        }
      }

      const documentRows = [
        { type: 'Marksheet', path: formData.marksheetPath.trim() },
        { type: 'Photo', path: formData.photoPath.trim() },
        { type: 'ID Proof', path: formData.idProofPath.trim() },
      ];

      await Promise.all(documentRows.map(async (doc) => {
        const alreadyExists = documents.some((existingDoc) =>
          toInt(existingDoc?.student?.studentID || existingDoc?.student?.studentId) === studentIdNum
          && normalizeValue(existingDoc.documentType) === normalizeValue(doc.type)
          && normalizeValue(existingDoc.filePath) === normalizeValue(doc.path)
        );
        if (alreadyExists) return;

        try {
          await API.post('/documents', {
            student: { studentID: studentIdNum },
            documentType: doc.type,
            filePath: doc.path,
            uploadDate: getTodayIsoDate(),
          });
        } catch {
          warnings.push(`${doc.type} upload entry could not be saved.`);
        }
      }));

      const oldStatus = normalizeStatus(editingApp?.status);
      const statusChanged = editingApp ? oldStatus !== normalizedStatus : true;
      if (statusChanged && canCreateNotification) {
        const notificationStatusText = normalizedStatus.toUpperCase();
        const applicationId = savedApplicationId || 'N/A';
        const notificationMessage = editingApp
          ? `Application #${applicationId} status updated to ${notificationStatusText}.`
          : `Application #${applicationId} submitted successfully. Current status: ${notificationStatusText}.`;
        try {
          await API.post('/notifications', {
            student: { studentID: studentIdNum },
            message: notificationMessage,
            sentDate: getTodayIsoDate(),
          });
        } catch {
          warnings.push('Status notification could not be sent.');
        }
      }

      localStorage.removeItem(draftStorageKey);
      setHasDraft(false);
      toast.success(editingApp ? 'Admission form updated successfully! ✅' : 'Admission form submitted successfully! 🚀');
      if (warnings.length > 0) {
        toast.warn(warnings[0]);
      }
      fetchData();
      closeModal();
    } catch (error) {
      toast.error('Failed to submit admission form.');
    } finally {
      setSubmitting(false);
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

  const getLatestAcademicRecordForStudent = (studentId) => {
    const studentIdNum = toInt(studentId);
    if (!studentIdNum) return null;

    const studentRecords = records
      .filter((record) => toInt(record?.student?.studentID || record?.student?.studentId) === studentIdNum)
      .sort((a, b) => {
        const yearDiff = (toInt(b?.year) || 0) - (toInt(a?.year) || 0);
        if (yearDiff !== 0) return yearDiff;
        return (toInt(b?.recordID || b?.recordId) || 0) - (toInt(a?.recordID || a?.recordId) || 0);
      });
    return studentRecords[0] || null;
  };

  const getDocumentPathForStudent = (studentId, documentType) => {
    const studentIdNum = toInt(studentId);
    if (!studentIdNum) return 'N/A';
    const doc = documents.find((item) =>
      toInt(item?.student?.studentID || item?.student?.studentId) === studentIdNum
      && normalizeValue(item?.documentType) === normalizeValue(documentType)
    );
    return doc?.filePath || 'N/A';
  };

  const downloadApplicationFormPdf = (application) => {
    const applicationId = application?.applicationID || 'N/A';
    const student = application?.student || {};
    const studentId = student?.studentID || student?.studentId;
    const latestRecord = getLatestAcademicRecordForStudent(studentId);
    const status = normalizeStatus(application?.status);

    downloadTextPdf({
      fileName: `application-form-${applicationId}.pdf`,
      title: `Application Form #${applicationId}`,
      lines: [
        `Generated On: ${new Date().toLocaleString()}`,
        '',
        'Personal Details',
        `Student Name: ${student?.name || 'N/A'}`,
        `Email: ${student?.email || 'N/A'}`,
        `Phone: ${student?.phone || 'N/A'}`,
        `Date of Birth: ${student?.dateOfBirth || 'N/A'}`,
        '',
        'Application Details',
        `Course: ${application?.course?.courseName || 'N/A'}`,
        `Submission Date: ${application?.submissionDate || 'N/A'}`,
        `Status: ${status}`,
        '',
        'Academic Details',
        `Institution: ${latestRecord?.institution || 'N/A'}`,
        `Passing Year: ${latestRecord?.year || 'N/A'}`,
        `Grade / CGPA: ${latestRecord?.grade || 'N/A'}`,
        '',
        'Documents',
        `Marksheet: ${getDocumentPathForStudent(studentId, 'Marksheet')}`,
        `Photo: ${getDocumentPathForStudent(studentId, 'Photo')}`,
        `ID Proof: ${getDocumentPathForStudent(studentId, 'ID Proof')}`,
      ],
    });
    toast.success('Application form PDF downloaded.');
  };

  const downloadAdmissionLetter = (application) => {
    const status = normalizeStatus(application?.status);
    if (status !== 'Approved') {
      toast.info('Admission letter is available only for approved applications.');
      return;
    }

    const applicationId = application?.applicationID || 'N/A';
    const studentName = application?.student?.name || 'Student';
    const courseName = application?.course?.courseName || 'selected course';
    const letterDate = getTodayIsoDate();

    downloadTextPdf({
      fileName: `admission-letter-${applicationId}.pdf`,
      title: `Admission Letter #${applicationId}`,
      lines: [
        `Date: ${letterDate}`,
        '',
        `To, ${studentName}`,
        '',
        'Subject: Admission Confirmation',
        '',
        `Congratulations. Your application #${applicationId} has been approved.`,
        `You are offered admission to: ${courseName}.`,
        '',
        'Please complete fee payment and document verification to finalize enrollment.',
        '',
        'Regards,',
        'Admissions Office',
        'AdmitFlow',
      ],
    });
    toast.success('Admission letter downloaded.');
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = normalizeStatus(status);
    const statusClass = normalizedStatus.toLowerCase();
    return (
      <span className={`status-badge ${statusClass}`}>
        <span className="status-dot" />
        {normalizedStatus}
      </span>
    );
  };

  const getApplicationRemarks = (application) => {
    const applicationId = application?.applicationID;
    return application?.remarks
      || application?.remark
      || applicationMeta[applicationId]?.remarks
      || '';
  };

  const handleQuickStatusUpdate = async (application, nextStatus) => {
    if (!canEditApplication) return;
    const confirmed = window.confirm(`Mark application #${application?.applicationID} as ${nextStatus}?`);
    if (!confirmed) return;

    try {
      const payload = {
        student: { studentID: toInt(application?.student?.studentID || application?.student?.studentId) },
        course: { courseID: toInt(application?.course?.courseID || application?.course?.courseId) },
        submissionDate: application?.submissionDate || getTodayIsoDate(),
        status: normalizeStatus(nextStatus),
      };
      await API.put(`/applications/${application.applicationID}`, payload);

      if (canCreateNotification) {
        try {
          await API.post('/notifications', {
            student: { studentID: payload.student.studentID },
            message: `Application #${application.applicationID} status updated to ${normalizeStatus(nextStatus).toUpperCase()}.`,
            sentDate: getTodayIsoDate(),
          });
        } catch {
          // Non-blocking notification failure.
        }
      }

      toast.success(`Application marked as ${normalizeStatus(nextStatus)}.`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update application status.');
    }
  };

  const statusSummary = useMemo(() => {
    const summary = {
      total: visibleApplications.length,
      Pending: 0,
      Approved: 0,
      Rejected: 0,
    };
    visibleApplications.forEach((app) => {
      summary[normalizeStatus(app.status)] += 1;
    });
    return summary;
  }, [visibleApplications]);

  const filteredApplications =
    filter === 'All'
      ? visibleApplications
      : visibleApplications.filter((app) => normalizeStatus(app.status) === filter);

  const latestVisibleApplication = useMemo(() => {
    const copy = [...visibleApplications];
    copy.sort((a, b) => {
      const dateA = new Date(a.submissionDate || 0).getTime();
      const dateB = new Date(b.submissionDate || 0).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return (toInt(b.applicationID) || 0) - (toInt(a.applicationID) || 0);
    });
    return copy[0] || null;
  }, [visibleApplications]);

  const latestStatus = normalizeStatus(latestVisibleApplication?.status);
  const latestProgress = getProgressPercentForStatus(latestStatus);
  const decisionRate = statusSummary.total > 0
    ? Math.round(((statusSummary.Approved + statusSummary.Rejected) / statusSummary.total) * 100)
    : 0;

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
    {
      key: 'remarks',
      label: 'Remarks',
      render: (row) => {
        const remarks = getApplicationRemarks(row);
        return remarks
          ? (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {remarks}
            </span>
          )
          : <span style={{ color: 'var(--text-muted)' }}>-</span>;
      },
    },
    {
      key: 'downloads',
      label: 'Downloads',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            className="btn btn-info btn-icon"
            onClick={() => downloadApplicationFormPdf(row)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="Download Application Form PDF"
          >
            <FiDownload size={14} />
          </motion.button>
          <motion.button
            className="btn btn-secondary btn-icon"
            onClick={() => downloadAdmissionLetter(row)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            title="Download Admission Letter"
          >
            <FiFileText size={14} />
          </motion.button>
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
          <h1>Admission Forms</h1>
          <p>{isStudentUser ? 'Fill, save draft, and submit your admission form' : 'Track and manage admission forms'}</p>
        </motion.div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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

          {hasDraft && (
            <motion.button
              className="btn btn-secondary"
              onClick={loadDraft}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <FiFileText /> Load Draft
            </motion.button>
          )}

          {canCreateApplication && (
            <motion.button
              className="btn btn-primary"
              onClick={openCreateModal}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FiPlus /> New Admission Form
            </motion.button>
          )}
        </div>
      </div>

      {isStudentUser && applications.length > 0 && visibleApplications.length === 0 && (
        <div className="table-container" style={{ marginBottom: 20 }}>
          <div className="empty-state" style={{ padding: 20 }}>
            <h3>No linked applications found</h3>
            <p>Your account is signed in as a student, but no matching applications were found.</p>
          </div>
        </div>
      )}

      <div className="table-container" style={{ marginBottom: 20, padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Admission Progress Tracking</h3>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
            Status overview for Pending, Approved, and Rejected applications
          </p>
        </div>
        <div className="stats-grid" style={{ marginBottom: 14 }}>
          <div className="stat-card gradient-1">
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pending</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{statusSummary.Pending}</div>
          </div>
          <div className="stat-card gradient-4">
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Approved</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{statusSummary.Approved}</div>
          </div>
          <div className="stat-card gradient-2">
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Rejected</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{statusSummary.Rejected}</div>
          </div>
          <div className="stat-card gradient-3">
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Decision Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{decisionRate}%</div>
          </div>
        </div>
        {isStudentUser && latestVisibleApplication && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Latest Application Progress</div>
              <span className={`status-badge ${latestStatus.toLowerCase()}`}>
                <span className="status-dot" />
                {latestStatus}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 10,
                borderRadius: 999,
                background: 'rgba(148, 163, 184, 0.18)',
                overflow: 'hidden',
              }}
            >
              <motion.div
                style={{
                  height: '100%',
                  borderRadius: 999,
                  background: latestStatus === 'Rejected' ? '#ef4444' : 'var(--gradient-1)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${latestProgress}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
        )}
      </div>

      <AnimatedTable
        title={`${isStudentUser ? 'My Admission Forms' : 'Admission Forms'} (${filteredApplications.length})`}
        columns={columns}
        data={filteredApplications}
        actions={canManageApplications ? ((row) => (
          <div style={{ display: 'flex', gap: 8 }}>
            {canEditApplication && normalizeStatus(row.status) !== 'Approved' && (
              <motion.button
                className="btn btn-success btn-icon"
                onClick={() => handleQuickStatusUpdate(row, 'Approved')}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                title="Approve Application"
              >
                <FiCheck size={14} />
              </motion.button>
            )}
            {canEditApplication && normalizeStatus(row.status) !== 'Rejected' && (
              <motion.button
                className="btn btn-danger btn-icon"
                onClick={() => handleQuickStatusUpdate(row, 'Rejected')}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                title="Reject Application"
              >
                <FiX size={14} />
              </motion.button>
            )}
            {canEditApplication && (
              <motion.button
                className="btn btn-secondary btn-icon"
                onClick={() => openEditModal(row)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiEdit2 size={15} />
              </motion.button>
            )}
            {canDeleteApplication && (
              <motion.button
                className="btn btn-danger btn-icon"
                onClick={() => handleDelete(row.applicationID)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiTrash2 size={15} />
              </motion.button>
            )}
          </div>
        )) : null}
      />

      {(canCreateApplication || canEditApplication) && (
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={editingApp ? 'Edit Admission Form' : 'Fill Admission Form'}
          footer={
            <>
              <motion.button
                className="btn btn-secondary"
                onClick={loadDraft}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiFileText /> Load Draft
              </motion.button>
              <motion.button
                className="btn btn-secondary"
                onClick={saveDraft}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiSave /> Save Draft
              </motion.button>
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <motion.button
                className="btn btn-primary"
                onClick={handleSubmit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : (editingApp ? 'Update Form' : 'Submit Form')}
              </motion.button>
            </>
          }
        >
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
            <div className="form-group">
              <label className="form-label">Student</label>
              <select
                className="form-select"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                disabled={isStudentUser}
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
              <label className="form-label">Course</label>
              <select
                className="form-select"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.courseID} value={course.courseID}>
                    {course.courseName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Submission Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={formData.submissionDate}
                  onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isStudentUser}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Add review remarks (optional)"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                style={{ resize: 'vertical', minHeight: 86 }}
              />
            </div>

            <div className="divider" />
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem' }}>Personal Details</h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter full name"
                value={formData.personalName}
                onChange={(e) => setFormData({ ...formData, personalName: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.personalEmail}
                  onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter phone number"
                  value={formData.personalPhone}
                  onChange={(e) => setFormData({ ...formData, personalPhone: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                className="form-input"
                type="date"
                value={formData.personalDob}
                onChange={(e) => setFormData({ ...formData, personalDob: e.target.value })}
              />
            </div>

            <div className="divider" />
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem' }}>Academic Details</h3>
            <div className="form-group">
              <label className="form-label">Institution</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter school/college name"
                value={formData.academicInstitution}
                onChange={(e) => setFormData({ ...formData, academicInstitution: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Passing Year</label>
                <input
                  className="form-input"
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  placeholder="e.g. 2024"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Grade / Percentage / CGPA</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. 86% or 8.4 CGPA"
                  value={formData.academicGrade}
                  onChange={(e) => setFormData({ ...formData, academicGrade: e.target.value })}
                />
              </div>
            </div>

            <div className="divider" />
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem' }}>Upload Documents</h3>

            <div className="form-group">
              <label className="form-label">Marksheet</label>
              <input
                className="form-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleDocumentFileChange('marksheetPath', e)}
              />
              <input
                className="form-input"
                style={{ marginTop: 8 }}
                type="text"
                placeholder="/uploads/marksheet.pdf"
                value={formData.marksheetPath}
                onChange={(e) => setFormData({ ...formData, marksheetPath: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Photo</label>
              <input
                className="form-input"
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => handleDocumentFileChange('photoPath', e)}
              />
              <input
                className="form-input"
                style={{ marginTop: 8 }}
                type="text"
                placeholder="/uploads/photo.jpg"
                value={formData.photoPath}
                onChange={(e) => setFormData({ ...formData, photoPath: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ID Proof</label>
              <input
                className="form-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleDocumentFileChange('idProofPath', e)}
              />
              <input
                className="form-input"
                style={{ marginTop: 8 }}
                type="text"
                placeholder="/uploads/id-proof.pdf"
                value={formData.idProofPath}
                onChange={(e) => setFormData({ ...formData, idProofPath: e.target.value })}
              />
            </div>

            {hasDraft && (
              <div style={{ marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={clearDraft} type="button">
                  Clear Saved Draft
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageTransition>
  );
};

export default Applications;
