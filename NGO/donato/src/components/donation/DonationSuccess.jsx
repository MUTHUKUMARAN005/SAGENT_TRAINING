// src/components/donation/DonationSuccess.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCheckCircle, FiDownload, FiShare2, FiArrowRight,
  FiMail
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getDonationImpact } from '../../utils/donationImpact';

const DonationSuccess = ({
  donation = {},
  campaign = {},
  showConfetti = true,
}) => {
  const [confettiActive, setConfettiActive] = useState(showConfetti);

  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setConfettiActive(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const receiptNumber = donation.receipt_number || `REC-${Date.now()}`;
  const donationDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const impact = useMemo(
    () => getDonationImpact({
      amount: donation.amount,
      donationType: donation.donation_type || donation.type || campaign.donation_type,
      campaign,
    }),
    [campaign, donation.amount, donation.donation_type, donation.type]
  );

  const handleDownloadReceipt = () => {
    toast.success('Receipt downloaded! 📄');
  };

  const handleShare = async () => {
    const shareText = `I just donated ₹${donation.amount?.toLocaleString()} to "${campaign.title}" on KindWave! Join me in making a difference. 🤝`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'KindWave - Donation',
          text: shareText,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Share text copied to clipboard!');
      }
    } catch (err) {
      // User cancelled
    }
  };

  const handleEmailReceipt = () => {
    toast.success('Receipt sent to your email! 📧');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative"
    >
      {/* Confetti Particles */}
      {confettiActive && <Confetti />}

      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 
                        border-b border-green-500/10 p-8 text-center">
            {/* Animated Checkmark */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 border-2 
                       border-green-500 flex items-center justify-center"
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <FiCheckCircle className="w-10 h-10 text-green-400" />
              </motion.div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-heading font-bold text-white mb-2"
            >
              Donation Successful!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-slate-300 text-sm"
            >
              Thank you for your generous donation
            </motion.p>
          </div>

          {/* Details */}
          <div className="p-6">
            {/* Amount */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mb-6"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Amount Donated
              </p>
              <p className="text-4xl font-heading font-bold gradient-text">
                ₹{donation.amount?.toLocaleString() || '0'}
              </p>
            </motion.div>

            {/* Receipt Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3 mb-6"
            >
              <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                <span className="text-sm text-slate-400">Campaign</span>
                <span className="text-sm text-white font-medium text-right max-w-[200px] truncate">
                  {campaign.title || 'Campaign'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                <span className="text-sm text-slate-400">Receipt No.</span>
                <span className="text-sm text-primary-400 font-mono">{receiptNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                <span className="text-sm text-slate-400">Date</span>
                <span className="text-sm text-white">{donationDate}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                <span className="text-sm text-slate-400">Payment Method</span>
                <span className="text-sm text-white capitalize">
                  {donation.payment_method || 'UPI'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-slate-400">Status</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
                             bg-green-500/10 text-green-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  Completed
                </span>
              </div>
            </motion.div>

            {/* Impact Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/10 mb-6 
                       text-center"
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary-500/10 flex items-center justify-center text-lg">
                {impact.icon}
              </div>
              <p className="text-sm text-slate-300">
                {impact.shortHeadline}
                <br />
                <span className="text-primary-400 font-medium">
                  {impact.detail}
                </span>
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadReceipt}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 
                           border border-white/10 hover:border-primary-500/30 transition-all"
                >
                  <FiDownload className="w-5 h-5 text-primary-400" />
                  <span className="text-xs text-slate-400">Download</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEmailReceipt}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 
                           border border-white/10 hover:border-primary-500/30 transition-all"
                >
                  <FiMail className="w-5 h-5 text-primary-400" />
                  <span className="text-xs text-slate-400">Email</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 
                           border border-white/10 hover:border-primary-500/30 transition-all"
                >
                  <FiShare2 className="w-5 h-5 text-primary-400" />
                  <span className="text-xs text-slate-400">Share</span>
                </motion.button>
              </div>

              <Link to="/campaigns">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-primary py-3.5 flex items-center justify-center gap-2"
                >
                  Donate to Another Campaign
                  <FiArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>

              <Link to="/dashboard" className="block">
                <button className="w-full py-3 border border-white/10 rounded-xl text-slate-300 
                               hover:bg-white/5 transition-colors text-sm">
                  View Donation History
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Simple confetti component
const Confetti = () => {
  const colors = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#eab308', '#14b8a6', '#8b5cf6'];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: -20,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: '110vh',
            rotate: p.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '0' : '2px',
          }}
        />
      ))}
    </div>
  );
};

export default DonationSuccess;
