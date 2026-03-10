import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const StatsCard = ({
  label,
  value,
  icon: Icon,
  color = 'purple',
  prefix = '',
  suffix = '',
  delay = 0,
  decimals = 0,
}) => (
  <motion.div
    className={`stat-card ${color}`}
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    whileHover={{ y: -6, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.98 }}
  >
    <motion.div
      className={`stat-card-icon ${color}`}
      whileHover={{ scale: 1.15, rotate: 10 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {Icon && <Icon size={22} />}
    </motion.div>
    <h3>{label}</h3>
    <div className="value">
      {prefix}
      <CountUp
        end={value || 0}
        duration={2.5}
        separator=","
        decimals={decimals}
        delay={delay}
      />
      {suffix}
    </div>
  </motion.div>
);

export default StatsCard;