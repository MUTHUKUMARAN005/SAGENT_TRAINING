import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiTarget, FiShield, FiAward } from 'react-icons/fi';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useCountUp } from '../../hooks/useCountUp';
import { fadeInUp, staggerContainer } from '../../animations/variants';
import { api } from '../../utils/api';

const CounterCard = ({ icon: Icon, value, suffix, label, color, isVisible }) => {
  const count = useCountUp(value, 2000, 0, isVisible);

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.05, y: -5 }}
      className="glass-card-hover p-6 text-center"
    >
      <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">
        {value >= 100000 ? `₹${(count / 100000).toFixed(1)}L` : count.toLocaleString()}
        <span className="text-primary-400">{suffix}</span>
      </div>
      <p className="text-slate-400 text-sm">{label}</p>
    </motion.div>
  );
};

const FALLBACK_STATS = [
  { icon: FiHeart, value: 1245000, suffix: '+', label: 'Total Donations', color: 'from-red-500 to-pink-500' },
  { icon: FiTarget, value: 27, suffix: '', label: 'Active Campaigns', color: 'from-primary-500 to-blue-500' },
  { icon: FiShield, value: 58, suffix: '', label: 'Verified NGOs', color: 'from-green-500 to-emerald-500' },
  { icon: FiAward, value: 4210, suffix: '+', label: 'Happy Donors', color: 'from-accent-orange to-yellow-500' },
];

const StatsCounter = () => {
  const [ref, isVisible] = useScrollAnimation(0.3);
  const [stats, setStats] = useState(FALLBACK_STATS);

  useEffect(() => {
    api.getPublicStats().then((result) => {
      if (!result?.success || !result.data) return;
      const d = result.data;
      setStats([
        { icon: FiHeart, value: Number(d.total_donations ?? FALLBACK_STATS[0].value), suffix: '+', label: 'Total Donations', color: 'from-red-500 to-pink-500' },
        { icon: FiTarget, value: Number(d.active_campaigns ?? FALLBACK_STATS[1].value), suffix: '', label: 'Active Campaigns', color: 'from-primary-500 to-blue-500' },
        { icon: FiShield, value: Number(d.ngos_registered ?? FALLBACK_STATS[2].value), suffix: '', label: 'Verified NGOs', color: 'from-green-500 to-emerald-500' },
        { icon: FiAward, value: Number(d.total_users ?? FALLBACK_STATS[3].value), suffix: '+', label: 'Happy Donors', color: 'from-accent-orange to-yellow-500' },
      ]);
    });
  }, []);

  return (
    <section ref={ref} className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-primary-900/10 to-dark-bg" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />

      <div className="page-container relative z-10 px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, idx) => (
            <CounterCard key={idx} {...stat} isVisible={isVisible} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsCounter;
