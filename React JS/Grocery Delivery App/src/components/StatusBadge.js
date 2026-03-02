import React from 'react';
import { motion } from 'framer-motion';
import { getStatusColor } from '../utils/formatters';

const StatusBadge = ({ status, pulse = false, icon }) => {
  const colorClass = getStatusColor(status);

  return (
    <motion.span
      className={`status-badge ${colorClass}`}
      animate={
        pulse
          ? { scale: [1, 1.05, 1] }
          : {}
      }
      transition={pulse ? { repeat: Infinity, duration: 2 } : {}}
    >
      {icon && <span>{icon}</span>}
      {status?.replace(/_/g, ' ')}
    </motion.span>
  );
};

export default StatusBadge;