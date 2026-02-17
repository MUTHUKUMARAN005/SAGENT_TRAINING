import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import PageTransition from '../components/PageTransition';
import AnimatedTable from '../components/AnimatedTable';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    applicationId: '',
    amount: '',
    paymentDate: '',
    paymentMethodId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, appsRes, methodsRes] = await Promise.all([
        API.get('/payments'),
        API.get('/applications'),
        API.get('/payment-methods'),
      ]);
      setPayments(paymentsRes.data);
      setApplications(appsRes.data);
      setPaymentMethods(methodsRes.data);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        application: { applicationID: parseInt(formData.applicationId) },
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: { paymentMethodID: parseInt(formData.paymentMethodId) },
      };
      await API.post('/payments', payload);
      toast.success('Payment recorded! 💰');
      fetchData();
      setModalOpen(false);
      setFormData({ applicationId: '', amount: '', paymentDate: '', paymentMethodId: '' });
    } catch (error) {
      toast.error('Failed to create payment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this payment record?')) {
      try {
        await API.delete(`/payments/${id}`);
        toast.success('Payment deleted!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const columns = [
    { key: 'paymentID', label: 'ID' },
    {
      key: 'application',
      label: 'Application',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--gradient-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.75rem',
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
            display: 'flex', alignItems: 'center', gap: 6,
            fontWeight: 700, color: 'var(--success)',
            fontSize: '1rem',
          }}
          whileHover={{ scale: 1.05 }}
        >
          <FiDollarSign size={16} />
          {parseFloat(row.amount).toFixed(2)}
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
        <motion.span
          className="status-badge under-review"
          whileHover={{ scale: 1.05 }}
        >
          <span className="status-dot" />
          {row.paymentMethod?.methodName || 'N/A'}
        </motion.span>
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
          <p>Track all payment transactions and records</p>
        </motion.div>
        <motion.button
          className="btn btn-primary"
          onClick={() => {
            setFormData({ applicationId: '', amount: '', paymentDate: '', paymentMethodId: '' });
            setModalOpen(true);
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <FiPlus /> Record Payment
        </motion.button>
      </div>

      {/* Payment Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <motion.div
          className="stat-card gradient-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FiDollarSign color="#10b981" size={28} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Revenue</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
                ${payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2)}
              </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FiCalendar color="#6366f1" size={28} />
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Transactions</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {payments.length}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatedTable
        title={`Payment Records (${payments.length})`}
        columns={columns}
        data={payments}
        actions={(row) => (
          <motion.button
            className="btn btn-danger btn-icon"
            onClick={() => handleDelete(row.paymentID)}
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
        title="Record New Payment"
        footer={
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
        }
      >
        <div className="form-group">
          <label className="form-label">Application</label>
          <select
            className="form-select"
            value={formData.applicationId}
            onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
          >
            <option value="">Select Application</option>
            {applications.map((a) => (
              <option key={a.applicationID} value={a.applicationID}>
                #{a.applicationID} - {a.student?.name || 'Unknown'}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Amount ($)</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
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
            {paymentMethods.map((m) => (
              <option key={m.paymentMethodID} value={m.paymentMethodID}>
                {m.methodName}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default Payments;