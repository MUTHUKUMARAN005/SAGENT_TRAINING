import React from 'react';
import { motion } from 'framer-motion';
import { useCountUp } from '../../../hooks/useCountUp';

const StatCard = ({
  icon: Icon,
  title,
  value,
  suffix = '',
  color,
  delay = 0,
  format = 'number',
}) => {
  const count = useCountUp(typeof value === 'number' ? value : 0, 2000);
  const renderedValue = (() => {
    if (typeof value !== 'number') return value;
    if (format === 'currency') return `₹${Math.round(count).toLocaleString('en-IN')}`;
    return Math.round(count).toLocaleString('en-IN');
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -3, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
      className="dashboard-card flex items-start gap-4"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center 
                      justify-center shrink-0 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-400 mb-1">{title}</p>
        <p className="text-2xl font-heading font-bold text-white">
          {renderedValue}
          <span className="text-primary-400">{suffix}</span>
        </p>
      </div>
    </motion.div>
  );
};

export default StatCard;