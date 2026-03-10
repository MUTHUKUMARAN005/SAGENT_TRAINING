import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiDownload, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { filterRecordsForUser, isStudentRoleUser } from '../utils/ownership';
import { downloadTextPdf } from '../utils/pdf';

const FEE_TYPES = ['Application Fee', 'Admission Fee'];
const DEFAULT_FEE_AMOUNTS = {
  'Application Fee': 1500,
  'Admission Fee': 25000,
};

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const toInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeStatus = (value) => String(value ?? '').trim().toLowerCase();

const getPaymentId = (payment) => toInt(
  payment?.paymentID
  || payment?.paymentId
  || payment?.id
);

const getPaymentMetaStorageKey = (user) => {
  const userKey = user?.userID
    || user?.userId
    || user?.id
    || user?.username
    || user?.email
    || 'anonymous';
  return `payment_meta_${String(userKey).toLowerCase()}`;
};

const buildReceiptNumber = (paymentId) =>
  `RCPT-${String(paymentId || Date.now()).padStart(6, '0')}`;

const Payments = () => {
  const { user, hasPermission } = useAuth();
  const [payments, setPayments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMeta, setPaymentMeta] = useState({});
  const [feeFilter, setFeeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    applicationId: '',
    feeType: 'Application Fee',
    amount: String(DEFAULT_FEE_AMOUNTS['Application Fee']),
    paymentDate: getTodayIsoDate(),
    paymentMethodId: '',
  });
  const isStudentUser = isStudentRoleUser(user);
  const canCreatePayment = hasPermission('PAYMENT_CREATE');
  const canDeletePayment = hasPermission('PAYMENT_DELETE');
  const paymentMetaStorageKey = useMemo(() => getPaymentMetaStorageKey(user), [user]);
  const visibleApplications = filterRecordsForUser(applications, user, (app) => app?.student);
  const visiblePayments = filterRecordsForUser(payments, user, (payment) => payment?.application?.student);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(paymentMetaStorageKey);
      if (!stored) {
        setPaymentMeta({});
        return;
      }
      const parsed = JSON.parse(stored);
      setPaymentMeta(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setPaymentMeta({});
    }
  }, [paymentMetaStorageKey]);

  useEffect(() => {
    localStorage.setItem(paymentMetaStorageKey, JSON.stringify(paymentMeta));
  }, [paymentMeta, paymentMetaStorageKey]);

  const getFeeTypeForPayment = useCallback((payment) => {
    const backendFeeType = String(payment?.feeType || payment?.paymentType || '').trim();
    if (FEE_TYPES.includes(backendFeeType)) return backendFeeType;
    const paymentId = getPaymentId(payment);
    if (paymentId && paymentMeta[paymentId]?.feeType) return paymentMeta[paymentId].feeType;
    return 'Uncategorized';
  }, [paymentMeta]);

  const getReceiptNumberForPayment = useCallback((payment) => {
    const paymentId = getPaymentId(payment);
    if (payment?.receiptNumber) return payment.receiptNumber;
    if (paymentId && paymentMeta[paymentId]?.receiptNumber) return paymentMeta[paymentId].receiptNumber;
    return buildReceiptNumber(paymentId);
  }, [paymentMeta]);

  const enhancedPayments = useMemo(() => {
    const rows = visiblePayments.map((payment) => ({
      ...payment,
      _feeType: getFeeTypeForPayment(payment),
      _receiptNumber: getReceiptNumberForPayment(payment),
    }));

    rows.sort((a, b) => {
      const dateA = new Date(a.paymentDate || 0).getTime();
      const dateB = new Date(b.paymentDate || 0).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return (getPaymentId(b) || 0) - (getPaymentId(a) || 0);
    });
    return rows;
  }, [visiblePayments, getFeeTypeForPayment, getReceiptNumberForPayment]);

  const filteredPayments = useMemo(() => {
    if (feeFilter === 'All') return enhancedPayments;
    return enhancedPayments.filter((payment) => payment._feeType === feeFilter);
  }, [enhancedPayments, feeFilter]);

  const paymentStats = useMemo(() => {
    return enhancedPayments.reduce((acc, payment) => {
      const amount = toNumber(payment.amount);
      acc.total += amount;
      if (payment._feeType === 'Application Fee') acc.application += amount;
      if (payment._feeType === 'Admission Fee') acc.admission += amount;
      return acc;
    }, { total: 0, application: 0, admission: 0 });
  }, [enhancedPayments]);

  const resetFormData = () => {
    setFormData({
      applicationId: '',
      feeType: 'Application Fee',
      amount: String(DEFAULT_FEE_AMOUNTS['Application Fee']),
      paymentDate: getTodayIsoDate(),
      paymentMethodId: '',
    });
  };

  const fetchData = async () => {
    try {
      const [paymentsRes, appsRes, methodsRes] = await Promise.all([
        API.get('/payments'),
        API.get('/applications'),
        API.get('/payment-methods'),
      ]);
      const loadedPayments = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      setPayments(loadedPayments);
      setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      setPaymentMethods(Array.isArray(methodsRes.data) ? methodsRes.data : []);
      return loadedPayments;
    } catch (error) {
      toast.error('Failed to load payments');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const selectedApplication = visibleApplications.find(
      (application) => String(application.applicationID) === String(formData.applicationId)
    );
    const amount = toNumber(formData.amount);
    const paymentMethodId = toInt(formData.paymentMethodId);
    const applicationId = toInt(formData.applicationId);

    if (!applicationId || !paymentMethodId || !formData.paymentDate || !formData.feeType || amount <= 0) {
      toast.error('Please complete all payment fields.');
      return;
    }

    if (
      formData.feeType === 'Admission Fee'
      && normalizeStatus(selectedApplication?.status) !== 'approved'
    ) {
      toast.error('Admission fee can be recorded only for approved applications.');
      return;
    }

    try {
      const payload = {
        application: { applicationID: applicationId },
        amount,
        paymentDate: formData.paymentDate,
        paymentMethod: { paymentMethodID: paymentMethodId },
      };
      const createRes = await API.post('/payments', payload);
      const refreshedPayments = await fetchData();

      let createdPaymentId = getPaymentId(createRes?.data);
      if (!createdPaymentId) {
        const sameRows = refreshedPayments.filter((payment) =>
          toInt(payment?.application?.applicationID) === applicationId
          && Math.abs(toNumber(payment?.amount) - amount) < 0.0001
          && String(payment?.paymentDate || '') === String(formData.paymentDate || '')
          && toInt(payment?.paymentMethod?.paymentMethodID) === paymentMethodId
        );
        const mostRecentMatch = sameRows.sort((a, b) => (getPaymentId(b) || 0) - (getPaymentId(a) || 0))[0];
        createdPaymentId = getPaymentId(mostRecentMatch);
      }

      if (createdPaymentId) {
        setPaymentMeta((prev) => ({
          ...prev,
          [createdPaymentId]: {
            feeType: formData.feeType,
            receiptNumber: prev[createdPaymentId]?.receiptNumber || buildReceiptNumber(createdPaymentId),
            savedAt: new Date().toISOString(),
          },
        }));
      }

      toast.success('Payment recorded! 💰');
      setModalOpen(false);
      resetFormData();
    } catch (error) {
      toast.error('Failed to create payment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this payment record?')) {
      try {
        await API.delete(`/payments/${id}`);
        setPaymentMeta((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        toast.success('Payment deleted!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const downloadReceipt = (payment) => {
    const feeType = payment._feeType;
    const receiptNumber = payment._receiptNumber;
    const amount = toNumber(payment.amount).toFixed(2);
    const applicationId = payment?.application?.applicationID || 'N/A';
    const studentName = payment?.application?.student?.name || 'N/A';
    const method = payment?.paymentMethod?.methodName || 'N/A';
    const paymentDate = payment?.paymentDate || 'N/A';

    downloadTextPdf({
      fileName: `${receiptNumber}.pdf`,
      title: 'AdmitFlow Payment Receipt',
      lines: [
        `Receipt No: ${receiptNumber}`,
        `Payment ID: ${getPaymentId(payment) || 'N/A'}`,
        `Student: ${studentName}`,
        `Application ID: #${applicationId}`,
        `Fee Type: ${feeType}`,
        `Amount: INR ${amount}`,
        `Method: ${method}`,
        `Payment Date: ${paymentDate}`,
        `Generated On: ${new Date().toLocaleString()}`,
      ],
    });
    toast.success('Receipt downloaded.');
  };

  const columns = [
    { key: 'paymentID', label: 'ID' },
    {
      key: 'feeType',
      label: 'Fee Type',
      render: (row) => (
        <motion.span
          className={`status-badge ${row._feeType === 'Admission Fee' ? 'approved' : 'pending'}`}
          whileHover={{ scale: 1.05 }}
        >
          <span className="status-dot" />
          {row._feeType}
        </motion.span>
      ),
    },
    {
      key: 'application',
      label: 'Application',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--gradient-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            #{row.application?.applicationID || '?'}
          </motion.div>
          <span>{row.application?.student?.name || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 700,
            color: 'var(--success)',
            fontSize: '1rem',
          }}
          whileHover={{ scale: 1.05 }}
        >
          ₹{toNumber(row.amount).toFixed(2)}
        </motion.div>
      ),
    },
    {
      key: 'paymentDate',
      label: 'Date',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiCalendar size={14} color="var(--accent)" />
          {row.paymentDate}
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (row) => (
        <motion.span className="status-badge under-review" whileHover={{ scale: 1.05 }}>
          <span className="status-dot" />
          {row.paymentMethod?.methodName || 'N/A'}
        </motion.span>
      ),
    },
    {
      key: 'receipt',
      label: 'Receipt',
      render: (row) => (
        <motion.button
          className="btn btn-info btn-icon"
          onClick={() => downloadReceipt(row)}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.95 }}
          title={`Download ${row._receiptNumber}`}
        >
          <FiDownload size={14} />
        </motion.button>
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
          <h1>💳 Payments</h1>
          <p>{isStudentUser ? 'View your payment history and receipts' : 'Manage fees, payment history, and receipts'}</p>
        </motion.div>
        {canCreatePayment && (
          <motion.button
            className="btn btn-primary"
            onClick={() => {
              resetFormData();
              setModalOpen(true);
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <FiPlus /> Record Payment
          </motion.button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <motion.div
          className="stat-card gradient-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Revenue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
              ₹{paymentStats.total.toFixed(2)}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card gradient-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5 }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Application Fee Collected</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{paymentStats.application.toFixed(2)}</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card gradient-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Admission Fee Collected</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{paymentStats.admission.toFixed(2)}</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card gradient-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -5 }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payment History Count</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{enhancedPayments.length}</div>
          </div>
        </motion.div>
      </div>

      <AnimatedTable
        title={`${isStudentUser ? 'My Payment History' : 'Payment History'} (${filteredPayments.length})`}
        columns={columns}
        data={filteredPayments}
        headerActions={(
          <select
            className="form-select"
            style={{ minWidth: 190 }}
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value)}
          >
            <option value="All">All Fee Types</option>
            <option value="Application Fee">Application Fee</option>
            <option value="Admission Fee">Admission Fee</option>
            <option value="Uncategorized">Uncategorized</option>
          </select>
        )}
        actions={canDeletePayment ? ((row) => (
          <motion.button
            className="btn btn-danger btn-icon"
            onClick={() => handleDelete(row.paymentID)}
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiTrash2 size={15} />
          </motion.button>
        )) : null}
      />

      {canCreatePayment && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Record New Payment"
          footer={(
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <motion.button
                className="btn btn-success"
                onClick={handleSubmit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                💰 Record Payment
              </motion.button>
            </>
          )}
        >
          <div className="form-group">
            <label className="form-label">Application</label>
            <select
              className="form-select"
              value={formData.applicationId}
              onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
            >
              <option value="">Select Application</option>
              {visibleApplications.map((application) => (
                <option key={application.applicationID} value={application.applicationID}>
                  #{application.applicationID} - {application.student?.name || 'Unknown'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fee Type</label>
            <select
              className="form-select"
              value={formData.feeType}
              onChange={(e) => {
                const nextFeeType = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  feeType: nextFeeType,
                  amount: String(DEFAULT_FEE_AMOUNTS[nextFeeType] || prev.amount),
                }));
              }}
            >
              <option value="Application Fee">Application Fee</option>
              <option value="Admission Fee">Admission Fee</option>
            </select>
            <div className="form-helper">
              Suggested amount: ₹{DEFAULT_FEE_AMOUNTS[formData.feeType] || 0}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Date</label>
            <input
              className="form-input"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select
              className="form-select"
              value={formData.paymentMethodId}
              onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
            >
              <option value="">Select Method</option>
              {paymentMethods.map((method) => (
                <option key={method.paymentMethodID} value={method.paymentMethodID}>
                  {method.methodName}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}
    </PageTransition>
  );
};

export default Payments;
