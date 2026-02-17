// src/components/Common/AnimatedCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ children, delay = 0, onClick, style = {}, glowColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 25, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay, ease: [0.25,0.46,0.45,0.94] }}
    whileHover={{ y: -5, scale: 1.02, boxShadow: `0 20px 40px -12px ${glowColor || 'rgba(99,102,241,0.2)'}`, transition: { duration: 0.25 }}}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(30,41,59,0.5))',
      backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px', padding: '22px', cursor: onClick?'pointer':'default',
      position: 'relative', overflow: 'hidden', ...style
    }}
  >
    {children}
  </motion.div>
);

export default AnimatedCard;