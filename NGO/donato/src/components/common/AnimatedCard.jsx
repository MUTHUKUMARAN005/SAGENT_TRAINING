import React from 'react';
import { motion } from 'framer-motion';
import { cardHover } from '../../animations/variants';

const AnimatedCard = ({ children, className = '', delay = 0, onClick }) => {
  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      className={`cursor-pointer ${className}`}
      onClick={onClick}
      layout
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;