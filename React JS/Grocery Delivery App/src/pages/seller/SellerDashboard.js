import React from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/common/PageWrapper';
import { useAuth } from '../../context/AuthContext';

const SellerDashboard = () => {
  const { user } = useAuth();

  return (
    <PageWrapper>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
          🏪 Seller Dashboard
        </h1>
        <p style={{ color: '#94a3b8' }}>Welcome, {user?.name} — {user?.storeName}</p>
      </motion.div>
      {/* Add seller-specific stats, charts, recent orders */}
    </PageWrapper>
  );
};

export default SellerDashboard;