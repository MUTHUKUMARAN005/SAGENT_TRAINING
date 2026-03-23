// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiArrowLeft, FiSearch } from 'react-icons/fi';
import { pageTransition } from '../animations/variants';

const NotFoundPage = () => {
  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen flex items-center justify-center px-4 py-20"
    >
      <div className="text-center max-w-lg">
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="mb-8"
        >
          <h1 className="text-[120px] md:text-[180px] font-heading font-black leading-none">
            <span className="gradient-text">4</span>
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block text-white"
            >
              0
            </motion.span>
            <span className="gradient-text">4</span>
          </h1>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl md:text-3xl font-heading font-bold text-white mb-4"
        >
          Page Not Found
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 mb-8 max-w-md mx-auto"
        >
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track!
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center gap-2"
            >
              <FiHome className="w-4 h-4" />
              Go Home
            </motion.button>
          </Link>
          <Link to="/campaigns">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary flex items-center gap-2"
            >
              <FiSearch className="w-4 h-4" />
              Browse Campaigns
            </motion.button>
          </Link>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <button
            onClick={() => window.history.back()}
            className="text-sm text-slate-500 hover:text-primary-400 transition-colors 
                     flex items-center gap-1 mx-auto"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;