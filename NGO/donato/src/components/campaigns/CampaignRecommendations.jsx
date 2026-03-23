// src/components/campaigns/CampaignRecommendations.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiRefreshCw, FiExternalLink, FiZap, FiArrowRight,
} from 'react-icons/fi';
import ProgressBar from '../common/ProgressBar';
import { api } from '../../utils/api';
import { fadeInUp, staggerContainer } from '../../animations/variants';

// ── Score ring component ─────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color =
    score >= 75 ? '#22c55e' :
    score >= 50 ? '#3b82f6' :
    score >= 30 ? '#f59e0b' : '#6b7280';

  return (
    <svg width="36" height="36" className="shrink-0" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="18" cy="18" r={radius} stroke="rgba(255,255,255,0.08)"
        strokeWidth="3" fill="none" />
      <circle cx="18" cy="18" r={radius} stroke={color}
        strokeWidth="3" fill="none"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round" />
      <text x="18" y="18"
        style={{ transform: 'rotate(90deg)', transformOrigin: '18px 18px', fontSize: 9, fontWeight: 700 }}
        textAnchor="middle" dominantBaseline="middle" fill={color}>
        {score}
      </text>
    </svg>
  );
};

// ── Match label badge ────────────────────────────────────────────────────────
const MatchBadge = ({ label }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                   font-medium bg-primary-500/10 text-primary-300 border border-primary-500/20
                   whitespace-nowrap shrink-0">
    {label}
  </span>
);

// ── Main component ───────────────────────────────────────────────────────────
const CampaignRecommendations = ({ maxItems = 4, showHeader = true, compact = false }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    api.getRecommendations()
      .then((result) => {
        if (!alive) return;
        const items = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
          ? result
          : [];
        setRecommendations(items);
      })
      .catch(() => setRecommendations([]))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [refreshKey]);

  const visible = useMemo(
    () => recommendations.slice(0, maxItems),
    [recommendations, maxItems]
  );

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dashboard-card">
        {showHeader && (
          <div className="flex items-center gap-2 mb-5">
            <div className="w-5 h-5 rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-44 rounded bg-white/10 animate-pulse" />
          </div>
        )}
        <div className="space-y-4">
          {Array.from({ length: compact ? 3 : maxItems }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-20 h-16 rounded-xl bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-3/4 rounded bg-white/10" />
                <div className="h-2 w-1/2 rounded bg-white/10" />
                <div className="h-1.5 w-full rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!loading && visible.length === 0) {
    return (
      <div className="dashboard-card">
        {showHeader && <RecommendHeader onRefresh={() => setRefreshKey(k => k + 1)} loading={loading} />}
        <div className="text-center py-10">
          <span className="text-4xl block mb-3">🎯</span>
          <p className="text-white font-medium mb-1">No recommendations yet</p>
          <p className="text-xs text-slate-500">
            Make your first donation and we'll tailor suggestions for you.
          </p>
          <Link to="/campaigns">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="mt-4 btn-primary text-sm py-2 px-5 inline-flex items-center gap-2"
            >
              Browse Campaigns <FiArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────
  return (
    <div className={compact ? '' : 'dashboard-card'}>
      {showHeader && (
        <RecommendHeader onRefresh={() => setRefreshKey(k => k + 1)} loading={loading} />
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        <AnimatePresence>
          {visible.map((rec, idx) => (
            <motion.div
              key={`${rec.campaign_id || 'rec'}-${idx}`}
              variants={fadeInUp}
              layout
            >
              {(() => {
                const campaignId = Number(rec?.campaign_id ?? rec?.campaignId ?? 0);
                const canOpenDetails = Number.isFinite(campaignId) && campaignId > 0;

                const cardContent = (
                  <motion.div
                    whileHover={canOpenDetails ? { x: 3 } : undefined}
                    className={`flex gap-3 p-3 rounded-xl transition-all group ${
                      canOpenDetails ? 'hover:bg-white/5 cursor-pointer' : 'opacity-80'
                    }`}
                  >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-16 shrink-0 rounded-xl overflow-hidden">
                    <img
                      src={rec.image}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Days-left badge */}
                    {rec.days_left > 0 && rec.days_left <= 30 && (
                      <div className="absolute bottom-0 inset-x-0 bg-red-600/80 text-white
                                      text-[9px] text-center py-0.5 font-medium">
                        {rec.days_left}d left
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm text-white font-medium group-hover:text-primary-400
                                   transition-colors line-clamp-1 leading-tight">
                        {rec.title}
                      </p>
                      <ScoreRing score={rec.score} />
                    </div>

                    <p className="text-[10px] text-slate-500 mb-1.5 truncate">
                      {rec.ngo_name}{rec.city ? ` • ${rec.city}` : ''}
                    </p>

                    <ProgressBar
                      value={rec.collected_amount}
                      max={rec.target_amount}
                      height="h-1.5"
                    />

                    <div className="flex items-center justify-between mt-1.5 gap-2">
                      <MatchBadge label={rec.match_label} />
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {rec.donors_count} donors
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-1 italic truncate">
                      {rec.match_reason}
                    </p>
                  </div>
                  </motion.div>
                );

                if (canOpenDetails) {
                  return <Link to={`/campaigns/${campaignId}`}>{cardContent}</Link>;
                }

                return (
                  <div>
                    {cardContent}
                    <p className="text-[10px] text-slate-500 px-3 -mt-1">
                      Details unavailable for this recommendation
                    </p>
                  </div>
                );
              })()}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* CTA */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Updated based on your donation history
        </p>
        <Link
          to="/campaigns"
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1
                     transition-colors"
        >
          See all <FiExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

// ── Sub-component: header ──────────────────────────────────────────────────
const RecommendHeader = ({ onRefresh, loading }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500/20 to-blue-500/20
                      border border-primary-500/30 flex items-center justify-center">
        <FiZap className="w-4 h-4 text-primary-400" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-white leading-tight">
          Recommended for You
        </h3>
        <p className="text-[10px] text-slate-500">AI-powered · based on your history</p>
      </div>
    </div>
    <motion.button
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      onClick={onRefresh}
      disabled={loading}
      className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-500/10
                 transition-colors disabled:opacity-40"
      title="Refresh recommendations"
    >
      <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
    </motion.button>
  </div>
);

export default CampaignRecommendations;

