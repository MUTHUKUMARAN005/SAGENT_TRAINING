import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiUser, FiStar } from 'react-icons/fi';
import PageWrapper from '../../components/common/PageWrapper';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { getCustomers } from '../../api/api';
import toast from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await getCustomers();
        setCustomers(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (loading) return <LoadingSpinner message="Loading customers..." />;

  return (
    <PageWrapper>
      <div className="page-header">
        <h1>👥 Customers</h1>
        <p>Admin monitor for all registered customers</p>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Customer records will appear here after users register as customers."
        />
      ) : (
        <div className="cards-grid">
          {customers.map((customer, index) => (
            <motion.div
              key={customer.customerId || customer.id || customer.email || index}
              className="stat-card blue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -4 }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                  marginBottom: 12,
                }}
              >
                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>

              <h3 style={{ marginBottom: 8 }}>{customer.name || 'Customer'}</h3>

              <div style={{ display: 'grid', gap: 6, color: '#94a3b8', fontSize: '0.85rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiUser size={14} /> ID: {customer.customerId ?? customer.id ?? 'N/A'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiMail size={14} /> {customer.email || 'N/A'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiPhone size={14} /> {customer.phone || 'N/A'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FiStar size={14} /> Loyalty: {customer.loyaltyPoints ?? 0}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};

export default Customers;
