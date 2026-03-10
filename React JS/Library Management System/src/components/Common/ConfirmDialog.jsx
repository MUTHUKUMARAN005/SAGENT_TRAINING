// src/components/Common/ConfirmDialog.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(3, 8, 17, 0.72)', backdropFilter:'blur(8px)',
          zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <motion.div initial={{ scale:0.8, y:30 }} animate={{ scale:1, y:0 }} exit={{ scale:0.8, y:30 }}
          transition={{ type:'spring', damping:20, stiffness:300 }}
          onClick={e=>e.stopPropagation()}
          style={{ background:'linear-gradient(160deg, rgba(17, 31, 52, 0.95), rgba(9, 21, 37, 0.96))', border:'1px solid rgba(157, 181, 209, 0.24)',
            borderRadius:'20px', padding:'30px', width:'400px', maxWidth:'90%', textAlign:'center',
            boxShadow:'0 25px 60px rgba(0,0,0,0.5)' }}>
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', delay:0.1 }}
            style={{ width:'60px', height:'60px', background:'rgba(239,68,68,0.12)', borderRadius:'50%',
              margin:'0 auto 18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:800, color:'#fca5a5' }}>ALERT</motion.div>
          <h3 style={{ fontSize:'17px', fontWeight:700, marginBottom:'8px', color:'#e8f1fb' }}>{title || 'Confirm Delete'}</h3>
          <p style={{ color:'#afc1d7', fontSize:'13px', marginBottom:'26px', lineHeight:1.5 }}>{message || 'This action cannot be undone.'}</p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={onClose}
              style={{ padding:'10px 22px', borderRadius:'10px', background:'rgba(157, 181, 209, 0.12)',
                border:'1px solid rgba(157, 181, 209, 0.2)', color:'#afc1d7', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Cancel</motion.button>
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              onClick={() => { onConfirm(); onClose(); }}
              style={{ padding:'10px 22px', borderRadius:'10px', background:'linear-gradient(135deg, #ef4444, #dc2626)',
                border:'none', color:'white', fontSize:'13px', fontWeight:600, cursor:'pointer',
                boxShadow:'0 4px 15px rgba(239,68,68,0.3)' }}>Delete</motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;
