import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const ProgressBar = ({ value, max, colorClass = 'from-primary-500 to-blue-400', height = 'h-2.5' }) => {
  const [ref, isVisible] = useScrollAnimation(0.5);
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div ref={ref} className={`w-full bg-white/10 rounded-full ${height} overflow-hidden`}>
      <motion.div
        className={`${height} rounded-full bg-gradient-to-r ${colorClass} relative`}
        initial={{ width: 0 }}
        animate={isVisible ? { width: `${percentage}%` } : { width: 0 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute inset-0 shimmer" />
        </div>
      </motion.div>
    </div>
  );
};

export default ProgressBar;