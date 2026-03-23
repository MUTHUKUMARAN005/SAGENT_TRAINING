import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiGrid, FiList } from 'react-icons/fi';
import CampaignCard from '../components/campaigns/CampaignCard';
import { DONATION_TYPES } from '../utils/constants';
import { api } from '../utils/api';
import { pageTransition, fadeInUp, staggerContainer } from '../animations/variants';

const CampaignsPage = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('grid');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const result = await api.getCampaigns();
        if (isMounted) {
          setCampaigns(Array.isArray(result?.data) ? result.data : []);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCampaigns();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                         c.ngo_name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || c.donation_type === filter;
      return matchSearch && matchFilter;
    });
  }, [campaigns, search, filter]);

  return (
    <motion.div {...pageTransition} className="pt-24">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/kindwave-campaigns-hero/1600/900"
            alt=""
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-dark-bg/95 to-dark-bg" />
        </div>
        <div className="page-container relative z-10 px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-heading font-bold text-white mb-4"
          >
            Browse <span className="gradient-text">Campaigns</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 max-w-2xl mx-auto text-lg"
          >
            Find verified campaigns and make your contribution count
          </motion.p>
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="page-container">
          {/* Search & Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4 md:p-6 mb-8 flex flex-col md:flex-row gap-4 items-center"
          >
            {/* Search */}
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campaigns, NGOs..."
                className="input-field pl-12"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white shadow-glow'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {DONATION_TYPES.slice(0, 4).map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilter(type.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all 
                           flex items-center gap-1.5 ${
                    filter === type.value
                      ? 'bg-primary-600 text-white shadow-glow'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'grid' ? 'bg-primary-600 text-white' : 'text-slate-400'
                }`}
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'list' ? 'bg-primary-600 text-white' : 'text-slate-400'
                }`}
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {loading ? (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="glass-card overflow-hidden animate-pulse">
                  <div className="h-56 bg-white/5" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 bg-white/5 rounded-full w-1/3" />
                    <div className="h-5 bg-white/5 rounded-full w-4/5" />
                    <div className="h-3 bg-white/5 rounded-full w-full" />
                    <div className="h-3 bg-white/5 rounded-full w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-slate-400">
                  Showing <span className="text-white font-semibold">{filtered.length}</span> campaigns
                </p>
              </div>

              {/* Campaign Grid */}
              {filtered.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className={`grid gap-8 ${
                view === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 max-w-3xl mx-auto'
              }`}
            >
              {filtered.map((campaign, index) => (
                <CampaignCard key={campaign.campaign_id} campaign={campaign} index={index} />
              ))}
            </motion.div>
              ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-semibold text-white mb-2">No campaigns found</h3>
              <p className="text-slate-400">Try adjusting your search or filter criteria</p>
            </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </motion.div>
  );
};

export default CampaignsPage;
