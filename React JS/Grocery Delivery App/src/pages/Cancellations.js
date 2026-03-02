import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiXCircle, FiAlertCircle } from 'react-icons/fi';
import PageWrapper from '../components/PageWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { AnimatedRow, AnimatedTableContainer } from '../components/AnimatedTable';
import { getCancellations } from '../api/api';
import toast from 'react-hot-toast';

const Cancellations = () => {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { const res = await getCancellations(); setCancellations(res.data); }
      catch (err) { toast.error('Failed'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>❌ Cancellations</h1>
        <p>Review order cancellations and refund status</p>
      </div>

      {/* Summary Cards */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 30 }}>
        {['PENDING', 'PROCESSED', 'COMPLETED'].map((status, i) => {
          const count = cancellations.filter(c => c.refundStatus === status).length;
          const colors = ['orange', 'blue', 'green'];
          return (
            <motion.div key={status}
              className={`stat-card ${colors[i]}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <h3>{status} Refunds</h3>
              <div className="value">{count}</div>
            </motion.div>
          );
        })}
      </div>

      <AnimatedTableContainer title={`Cancellation Records (${cancellations.length})`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Order</th><th>Cancelled By</th>
              <th>Reason</th><th>Date</th><th>Refund Status</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {cancellations.map((c, i) => (
                <AnimatedRow key={c.cancellationId} index={i}>
                  <td><strong>#{c.cancellationId}</strong></td>
                  <td>Order #{c.order?.orderId}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiAlertCircle size={14} color="#f59e0b" />
                      {c.cancelledBy}
                    </div>
                  </td>
                  <td style={{ maxWidth: 250, fontSize: '0.85rem', color: '#94a3b8' }}>{c.reason}</td>
                  <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{c.cancelledAt?.substring(0, 16)}</td>
                  <td>
                    <motion.span
                      className={`status-badge ${c.refundStatus?.toLowerCase()}`}
                      animate={c.refundStatus === 'PENDING' ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      {c.refundStatus === 'PENDING' && '⏳'}
                      {c.refundStatus === 'PROCESSED' && '🔄'}
                      {c.refundStatus === 'COMPLETED' && '✅'}
                      {' '}{c.refundStatus}
                    </motion.span>
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

export default Cancellations;