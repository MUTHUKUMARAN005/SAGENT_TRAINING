// src/components/Common/PageTransition.jsx
import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.25,0.46,0.45,0.94] }}}
    exit={{ opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.25 }}}
  >
    {children}
  </motion.div>
);

export default PageTransition;