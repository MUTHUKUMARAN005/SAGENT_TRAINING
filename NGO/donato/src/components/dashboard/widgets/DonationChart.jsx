import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const data = [
  { name: 'Jan', donations: 45000 },
  { name: 'Feb', donations: 65000 },
  { name: 'Mar', donations: 52000 },
  { name: 'Apr', donations: 78000 },
  { name: 'May', donations: 92000 },
  { name: 'Jun', donations: 85000 },
  { name: 'Jul', donations: 110000 },
  { name: 'Aug', donations: 95000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-3 shadow-xl">
        <p className="text-sm text-white font-semibold">{label}</p>
        <p className="text-sm text-primary-400">
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const DonationChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="dashboard-card"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Donation Overview</h3>
        <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm 
                        text-slate-300 focus:outline-none focus:border-primary-500">
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="donationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) => `₹${value / 1000}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="donations"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#donationGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default DonationChart;