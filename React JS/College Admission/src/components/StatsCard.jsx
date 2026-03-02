import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ icon, label, value, gradient, change, delay = 0 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const num = parseInt(value) || 0;
    const duration = 1500;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;
    const increment = num / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        setCount(num);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      className={`stat-card ${gradient}`}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{
        y: -8,
        boxShadow: '0 35px 60px -15px rgba(0, 0, 0, 0.6)',
      }}
    >
      <div className="stat-card-header">
        <motion.div
          className="stat-card-icon"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          {icon}
        </motion.div>
        <span className="stat-card-label">{label}</span>
      </div>
      <div className="stat-card-value">{count}</div>
      {change && (
        <div className={`stat-card-change ${change > 0 ? 'positive' : 'negative'}`}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;