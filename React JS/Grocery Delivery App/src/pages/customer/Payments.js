import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { FiCreditCard, FiDollarSign } from 'react-icons/fi';
import AnimatedCard from '../../components/common/AnimatedCard';
import { AnimatedRow, AnimatedTableContainer } from '../../components/common/AnimatedTable';
import { useOrders } from '../../context/OrderContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import './Payments.css';

const paymentIcons = { 'UPI': '📱', 'Credit Card': '💳', 'Debit Card': '💳', 'Cash on Delivery': '💰' };

const Payments = () => {
  const { payments, paymentSummary } = useOrders();

  return (
    <div className="customer-payments-page">
      <div className="customer-payments-shell">
        <div className="customer-payments-head">
          <h1>💳 Payment History</h1>
          <p>Online payments, COD, status updates, and refunds</p>
        </div>

        <div className="customer-payments-stats">
          <AnimatedCard delay={0} className="customer-pay-stat">
            <div className="customer-pay-stat-icon green"><FiDollarSign /></div>
            <h3>Total Paid</h3>
            <div className="value">{formatCurrency(paymentSummary.completedAmount)}</div>
          </AnimatedCard>
          <AnimatedCard delay={0.1} className="customer-pay-stat">
            <div className="customer-pay-stat-icon blue"><FiCreditCard /></div>
            <h3>Transactions</h3>
            <div className="value">{paymentSummary.totalPayments}</div>
          </AnimatedCard>
          <AnimatedCard delay={0.2} className="customer-pay-stat">
            <div className="customer-pay-stat-icon orange"><FiCreditCard /></div>
            <h3>Pending</h3>
            <div className="value">{paymentSummary.pendingCount}</div>
          </AnimatedCard>
        </div>

        <AnimatedTableContainer title="Payment Records">
          <table className="data-table customer-payments-table">
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
                    <td>Order #{payment.orderId}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {paymentIcons[payment.paymentMethod] || '💳'} {payment.paymentMethod}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(payment.amount)}</td>
                    <td>
                      <span className={`status-badge ${payment.paymentStatus?.toLowerCase()}`}>
                        {payment.paymentStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>
                      {payment.transactionId}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {formatDateTime(payment.paymentDate)}
                    </td>
                  </AnimatedRow>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </AnimatedTableContainer>
      </div>
    </div>
  );
};

export default Payments;
