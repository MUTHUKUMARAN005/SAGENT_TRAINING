// src/components/campaigns/CampaignList.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { FiSearch, FiFilter, FiX, FiChevronDown, FiSliders } from 'react-icons/fi';
import CampaignCard from './CampaignCard';
import { DONATION_TYPES } from '../../utils/constants';
import { api } from '../../utils/api';
import { staggerContainer, fadeInUp } from '../../animations/variants';

const CampaignList = ({ limit, showFilters = true, showSearch = true }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_funded', label: 'Most Funded' },
    { value: 'least_funded', label: 'Least Funded' },
    { value: 'ending_soon', label: 'Ending Soon' },
    { value: 'most_donors', label: 'Most Donors' },
  ];

  const filteredAndSorted = useMemo(() => {
    let result = [...campaigns];

    // Search filter
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(lowerSearch) ||
          c.description.toLowerCase().includes(lowerSearch) ||
          c.ngo_name.toLowerCase().includes(lowerSearch)
      );
    }

    // Type filter
    if (activeFilter !== 'all') {
      result = result.filter((c) => c.donation_type === activeFilter);
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        break;
      case 'most_funded':
        result.sort((a, b) => b.collected_amount - a.collected_amount);
        break;
      case 'least_funded':
        result.sort((a, b) => a.collected_amount - b.collected_amount);
        break;
      case 'ending_soon':
        result.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
        break;
      case 'most_donors':
        result.sort((a, b) => b.donors_count - a.donors_count);
        break;
      default: // newest
        result.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    }

    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [campaigns, search, activeFilter, sortBy, limit]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setActiveFilter('all');
    setSortBy('newest');
  }, []);

  const hasActiveFilters = search || activeFilter !== 'all' || sortBy !== 'newest';

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(limit || 6)].map((_, i) => (
          <div key={i} className="glass-card overflow-hidden animate-pulse">
            <div className="h-56 bg-white/5" />
            <div className="p-6 space-y-3">
              <div className="h-3 bg-white/5 rounded-full w-1/3" />
              <div className="h-5 bg-white/5 rounded-full w-4/5" />
              <div className="h-3 bg-white/5 rounded-full w-full" />
              <div className="h-3 bg-white/5 rounded-full w-2/3" />
              <div className="h-2.5 bg-white/5 rounded-full w-full mt-4" />
              <div className="flex justify-between mt-2">
                <div className="h-3 bg-white/5 rounded-full w-1/4" />
                <div className="h-3 bg-white/5 rounded-full w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filter Bar */}
      {(showFilters || showSearch) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Desktop Filter Bar */}
          <div className="hidden md:flex items-center gap-4 glass-card p-4">
            {showSearch && (
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campaigns, NGOs..."
                  className="input-field pl-11 py-2.5"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 
                             hover:text-white transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {showFilters && (
              <>
                {/* Category Chips */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      activeFilter === 'all'
                        ? 'bg-primary-600 text-white shadow-glow'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    All Types
                  </button>
                  {DONATION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setActiveFilter(type.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all 
                               flex items-center gap-1.5 whitespace-nowrap ${
                        activeFilter === type.value
                          ? 'bg-primary-600 text-white shadow-glow'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-base">{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 
                             text-slate-400 hover:bg-white/10 transition-colors text-sm 
                             whitespace-nowrap"
                  >
                    <FiSliders className="w-4 h-4" />
                    Sort
                    <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${
                      showSortDropdown ? 'rotate-180' : ''
                    }`} />
                  </button>

                  <AnimatePresence>
                    {showSortDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-48 glass-card py-2 shadow-xl z-50"
                      >
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              sortBy === option.value
                                ? 'text-primary-400 bg-primary-500/10'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Mobile Filter Bar */}
          <div className="md:hidden space-y-3">
            {showSearch && (
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search campaigns..."
                  className="input-field pl-11"
                />
              </div>
            )}

            {showFilters && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 
                           text-slate-400 text-sm border border-white/10"
                >
                  <FiFilter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 bg-primary-500 rounded-full" />
                  )}
                </button>

                <div className="flex-1 overflow-x-auto flex gap-2 pb-1 scrollbar-none">
                  {DONATION_TYPES.slice(0, 4).map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setActiveFilter(
                        activeFilter === type.value ? 'all' : type.value
                      )}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all 
                               whitespace-nowrap ${
                        activeFilter === type.value
                          ? 'bg-primary-600 text-white'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 mt-3 flex-wrap"
            >
              <span className="text-xs text-slate-500">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
                             bg-primary-500/10 text-primary-400 text-xs">
                  Search: "{search}"
                  <button onClick={() => setSearch('')}>
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
              {activeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
                             bg-primary-500/10 text-primary-400 text-xs capitalize">
                  {activeFilter}
                  <button onClick={() => setActiveFilter('all')}>
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-red-400 hover:text-red-300 transition-colors ml-2"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-400">
          {filteredAndSorted.length === 0
            ? 'No campaigns found'
            : `Showing ${filteredAndSorted.length} of ${campaigns.length} campaigns`}
        </p>
        {filteredAndSorted.length > 0 && (
          <p className="text-xs text-slate-500 hidden sm:block">
            Sorted by: <span className="text-slate-300 capitalize">
              {sortOptions.find((o) => o.value === sortBy)?.label}
            </span>
          </p>
        )}
      </div>

      {/* Campaign Grid */}
      <LayoutGroup>
        {filteredAndSorted.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSorted.map((campaign, index) => (
                <motion.div
                  key={campaign.campaign_id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <CampaignCard campaign={campaign} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 glass-card"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-heading font-semibold text-white mb-2">
              No campaigns found
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              We couldn't find any campaigns matching your criteria. 
              Try adjusting your search or filters.
            </p>
            <button
              onClick={clearFilters}
              className="btn-secondary"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </LayoutGroup>
    </div>
  );
};

export default CampaignList;
