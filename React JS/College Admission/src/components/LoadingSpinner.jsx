import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="spinner"
      />
      <div className="loading-dots">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{
              scale: [0, 1, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              delay: i * 0.16,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{ color: 'var(--text-muted)' }}
      >
        Loading data...
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;