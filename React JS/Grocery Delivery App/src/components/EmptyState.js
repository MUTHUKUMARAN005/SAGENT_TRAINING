import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon = '📭', title, message, action }) => (
  <motion.div
    className="empty-state"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <motion.div
      className="empty-state-icon"
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
    >
      {icon}
    </motion.div>
    <h3>{title || 'No data found'}</h3>
    <p>{message || 'There are no records to display.'}</p>
    {action && <div style={{ marginTop: 20 }}>{action}</div>}
  </motion.div>
);

export default EmptyState;