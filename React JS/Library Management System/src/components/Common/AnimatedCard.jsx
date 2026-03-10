// src/components/Common/AnimatedCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ children, delay = 0, onClick, style = {}, glowColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 25, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, delay, ease: [0.25,0.46,0.45,0.94] }}
    whileHover={{ y: -4, scale: 1.01, boxShadow: `0 20px 40px -16px ${glowColor || 'rgba(45, 212, 191, 0.22)'}`, transition: { duration: 0.25 }}}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      background: 'linear-gradient(160deg, rgba(17, 31, 52, 0.88), rgba(10, 22, 38, 0.9))',
      backdropFilter: 'blur(18px)',
      border: '1px solid rgba(157, 181, 209, 0.16)',
      borderRadius: '16px',
      padding: '22px',
      cursor: onClick?'pointer':'default',
      position: 'relative', overflow: 'hidden', ...style
    }}
  >
    {children}
  </motion.div>
);

export default AnimatedCard;
