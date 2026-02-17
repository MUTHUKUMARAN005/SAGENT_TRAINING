// src/components/Common/LoadingSpinner.jsx
import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'large', text = 'Loading...' }) => {
  const s = size === 'small' ? 24 : size === 'medium' ? 36 : 50;
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height: size==='small'?'auto':'400px', flexDirection:'column', gap:'16px' }}>
      <div style={{ position:'relative', width:s, height:s }}>
        <motion.div style={{ width:s, height:s, borderRadius:'50%', border:'3px solid rgba(99,102,241,0.15)', borderTop:'3px solid #6366f1', position:'absolute' }}
          animate={{ rotate: 360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }} />
        <motion.div style={{ width:s*0.65, height:s*0.65, borderRadius:'50%', border:'2px solid rgba(236,72,153,0.15)', borderBottom:'2px solid #ec4899', position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}
          animate={{ rotate: -360 }} transition={{ duration:1.5, repeat:Infinity, ease:'linear' }} />
      </div>
      {size !== 'small' && (
        <motion.p animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1.5, repeat:Infinity }}
          style={{ color:'#94a3b8', fontSize:'13px', fontWeight:500 }}>{text}</motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;