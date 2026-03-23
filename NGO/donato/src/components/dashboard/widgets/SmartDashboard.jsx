import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  getSmartDashboardData,
  subscribeAdminUpdates,
} from '../../../utils/adminAdvancedFeatures';

const CurrencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="text-sm text-primary-400 font-semibold">
        ₹{Number(payload[0].value || 0).toLocaleString('en-IN')}
      </p>
    </div>
  );
};

const SmartDashboard = () => {
  const [metrics, setMetrics] = useState(() => getSmartDashboardData());

  useEffect(() => {
    const refresh = () => setMetrics(getSmartDashboardData());
    const unsubscribe = subscribeAdminUpdates(refresh);
    refresh();
    return unsubscribe;
  }, []);

  const summary = useMemo(
    () => ({
      successRate: metrics.successRate,
      approved: metrics.approved,
      rejected: metrics.rejected,
      pending: metrics.pending,
    }),
    [metrics]
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="dashboard-card"
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Smart Dashboard</h3>
          <p className="text-xs text-slate-500 mt-1">
            Daily donations, volunteer performance, and campaign success signals
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20">
          <span className="text-xs text-primary-400 font-medium">
            Campaign Success Rate: {summary.successRate}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass-card p-4 xl:col-span-2">
          <p className="text-sm text-white mb-3 font-medium">Daily Donations</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={metrics.dailyDonations}>
              <defs>
                <linearGradient id="smartDonationFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
              />
              <Tooltip content={<CurrencyTooltip />} />
              <Area
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2.3}
                fill="url(#smartDonationFill)"
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <p className="text-sm text-white mb-3 font-medium">Campaign Success Rate</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={metrics.campaignSuccess}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={78}
                innerRadius={48}
                paddingAngle={3}
              >
                {metrics.campaignSuccess.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-4 mt-4">
        <p className="text-sm text-white mb-3 font-medium">Volunteer Performance</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={metrics.volunteerPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
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
              allowDecimals={false}
            />
            <Tooltip />
            <Bar dataKey="assigned" fill="#60a5fa" radius={[6, 6, 0, 0]} />
            <Bar dataKey="completed" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
};

export default SmartDashboard;
