// src/pages/MapPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import NearbyNGOSearch from '../components/map/NearbyNGOSearch';
import RealTimePickupTracking from '../components/map/RealTimePickupTracking';
import { pageTransition } from '../animations/variants';

const MapPage = () => {
  return (
    <motion.div {...pageTransition} className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <span className="text-xl">🗺️</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-white">
                Explore <span className="gradient-text">NGOs & Campaigns</span>
              </h1>
              <p className="text-sm text-slate-400">
                Discover verified NGOs, campaigns, and donation centers near you
              </p>
            </div>
          </div>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <NearbyNGOSearch height="calc(100vh - 250px)" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <RealTimePickupTracking />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MapPage;