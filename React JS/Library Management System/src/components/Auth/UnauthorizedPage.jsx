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
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '22px',
      padding: '20px'
    }}>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 18 }}
        style={{
          width: '102px',
          height: '102px',
          background: 'rgba(239, 68, 68, 0.14)',
          border: '1px solid rgba(248, 113, 113, 0.35)',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 800,
          color: '#fda4a4'
        }}
      >
        403
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ textAlign: 'center', maxWidth: '470px' }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', color: '#f3f8ff' }}>
          Access Denied
        </h1>
        <p style={{ color: '#afc1d7', fontSize: '14px', lineHeight: 1.65 }}>
          You do not have permission to access this page.
          {user && (
            <span> Current role: <RoleBadge role={user.role} /></span>
          )}
        </p>
      </motion.div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5a4, #3b82f6)',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Go to Dashboard
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            background: 'rgba(157, 181, 209, 0.12)',
            border: '1px solid rgba(157, 181, 209, 0.25)',
            color: '#afc1d7',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Go Back
        </motion.button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
