import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({
  children,
  delay = 0,
  className = '',
  onClick,
  hoverEffect = true,
  style = {},
}) => (
  <motion.div
    className={className}
    style={style}
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{
      delay,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    }}
    whileHover={
      hoverEffect
        ? {
            y: -6,
            transition: { duration: 0.2 },
          }
        : {}
    }
    whileTap={onClick ? { scale: 0.98 } : {}}
    onClick={onClick}
    layout
  >
    {children}
  </motion.div>
);

export default AnimatedCard;