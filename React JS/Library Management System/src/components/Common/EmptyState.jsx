// src/components/Common/EmptyState.jsx
import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon='📭', title='No data found', subtitle='Try adding new items' }) => (
  <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
    style={{ padding:'50px 20px', textAlign:'center', background:'rgba(30,41,59,0.5)',
      borderRadius:'16px', border:'1px solid rgba(255,255,255,0.06)' }}>
    <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:2, repeat:Infinity }}
      style={{ fontSize:'48px', marginBottom:'14px' }}>{icon}</motion.div>
    <p style={{ fontSize:'16px', fontWeight:600, color:'#e2e8f0', marginBottom:'5px' }}>{title}</p>
    <p style={{ fontSize:'12px', color:'#64748b' }}>{subtitle}</p>
  </motion.div>
);

export default EmptyState;