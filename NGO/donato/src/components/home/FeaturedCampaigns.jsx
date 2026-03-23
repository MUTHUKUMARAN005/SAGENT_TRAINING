import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiUsers, FiClock, FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { fadeInUp, staggerContainer } from '../../animations/variants';
import ProgressBar from '../common/ProgressBar';
import AnimatedCard from '../common/AnimatedCard';
import { useWishlist } from '../../hooks/useWishlist';

const FeaturedCampaigns = () => {
  const [hoveredId, setHoveredId] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    let isMounted = true;

    const fetchFeatured = async () => {
      const result = await api.getCampaigns();
      if (isMounted) {
        const rows = Array.isArray(result?.data) ? result.data : [];
        setCampaigns(rows.slice(0, 3));
      }
    };

    fetchFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="section-padding relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-glow-gradient opacity-30 pointer-events-none" />

      <div className="page-container relative">
        {/* Section Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeInUp}
            className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border 
                     border-primary-500/20 text-primary-400 text-sm font-medium mb-4"
          >
            Featured Campaigns
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4"
          >
            Support Causes That <span className="gradient-text">Matter</span>
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-slate-400 max-w-2xl mx-auto text-lg"
          >
            Every donation creates ripples of change. Browse verified campaigns and 
            contribute to causes close to your heart.
          </motion.p>
        </motion.div>

        {/* Campaign Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {campaigns.map((campaign) => (
            <motion.div key={campaign.campaign_id} variants={fadeInUp}>
              <AnimatedCard>
                <Link to={`/donate/${campaign.campaign_id}`}>
                  <div
                    className="glass-card overflow-hidden group"
                    onMouseEnter={() => setHoveredId(campaign.campaign_id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden">
                      <motion.img
                        src={campaign.image}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://picsum.photos/seed/kindwave-fallback/1200/800';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent" />

                      {/* Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-green-500/20 border 
                                     border-green-500/30 text-green-400 text-xs font-medium 
                                     backdrop-blur-sm">
                          ● Active
                        </span>
                      </div>

                      {/* Favorite */}
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 
                                 backdrop-blur-sm flex items-center justify-center 
                                 hover:bg-red-500/20 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const { added } = toggleWishlist(campaign);
                          toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
                        }}
                      >
                        <FiHeart
                          className={`w-4 h-4 text-white ${
                            isWishlisted(campaign.campaign_id) ? 'fill-red-400 text-red-300' : ''
                          }`}
                        />
                      </motion.button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-xs text-primary-400 font-medium mb-2">
                        {campaign.ngo_name}
                      </p>
                      <h3 className="text-lg font-heading font-semibold text-white mb-2 
                                   group-hover:text-primary-400 transition-colors line-clamp-2">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                        {campaign.description}
                      </p>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-white font-semibold">
                            ₹{(campaign.collected_amount / 1000).toFixed(0)}K raised
                          </span>
                          <span className="text-slate-400">
                            of ₹{(campaign.target_amount / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <ProgressBar
                          value={campaign.collected_amount}
                          max={campaign.target_amount}
                          colorClass={
                            (campaign.collected_amount / campaign.target_amount) > 0.7
                              ? 'from-green-500 to-emerald-400'
                              : 'from-primary-500 to-blue-400'
                          }
                        />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <FiUsers className="w-3.5 h-3.5" />
                            {campaign.donors_count} donors
                          </span>
                          <span className="flex items-center gap-1">
                            <FiClock className="w-3.5 h-3.5" />
                            {Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24))} days left
                          </span>
                        </div>
                        <motion.span
                          animate={hoveredId === campaign.campaign_id ? { x: 5 } : { x: 0 }}
                          className="text-primary-400"
                        >
                          <FiArrowRight className="w-5 h-5" />
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimatedCard>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/campaigns">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group inline-flex items-center gap-2 px-8 py-3 border-2 
                       border-primary-500/30 text-primary-400 font-semibold rounded-xl 
                       hover:bg-primary-500/10 hover:border-primary-500 transition-all"
            >
              View All Campaigns
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedCampaigns;
