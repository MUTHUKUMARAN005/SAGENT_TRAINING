import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiClock, FiHeart, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ProgressBar from '../common/ProgressBar';
import { fadeInUp } from '../../animations/variants';
import { useWishlist } from '../../hooks/useWishlist';

const CampaignCard = ({ campaign }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24))
  );
  const percentage = ((campaign.collected_amount / campaign.target_amount) * 100).toFixed(0);
  const liked = isWishlisted(campaign.campaign_id);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { added } = toggleWishlist(campaign);
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -8 }}
      className="glass-card overflow-hidden group"
    >
      <Link to={`/donate/${campaign.campaign_id}`}>
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          <motion.img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.7 }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://picsum.photos/seed/kindwave-fallback/1200/800';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/20 to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 
                         text-green-400 text-xs font-medium backdrop-blur-sm">
              ● Active
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 
                         text-white text-xs font-medium backdrop-blur-sm capitalize">
              {campaign.donation_type}
            </span>
          </div>

          {/* Favorite Button */}
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm 
                     flex items-center justify-center hover:bg-red-500/30 transition-colors"
            onClick={handleWishlist}
          >
            <FiHeart className={`w-4 h-4 text-white ${liked ? 'fill-red-400 text-red-300' : ''}`} />
          </motion.button>

          {/* Percentage Badge */}
          <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-primary-500/20 
                       backdrop-blur-sm border border-primary-500/30">
            <span className="text-primary-400 text-sm font-bold">{percentage}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
              <span className="text-xs">🏢</span>
            </div>
            <span className="text-xs text-primary-400 font-medium">{campaign.ngo_name}</span>
          </div>

          <h3 className="text-lg font-heading font-semibold text-white mb-2 line-clamp-2 
                       group-hover:text-primary-400 transition-colors duration-300">
            {campaign.title}
          </h3>
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">{campaign.description}</p>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold text-sm">
                ₹{(campaign.collected_amount / 1000).toFixed(0)}K
              </span>
              <span className="text-slate-500 text-xs">
                Goal: ₹{(campaign.target_amount / 1000).toFixed(0)}K
              </span>
            </div>
            <ProgressBar
              value={campaign.collected_amount}
              max={campaign.target_amount}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <FiUsers className="w-3.5 h-3.5" />
                {campaign.donors_count}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <FiClock className="w-3.5 h-3.5" />
                {daysLeft}d left
              </span>
            </div>
            <span className="flex items-center gap-1 text-sm text-primary-400 font-medium 
                         group-hover:gap-2 transition-all">
              Donate <FiArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CampaignCard;