import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiHeart, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { pageTransition } from '../animations/variants';
import { useWishlist } from '../hooks/useWishlist';

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist } = useWishlist();

  return (
    <motion.div {...pageTransition} className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white">My Wishlist</h1>
            <p className="text-slate-400 text-sm mt-1">
              Saved campaigns you want to support later.
            </p>
          </div>
          <Link
            to="/dashboard/donor"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4">
              <FiHeart className="w-7 h-7 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No campaigns saved yet</h2>
            <p className="text-slate-400 text-sm mb-6">
              Tap the heart icon on any campaign to add it to your wishlist.
            </p>
            <Link to="/campaigns" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
              Browse Campaigns
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {wishlistItems.map((item) => (
              <div key={item.campaign_id} className="glass-card overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-44 object-cover" />
                <div className="p-5">
                  <p className="text-xs text-primary-400 mb-1">{item.ngo_name}</p>
                  <h3 className="text-white font-semibold line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 capitalize">{item.donation_type} donation</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Link
                      to={`/campaigns/${item.campaign_id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 text-sm"
                    >
                      <FiExternalLink className="w-4 h-4" />
                      Open
                    </Link>
                    <button
                      onClick={() => removeFromWishlist(item.campaign_id)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 text-sm"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WishlistPage;

