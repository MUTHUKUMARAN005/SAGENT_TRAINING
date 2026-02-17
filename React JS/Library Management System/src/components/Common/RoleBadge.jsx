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
      whileHover={{ scale: 1.08 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding, borderRadius: '20px', fontSize, fontWeight: 700,
        background: config.bgLight, color: config.color,
        border: `1px solid ${config.color}30`,
        letterSpacing: '0.03em'
      }}
    >
      <span style={{ fontSize: size === 'lg' ? '14px' : '10px' }}>{config.icon}</span>
      {config.label}
    </motion.span>
  );
};

export default RoleBadge;