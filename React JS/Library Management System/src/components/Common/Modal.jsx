// src/components/Common/Modal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const maxW = size==='sm'?'420px':size==='lg'?'700px':'550px';
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)',
            zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <motion.div initial={{ scale:0.75, opacity:0, y:50 }}
            animate={{ scale:1, opacity:1, y:0, transition:{ type:'spring', damping:22, stiffness:300 }}}
            exit={{ scale:0.75, opacity:0, y:50, transition:{ duration:0.2 }}}
            onClick={e=>e.stopPropagation()}
            style={{ background:'linear-gradient(145deg, #1e293b, #0f172a)', border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:'20px', width:'100%', maxWidth:maxW, maxHeight:'90vh', overflow:'hidden',
              boxShadow:'0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.08)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'22px 26px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize:'19px', fontWeight:700, background:'linear-gradient(135deg, #6366f1, #ec4899)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{title}</h2>
              <motion.button whileHover={{ scale:1.15, rotate:90 }} whileTap={{ scale:0.85 }}
                onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                  color:'#94a3b8', fontSize:'15px', cursor:'pointer', width:'32px', height:'32px', borderRadius:'9px',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>✕</motion.button>
            </div>
            <div style={{ padding:'22px 26px 26px', overflowY:'auto', maxHeight:'calc(90vh - 75px)' }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;