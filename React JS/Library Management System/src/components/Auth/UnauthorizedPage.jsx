// src/components/Auth/UnauthorizedPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import RoleBadge from '../Common/RoleBadge';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a', flexDirection: 'column', gap: '24px', padding: '20px'
    }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={{
          width: '100px', height: '100px',
          background: 'rgba(239,68,68,0.12)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '48px'
        }}
      >
        <motion.span animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}>
          🚫
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px',
          background: 'linear-gradient(135deg, #ef4444, #f97316)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Access Denied
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '400px', lineHeight: 1.6 }}>
          You don't have permission to access this page.
          {user && (
            <span> Your current role is <RoleBadge role={user.role} />.</span>
          )}
        </p>
      </motion.div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          style={{
            padding: '12px 28px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', color: 'white', fontSize: '14px',
            fontWeight: 600, cursor: 'pointer'
          }}
        >
          🏠 Go to Dashboard
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 28px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', fontSize: '14px',
            fontWeight: 600, cursor: 'pointer'
          }}
        >
          ← Go Back
        </motion.button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;