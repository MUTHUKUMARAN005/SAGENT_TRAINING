import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiClock } from 'react-icons/fi';
import { fadeInUp } from '../../animations/variants';
import { api } from '../../utils/api';

const statusTone = {
  approved: 'bg-red-500/20 text-red-200 border border-red-400/30',
  pending: 'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30',
  resolved: 'bg-green-500/20 text-green-100 border border-green-400/30',
  expired: 'bg-slate-500/20 text-slate-200 border border-slate-400/30',
};

const formatExpiry = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'No expiry date';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const UrgentNeedsBannerSection = () => {
  const [urgentNeeds, setUrgentNeeds] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadUrgentNeeds = async () => {
      try {
        const items = await api.getActiveUrgentNeeds();
        if (mounted) {
          setUrgentNeeds(Array.isArray(items) ? items : []);
        }
      } catch (_error) {
        if (mounted) {
          setUrgentNeeds([]);
        }
      }
    };

    loadUrgentNeeds();
    return () => {
      mounted = false;
    };
  }, []);

  const activeBanners = useMemo(() => (
    urgentNeeds
      .filter((item) => String(item?.urgent_status || '').toLowerCase() === 'approved')
      .slice()
      .sort((left, right) => {
        const leftTime = new Date(left.created_at || '').getTime();
        const rightTime = new Date(right.created_at || '').getTime();
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
        return safeRight - safeLeft;
      })
  ), [urgentNeeds]);

  if (!activeBanners.length) return null;

  const primaryBanner = activeBanners[0];
  const additionalBanners = activeBanners.slice(1, 3);
  const primaryStatus = String(primaryBanner.urgent_status || 'approved').toLowerCase();

  return (
    <section className="section-padding pt-8 pb-8 md:pt-10 md:pb-10">
      <div className="page-container">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="rounded-3xl border border-red-400/30 bg-gradient-to-r from-red-500/20 via-orange-500/15 to-amber-400/15 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-400/30 text-red-100 text-xs font-semibold uppercase tracking-[0.12em]">
                <FiAlertTriangle className="w-4 h-4" />
                Urgent Need
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusTone[primaryStatus] || statusTone.approved}`}>
                {String(primaryBanner.urgent_status || 'APPROVED')}
              </span>
            </div>

            <h2 className="mt-4 text-2xl md:text-3xl font-heading font-bold text-white">
              {primaryBanner.title || 'Immediate support requested'}
            </h2>
            <p className="mt-3 text-slate-100/90 max-w-3xl">
              {primaryBanner.message || 'A critical request is currently active. Please support this urgent need.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-red-50/90">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 capitalize">
                By: {primaryBanner.ngo_name || 'NGO'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 capitalize">
                Status: {String(primaryBanner.urgent_status || 'APPROVED')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
                <FiClock className="w-3.5 h-3.5" />
                Active until {formatExpiry(primaryBanner.end_time)}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/donate"
                className="px-5 py-2.5 rounded-xl bg-white text-red-700 font-semibold hover:bg-red-50 transition-colors"
              >
                Respond Now
              </Link>
              <Link
                to="/campaigns"
                className="px-5 py-2.5 rounded-xl border border-white/40 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                View Campaigns
              </Link>
            </div>
          </div>

          {additionalBanners.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {additionalBanners.map((banner) => (
                <div key={banner.urgent_id} className="glass-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white font-medium">{banner.title}</p>
                    <span className={`px-2 py-1 rounded-full text-[11px] uppercase ${statusTone[String(banner.urgent_status || '').toLowerCase()] || statusTone.approved}`}>
                      {banner.urgent_status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-2">{banner.message}</p>
                </div>
              ))}
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
};

export default UrgentNeedsBannerSection;
