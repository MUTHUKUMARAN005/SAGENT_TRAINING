// src/components/Common/ConfirmDialog.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)',
          zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <motion.div initial={{ scale:0.8, y:30 }} animate={{ scale:1, y:0 }} exit={{ scale:0.8, y:30 }}
          transition={{ type:'spring', damping:20, stiffness:300 }}
          onClick={e=>e.stopPropagation()}
          style={{ background:'linear-gradient(145deg, #1e293b, #0f172a)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'20px', padding:'30px', width:'400px', maxWidth:'90%', textAlign:'center',
            boxShadow:'0 25px 60px rgba(0,0,0,0.5)' }}>
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', delay:0.1 }}
            style={{ width:'60px', height:'60px', background:'rgba(239,68,68,0.12)', borderRadius:'50%',
              margin:'0 auto 18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px' }}>⚠️</motion.div>
          <h3 style={{ fontSize:'17px', fontWeight:700, marginBottom:'8px' }}>{title || 'Confirm Delete'}</h3>
          <p style={{ color:'#94a3b8', fontSize:'13px', marginBottom:'26px', lineHeight:1.5 }}>{message || 'This action cannot be undone.'}</p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={onClose}
              style={{ padding:'10px 22px', borderRadius:'10px', background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Cancel</motion.button>
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              onClick={() => { onConfirm(); onClose(); }}
              style={{ padding:'10px 22px', borderRadius:'10px', background:'linear-gradient(135deg, #ef4444, #dc2626)',
                border:'none', color:'white', fontSize:'13px', fontWeight:600, cursor:'pointer',
                boxShadow:'0 4px 15px rgba(239,68,68,0.3)' }}>🗑️ Delete</motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;