import React from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/common/PageWrapper';
import { useAuth } from '../../context/AuthContext';

const DeliveryDashboard = () => {
  const { user } = useAuth();

  return (
    <PageWrapper>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
          🚚 Delivery Dashboard
        </h1>
        <p style={{ color: '#94a3b8' }}>Welcome, {user?.name} — {user?.vehicleType}</p>
      </motion.div>
    </PageWrapper>
  );
};

export default DeliveryDashboard;