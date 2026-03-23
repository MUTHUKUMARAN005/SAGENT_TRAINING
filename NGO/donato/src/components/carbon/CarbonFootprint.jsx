import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLeaf, FiDroplet, FiZap, FiWind, FiTrendingDown, FiInfo } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useCountUp } from '../../hooks/useCountUp';
import { fadeInUp, staggerContainer } from '../../animations/variants';

const CarbonFootprint = ({ donations = [] }) => {
  const { t } = useLanguage();
  const [ref, isVisible] = useScrollAnimation(0.2);
  const [period, setPeriod] = useState('all_time');

  // Simulated carbon calculations based on donation data
  const carbonData = {
    month: { co2: 45, trees: 3, water: 2500, energy: 120 },
    year: { co2: 380, trees: 22, water: 28000, energy: 1450 },
    all_time: { co2: 1250, trees: 72, water: 95000, energy: 4800 },
  };

  const currentData = carbonData[period];

  const co2Count = useCountUp(currentData.co2, 2000, 0, isVisible);
  const treesCount = useCountUp(currentData.trees, 2000, 0, isVisible);
  const waterCount = useCountUp(currentData.water, 2000, 0, isVisible);
  const energyCount = useCountUp(currentData.energy, 2000, 0, isVisible);
  const carTripsCount = useCountUp(Math.round(currentData.co2 / 4.6), 2000, 0, isVisible);
  const equivalentTreesCount = useCountUp(currentData.trees, 2000, 0, isVisible);
  const plasticBottlesCount = useCountUp(Math.round(currentData.co2 * 40), 2000, 0, isVisible);

  const breakdownItems = [
    {
      label: t('carbon_food_waste'),
      value: 35,
      color: 'from-orange-500 to-red-500',
      icon: '🍲',
      detail: '450 kg food waste prevented',
    },
    {
      label: t('carbon_clothing_reuse'),
      value: 25,
      color: 'from-teal-500 to-green-500',
      icon: '👕',
      detail: '320 kg clothing reused',
    },
    {
      label: t('carbon_education'),
      value: 22,
      color: 'from-blue-500 to-purple-500',
      icon: '📚',
      detail: '15,000 pages of paper saved',
    },
    {
      label: t('carbon_transport'),
      value: 18,
      color: 'from-yellow-500 to-amber-500',
      icon: '🚛',
      detail: '85 delivery trips optimized',
    },
  ];

  const equivalents = [
    { value: carTripsCount, label: t('carbon_car_trips'), icon: '🚗' },
    { value: equivalentTreesCount, label: t('carbon_tree_planted'), icon: '🌳' },
    { value: plasticBottlesCount, label: t('carbon_plastic_bottles'), icon: '♻️' },
  ];

  const tips = [
    { text: t('carbon_tip_1'), icon: '📦' },
    { text: t('carbon_tip_2'), icon: '📍' },
    { text: t('carbon_tip_3'), icon: '📱' },
  ];

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="glass-card p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <FiLeaf className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-white">
                {t('carbon_title')} <span className="gradient-text-green">{t('carbon_title_highlight')}</span>
              </h3>
              <p className="text-xs text-slate-400">{t('carbon_description')}</p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {[
              { key: 'month', label: t('carbon_this_month') },
              { key: 'year', label: t('carbon_this_year') },
              { key: 'all_time', label: t('carbon_all_time') },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p.key
                    ? 'bg-green-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: FiWind,
              label: t('carbon_saved'),
              value: `${co2Count}`,
              unit: t('carbon_kg'),
              color: 'from-green-500 to-emerald-500',
              bg: 'bg-green-500/10',
              iconColor: 'text-green-400',
            },
            {
              icon: FiLeaf,
              label: t('carbon_trees'),
              value: `${treesCount}`,
              unit: '🌳',
              color: 'from-emerald-500 to-teal-500',
              bg: 'bg-emerald-500/10',
              iconColor: 'text-emerald-400',
            },
            {
              icon: FiDroplet,
              label: t('carbon_water'),
              value: `${waterCount.toLocaleString()}`,
              unit: 'L',
              color: 'from-cyan-500 to-blue-500',
              bg: 'bg-cyan-500/10',
              iconColor: 'text-cyan-400',
            },
            {
              icon: FiZap,
              label: t('carbon_energy'),
              value: `${energyCount.toLocaleString()}`,
              unit: 'kWh',
              color: 'from-yellow-500 to-orange-500',
              bg: 'bg-yellow-500/10',
              iconColor: 'text-yellow-400',
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -3, scale: 1.02 }}
              className="glass-card-hover p-4 text-center"
            >
              <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${stat.bg} flex items-center 
                            justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <p className="text-2xl font-heading font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.unit}</p>
              <p className="text-[10px] text-slate-600 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Breakdown + Equivalents Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impact Breakdown */}
        <motion.div variants={fadeInUp} className="glass-card p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <FiTrendingDown className="w-5 h-5 text-green-400" />
            {t('carbon_breakdown')}
          </h4>
          <div className="space-y-4">
            {breakdownItems.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-white">{item.label}</span>
                  </div>
                  <span className="text-sm text-slate-400 font-semibold">{item.value}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isVisible ? { width: `${item.value}%` } : { width: 0 }}
                    transition={{ duration: 1.2, delay: 0.3 + idx * 0.15 }}
                    className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5">{item.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Equivalents + Tips */}
        <div className="space-y-6">
          {/* Equivalents */}
          <motion.div variants={fadeInUp} className="glass-card p-6">
            <h4 className="text-white font-semibold mb-4">
              {t('carbon_equivalent')}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {equivalents.map((eq, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-3 rounded-xl bg-green-500/5 border border-green-500/10"
                >
                  <span className="text-2xl block mb-1">{eq.icon}</span>
                  <p className="text-white font-bold text-lg">{eq.value}</p>
                  <p className="text-[10px] text-slate-500">{eq.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Green Tips */}
          <motion.div variants={fadeInUp} className="glass-card p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              🌿 {t('carbon_tips')}
            </h4>
            <div className="space-y-3">
              {tips.map((tip, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.8 + idx * 0.15 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/3 
                           hover:bg-white/5 transition-colors"
                >
                  <span className="text-lg shrink-0">{tip.icon}</span>
                  <p className="text-sm text-slate-300">{tip.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CarbonFootprint;
