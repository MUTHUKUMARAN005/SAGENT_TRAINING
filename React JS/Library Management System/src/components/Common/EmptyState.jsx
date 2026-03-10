// src/components/Common/EmptyState.jsx
import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon='NA', title='No data found', subtitle='Try adding new items' }) => (
  <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
    style={{ padding:'50px 20px', textAlign:'center', background:'rgba(13, 31, 53, 0.75)',
      borderRadius:'16px', border:'1px solid rgba(157, 181, 209, 0.2)' }}>
    <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:2, repeat:Infinity }}
      style={{ width:'62px', height:'62px', margin:'0 auto 14px', borderRadius:'18px',
        background:'linear-gradient(135deg, rgba(14, 165, 164, 0.2), rgba(59, 130, 246, 0.2))',
        border:'1px solid rgba(125, 211, 252, 0.25)', display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:'12px', fontWeight:800, color:'#bfe8fd' }}>{icon}</motion.div>
    <p style={{ fontSize:'16px', fontWeight:700, color:'#e8f1fb', marginBottom:'5px' }}>{title}</p>
    <p style={{ fontSize:'12px', color:'#8ca4bf' }}>{subtitle}</p>
  </motion.div>
);

export default EmptyState;
