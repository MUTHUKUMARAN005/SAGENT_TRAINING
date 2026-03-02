import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ message = 'Loading data...' }) => (
  <div className="loading-container">
    <div style={{ position: 'relative', width: 60, height: 60 }}>
      <motion.div
        style={{
          width: 60,
          height: 60,
          border: '3px solid var(--dark-3)',
          borderTop: '3px solid var(--primary)',
          borderRadius: '50%',
          position: 'absolute',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--dark-3)',
          borderBottom: '3px solid var(--secondary)',
          borderRadius: '50%',
          position: 'absolute',
          top: 10,
          left: 10,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{ color: 'var(--gray)', fontSize: '0.9rem', marginTop: 8 }}
    >
      {message}
    </motion.p>
  </div>
);

export default LoadingSpinner;