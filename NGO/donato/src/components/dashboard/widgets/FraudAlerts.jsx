import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiAlertTriangle,
  FiShield,
  FiCheckCircle,
  FiBell,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  getFraudMonitoringAlerts,
  subscribeAdminUpdates,
} from '../../../utils/adminAdvancedFeatures';

const levelStyles = {
  critical: {
    icon: FiShield,
    className: 'text-red-400 bg-red-500/15 border border-red-500/30',
    chip: 'bg-red-500/10 text-red-400',
  },
  high: {
    icon: FiAlertTriangle,
    className: 'text-orange-400 bg-orange-500/15 border border-orange-500/30',
    chip: 'bg-orange-500/10 text-orange-400',
  },
  medium: {
    icon: FiBell,
    className: 'text-yellow-400 bg-yellow-500/15 border border-yellow-500/30',
    chip: 'bg-yellow-500/10 text-yellow-400',
  },
};

const FraudAlerts = () => {
  const [alerts, setAlerts] = useState(() => getFraudMonitoringAlerts());
  const [resolved, setResolved] = useState([]);

  useEffect(() => {
    const refresh = () => setAlerts(getFraudMonitoringAlerts());
    const unsubscribe = subscribeAdminUpdates(refresh);
    refresh();
    return unsubscribe;
  }, []);

  const openAlerts = useMemo(
    () => alerts.filter((alert) => !resolved.includes(alert.id)),
    [alerts, resolved]
  );

  const markResolved = (id) => {
    setResolved((prev) => [...prev, id]);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="dashboard-card"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Fraud Monitoring</h3>
          <p className="text-xs text-slate-500 mt-1">Detect unusual activity in real time</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
          {openAlerts.length} active
        </span>
      </div>

      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {openAlerts.map((alert, idx) => {
          const level = levelStyles[alert.severity] || levelStyles.medium;
          const Icon = level.icon;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.42 + idx * 0.06 }}
              className="p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${level.className} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-white font-medium truncate">{alert.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${level.chip}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{alert.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-slate-500">{alert.source}</span>
                    <button
                      onClick={() => markResolved(alert.id)}
                      className="text-[11px] px-2 py-1 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {openAlerts.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-green-500/15 text-green-400 mb-2">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <p className="text-sm text-white">No active fraud alerts</p>
            <p className="text-xs text-slate-500 mt-1">Monitoring is active and up to date</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setAlerts(getFraudMonitoringAlerts())}
        className="mt-4 w-full py-2 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-sm flex items-center justify-center gap-2"
      >
        <FiRefreshCw className="w-4 h-4" />
        Refresh Detection
      </button>
    </motion.section>
  );
};

export default FraudAlerts;
