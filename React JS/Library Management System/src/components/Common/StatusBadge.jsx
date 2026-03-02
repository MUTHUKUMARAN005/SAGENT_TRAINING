// src/components/Common/StatusBadge.jsx
import React from 'react';
import { motion } from 'framer-motion';

const cfg = {
  Active: { color: '#10b981', icon: '●' },
  Inactive: { color: '#ef4444', icon: '○' },
  Available: { color: '#10b981', icon: '✓' },
  Borrowed: { color: '#f59e0b', icon: '↗' },
  Reserved: { color: '#6366f1', icon: '⏳' },
  Returned: { color: '#10b981', icon: '✓' },
  Overdue: { color: '#ef4444', icon: '⚠' },
  Unpaid: { color: '#ef4444', icon: '!' },
  Paid: { color: '#10b981', icon: '✓' },
  Waived: { color: '#6366f1', icon: '~' },
  Pending: { color: '#f59e0b', icon: '⏳' },
  Approved: { color: '#10b981', icon: '✓' },
  Completed: { color: '#06b6d4', icon: '✓' },
  Rejected: { color: '#ef4444', icon: '✕' },
  Sent: { color: '#3b82f6', icon: '→' },
  Read: { color: '#10b981', icon: '✓' },
};

const StatusBadge = ({ status }) => {
  const c = cfg[status] || { color: '#64748b', icon: '?' };
  return (
    <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }}
      style={{
        display:'inline-flex', alignItems:'center', gap:'4px',
        padding:'3px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:600,
        background:`${c.color}15`, color:c.color, border:`1px solid ${c.color}25`
      }}>
      <span style={{ fontSize:'8px' }}>{c.icon}</span>{status}
    </motion.span>
  );
};

export default StatusBadge;