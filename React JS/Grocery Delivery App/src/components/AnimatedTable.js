import React from 'react';
import { motion } from 'framer-motion';

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

export const AnimatedRow = ({ children, index, onClick, ...props }) => (
  <motion.tr
    custom={index}
    variants={rowVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    whileHover={{
      backgroundColor: 'rgba(99, 102, 241, 0.04)',
    }}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
    layout
    {...props}
  >
    {children}
  </motion.tr>
);

export const AnimatedTableContainer = ({ title, action, children, subtitle }) => (
  <motion.div
    className="data-table-container"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.15 }}
  >
    <div className="data-table-header">
      <div>
        <h2>{title}</h2>
        {subtitle && (
          <p style={{ fontSize: '0.82rem', color: 'var(--gray)', marginTop: 4 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="toolbar">{action}</div>
    </div>
    {children}
  </motion.div>
);