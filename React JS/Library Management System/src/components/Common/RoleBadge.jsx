// src/components/Common/RoleBadge.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ROLE_CONFIG } from '../../auth/permissions';

const RoleBadge = ({ role, size = 'sm' }) => {
  const config = ROLE_CONFIG[role];
  if (!config) return null;

  const padding = size === 'lg' ? '6px 16px' : '3px 12px';
  const fontSize = size === 'lg' ? '13px' : '11px';

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.04 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding,
        borderRadius: '999px',
        fontSize,
        fontWeight: 700,
        background: `${config.color}14`,
        color: '#d9e7f7',
        border: `1px solid ${config.color}38`,
        letterSpacing: '0.04em'
      }}
    >
      <span style={{ fontSize: size === 'lg' ? '10px' : '9px', color: config.color, fontWeight: 800 }}>{config.icon}</span>
      <span>{config.label}</span>
    </motion.span>
  );
};

export default RoleBadge;
