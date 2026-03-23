import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { IMPACT_IMAGES } from '../../utils/constants';
import { api } from '../../utils/api';
import { fadeInUp, staggerContainer } from '../../animations/variants';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useCountUp } from '../../hooks/useCountUp';
import ProgressBar from '../common/ProgressBar';
import NearbyDonationMapSection from './NearbyDonationMapSection';

const StatItem = ({ value, suffix = '', label, isVisible }) => {
  const count = useCountUp(value, 2500, 0, isVisible);

  return (
    <motion.div variants={fadeInUp} className="text-center">
      <div className="text-3xl md:text-4xl font-heading font-bold text-white mb-1">
        {typeof value === 'number' ? count.toLocaleString() : value}
        <span className="gradient-text">{suffix}</span>
      </div>
      <p className="text-sm text-slate-400">{label}</p>
    </motion.div>
  );
};

const ImpactSection = () => {
  const [ref, isVisible] = useScrollAnimation(0.2);
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadImpactData = async () => {
      try {
        const [statsResult, campaignsResult] = await Promise.all([
          api.getPublicStats(),
          api.getCampaigns(),
        ]);

        if (!isMounted) return;

        setStats(statsResult?.success ? statsResult.data : null);
        setCampaigns(campaignsResult?.success && Array.isArray(campaignsResult.data)
          ? campaignsResult.data.slice(0, 3)
          : []);
      } catch {
        if (!isMounted) return;
        setStats(null);
        setCampaigns([]);
      }
    };

    loadImpactData();
    return () => { isMounted = false; };
  }, []);

  const impactStats = useMemo(() => ([
    { value: Number(stats?.children_educated || 0), label: 'Children Educated', suffix: '+' },
    { value: Number(stats?.meals_served || 0), label: 'Meals Served', suffix: '+' },
    { value: Number(stats?.projects_completed || 0), label: 'Projects Completed', suffix: '+' },
    { value: Number(stats?.ngos_registered || 0), label: 'Partner NGOs', suffix: '+' },
  ]), [stats]);

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background Image Mosaic */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="grid grid-cols-4 h-full">
          {IMPACT_IMAGES.map((img, idx) => (
            <div key={idx} className="overflow-hidden">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-dark-bg/80" />
      </div>

      <div ref={ref} className="page-container relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {/* Section Header */}
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent-orange/10 border 
                         border-accent-orange/20 text-accent-orange text-sm font-medium mb-4">
              Our Impact
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
              Real Change, <span className="gradient-text-warm">Real Numbers</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              See how thousands of donors have transformed lives through KindWave's 
              transparent and impactful donation platform.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          >
            {impactStats.map((stat, idx) => (
              <StatItem key={idx} {...stat} isVisible={isVisible} />
            ))}
          </motion.div>

          {/* Impact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((item, idx) => (
              <motion.div
                key={item.campaign_id || idx}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="glass-card overflow-hidden group"
              >
                <div className="relative h-48 overflow-hidden">
                  <motion.img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-white font-semibold mb-3 group-hover:text-primary-400 
                               transition-colors">
                    {item.title}
                  </h3>
                  <ProgressBar
                    value={item.collected_amount || 0}
                    max={item.target_amount || 1}
                    colorClass="from-accent-orange to-red-400"
                  />
                  <div className="flex justify-between items-center mt-3 text-sm">
                    <span className="text-accent-orange font-semibold">₹{Number(item.collected_amount || 0).toLocaleString()}</span>
                    <span className="text-slate-500">{Number(item.donors_count || 0)} donors</span>
                  </div>
                </div>
              </motion.div>
            ))}
            {campaigns.length === 0 && (
              <motion.div variants={fadeInUp} className="glass-card p-8 text-center lg:col-span-3">
                <h3 className="text-white font-semibold mb-2">No live impact campaigns available yet</h3>
                <p className="text-slate-400 text-sm">Published campaigns from the backend will appear here automatically.</p>
              </motion.div>
            )}
          </div>

          {/* ── Nearby Donation Map ──────────────────────────────────────────── */}
          <NearbyDonationMapSection />

        </motion.div>
      </div>
    </section>
  );
};

export default ImpactSection;