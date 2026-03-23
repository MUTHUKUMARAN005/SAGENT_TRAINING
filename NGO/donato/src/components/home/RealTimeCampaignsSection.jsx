import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiRefreshCw } from 'react-icons/fi';
import { api } from '../../utils/api';
import CampaignCard from '../campaigns/CampaignCard';
import { fadeInUp, staggerContainer } from '../../animations/variants';

const POLL_MS = 45000;

const RealTimeCampaignsSection = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getCampaigns();
      const rows = Array.isArray(result?.data) ? result.data : [];
      setCampaigns(rows);
      setLastUpdatedAt(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
    const timer = setInterval(loadCampaigns, POLL_MS);
    return () => clearInterval(timer);
  }, [loadCampaigns]);

  const liveCampaigns = useMemo(
    () => campaigns.filter((c) => c.campaign_status === 'active').slice(0, 3),
    [campaigns]
  );

  return (
    <section className="section-padding pt-4">
      <div className="page-container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mb-10"
        >
          <motion.div variants={fadeInUp} className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium mb-3">
                <FiActivity className="w-3.5 h-3.5" />
                Real-Time Campaigns
              </span>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
                Live <span className="gradient-text">Campaign Updates</span>
              </h2>
              <p className="text-slate-400 mt-2 text-sm">
                Active campaigns are refreshed automatically so visitors always see current progress.
              </p>
            </div>

            <button
              onClick={loadCampaigns}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300
                       text-xs inline-flex items-center gap-1.5 hover:bg-white/10"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </motion.div>

          <motion.p variants={fadeInUp} className="text-[11px] text-slate-500 mt-2">
            Last updated: {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString('en-IN') : 'Loading...'}
          </motion.p>
        </motion.div>

        {liveCampaigns.length === 0 ? (
          <div className="dashboard-card text-center py-10">
            <p className="text-white font-medium mb-1">No active campaigns right now</p>
            <p className="text-slate-400 text-sm">Please check back in a few minutes.</p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {liveCampaigns.map((campaign, idx) => (
              <CampaignCard key={campaign.campaign_id || idx} campaign={campaign} index={idx} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default RealTimeCampaignsSection;

