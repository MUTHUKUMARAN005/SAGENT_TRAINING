import React from 'react';
import { motion } from 'framer-motion';

const campaigns = [
  { title: 'Campaign Prayas', contributions: 'Human', status: 'Merchandise', statusColor: 'green' },
  { title: 'Campaign Prayed', contributions: 'Human', status: 'Merchandise', statusColor: 'green' },
  { title: 'Donation InRoom', contributions: 'Human', status: 'Merchandise', statusColor: 'yellow' },
];

const CampaignTable = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="dashboard-card"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Manage Campaigns</h3>
        <button className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
          + Create
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Name</th>
              <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Contributions</th>
              <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Status</th>
              <th className="text-right text-xs text-slate-500 font-medium pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, idx) => (
              <tr key={idx} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                <td className="py-3 pr-4 text-sm text-slate-300">{c.title}</td>
                <td className="py-3 pr-4 text-sm text-slate-400">{c.contributions}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    c.statusColor === 'green'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default CampaignTable;