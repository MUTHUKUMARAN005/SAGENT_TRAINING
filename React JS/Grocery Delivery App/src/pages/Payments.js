import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCreditCard, FiDollarSign } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedCard from '../components/AnimatedCard';
import { AnimatedRow, AnimatedTableContainer } from '../components/AnimatedTable';
import { getPayments } from '../api/api';
import toast from 'react-hot-toast';

const paymentIcons = { 'UPI': '📱', 'Credit Card': '💳', 'Debit Card': '💳', 'Cash on Delivery': '💰' };

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { const res = await getPayments(); setPayments(res.data); }
      catch (err) { toast.error('Failed to load payments'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalCompleted = payments.filter(p => p.paymentStatus === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>💳 Payments</h1>
        <p>Track all payment transactions</p>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 30 }}>
        <AnimatedCard delay={0} className="stat-card green">
          <div className="stat-card-icon green"><FiDollarSign /></div>
          <h3>Total Collected</h3>
          <div className="value">₹{totalCompleted.toFixed(2)}</div>
        </AnimatedCard>
        <AnimatedCard delay={0.1} className="stat-card blue">
          <div className="stat-card-icon blue"><FiCreditCard /></div>
          <h3>Total Transactions</h3>
          <div className="value">{payments.length}</div>
        </AnimatedCard>
        <AnimatedCard delay={0.2} className="stat-card orange">
          <div className="stat-card-icon orange"><FiCreditCard /></div>
          <h3>Pending</h3>
          <div className="value">{payments.filter(p => p.paymentStatus === 'PENDING').length}</div>
        </AnimatedCard>
      </div>

      <AnimatedTableContainer title="Payment Records">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Order</th><th>Method</th>
              <th>Amount</th><th>Status</th><th>Transaction ID</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {payments.map((payment, i) => (
                <AnimatedRow key={payment.paymentId} index={i}>
                  <td><strong>#{payment.paymentId}</strong></td>
                  <td>Order #{payment.order?.orderId}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {paymentIcons[payment.paymentMethod] || '💳'} {payment.paymentMethod}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>₹{payment.amount}</td>
                  <td>
                    <span className={`status-badge ${payment.paymentStatus?.toLowerCase()}`}>
                      {payment.paymentStatus}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                    {payment.transactionId}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    {payment.paymentDate?.substring(0, 16)}
                  </td>
                </AnimatedRow>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </AnimatedTableContainer>
    </PageWrapper>
  );
};

export default Payments;