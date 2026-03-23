import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiLink, FiCheck, FiClock, FiShield, FiExternalLink,
  FiCopy, FiChevronDown, FiBox, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { fadeInUp, staggerContainer } from '../../animations/variants';

// Simulated blockchain data
const generateHash = () => '0x' + Array.from({ length: 64 }, () =>
  Math.floor(Math.random() * 16).toString(16)).join('');

const generateBlockData = (donation) => ({
  txHash: generateHash(),
  blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
  timestamp: new Date().toISOString(),
  from: '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join(''),
  to: '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join(''),
  amount: donation?.amount || 5000,
  gasUsed: Math.floor(Math.random() * 50000) + 21000,
  status: 'confirmed',
  confirmations: Math.floor(Math.random() * 100) + 12,
  network: 'Polygon',
  contractAddress: '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)).join(''),
});

const BlockchainTracker = ({ donation = {}, showTrail = true, showStats = true }) => {
  const { t } = useLanguage();
  const [blockData, setBlockData] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedTx, setExpandedTx] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBlockData(generateBlockData(donation));
      setLoading(false);
    }, 1500);

    // Animate trail steps
    const stepTimer = setInterval(() => {
      setActiveStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(stepTimer);
    };
  }, [donation]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const truncateHash = (hash) =>
    hash ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : '';

  const trailSteps = [
    {
      id: 1,
      title: t('blockchain_donated'),
      subtitle: `₹${(donation.amount || 5000).toLocaleString()} ${t('donate_monetary')}`,
      icon: '💰',
      color: 'from-blue-500 to-primary-500',
      status: 'confirmed',
      time: '2 mins ago',
      hash: blockData?.txHash,
    },
    {
      id: 2,
      title: t('blockchain_received'),
      subtitle: donation.ngoName || 'Education For All Foundation',
      icon: '🏢',
      color: 'from-green-500 to-emerald-500',
      status: 'confirmed',
      time: '1 min ago',
      hash: generateHash(),
    },
    {
      id: 3,
      title: t('blockchain_allocated'),
      subtitle: donation.campaignTitle || 'Educate Underprivileged Children',
      icon: '🎯',
      color: 'from-purple-500 to-pink-500',
      status: 'confirmed',
      time: '30 secs ago',
      hash: generateHash(),
    },
    {
      id: 4,
      title: t('blockchain_utilized'),
      subtitle: '500 students received textbooks',
      icon: '✅',
      color: 'from-accent-orange to-red-500',
      status: activeStep >= 4 ? 'confirmed' : 'pending',
      time: activeStep >= 4 ? 'Just now' : 'Processing...',
      hash: activeStep >= 4 ? generateHash() : null,
    },
  ];

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-3 border-primary-500/30 border-t-primary-500 
                     rounded-full mb-4"
          />
          <p className="text-sm text-slate-400">Verifying on blockchain...</p>
          <p className="text-xs text-slate-600 mt-1">Network: Polygon</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Card */}
      <motion.div variants={fadeInUp} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center 
                          justify-center">
              <FiLink className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                {t('blockchain_badge')}
                <FiShield className="w-4 h-4 text-green-400" />
              </h3>
              <p className="text-xs text-slate-400">
                Network: <span className="text-primary-400">Polygon (MATIC)</span>
              </p>
            </div>
          </div>
          <span className="badge-success">
            <span className="status-dot-online" />
            {t('blockchain_confirmed')}
          </span>
        </div>

        {/* Transaction Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              label: t('blockchain_hash'),
              value: truncateHash(blockData?.txHash),
              full: blockData?.txHash,
              copyable: true,
            },
            {
              label: t('blockchain_block'),
              value: `#${blockData?.blockNumber?.toLocaleString()}`,
              copyable: false,
            },
            {
              label: t('blockchain_from'),
              value: truncateHash(blockData?.from),
              full: blockData?.from,
              copyable: true,
            },
            {
              label: t('blockchain_to'),
              value: truncateHash(blockData?.to),
              full: blockData?.to,
              copyable: true,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-white/3 
                       border border-white/5"
            >
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-sm text-white font-mono">{item.value}</p>
              </div>
              {item.copyable && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyToClipboard(item.full, item.label)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 
                           hover:text-primary-400 transition-colors"
                >
                  <FiCopy className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          ))}
        </div>

        {/* View on Explorer */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full py-2.5 rounded-xl border border-primary-500/20 text-primary-400 
                   text-sm font-medium flex items-center justify-center gap-2 
                   hover:bg-primary-500/5 transition-colors"
        >
          <FiExternalLink className="w-4 h-4" />
          {t('blockchain_view_chain')}
        </motion.button>
      </motion.div>

      {/* Donation Trail */}
      {showTrail && (
        <motion.div variants={fadeInUp} className="glass-card p-6">
          <h3 className="text-lg font-heading font-semibold text-white mb-6 flex items-center gap-2">
            <FiBox className="w-5 h-5 text-primary-400" />
            {t('blockchain_trail')}
          </h3>

          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/5" />

            <div className="space-y-0">
              {trailSteps.map((step, idx) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: activeStep >= idx ? 1 : 0.3,
                    x: 0,
                  }}
                  transition={{ delay: idx * 0.3, duration: 0.5 }}
                  className="relative flex gap-4 pb-8 last:pb-0"
                >
                  {/* Step Icon */}
                  <div className="relative z-10">
                    <motion.div
                      animate={
                        activeStep === idx
                          ? {
                              scale: [1, 1.2, 1],
                              boxShadow: [
                                '0 0 0 0 rgba(59,130,246,0)',
                                '0 0 0 10px rgba(59,130,246,0.2)',
                                '0 0 0 0 rgba(59,130,246,0)',
                              ],
                            }
                          : {}
                      }
                      transition={{ duration: 1.5, repeat: activeStep === idx ? Infinity : 0 }}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl
                                bg-gradient-to-br ${step.color} ${
                                  activeStep >= idx ? 'opacity-100' : 'opacity-30'
                                }`}
                    >
                      {step.status === 'confirmed' ? step.icon : '⏳'}
                    </motion.div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white font-semibold text-sm">{step.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{step.subtitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`badge ${
                            step.status === 'confirmed' ? 'badge-success' : 'badge-warning'
                          }`}
                        >
                          {step.status === 'confirmed' ? (
                            <FiCheck className="w-3 h-3" />
                          ) : (
                            <FiClock className="w-3 h-3" />
                          )}
                          {step.status === 'confirmed'
                            ? t('blockchain_confirmed')
                            : t('blockchain_pending')}
                        </span>
                        <p className="text-[10px] text-slate-600 mt-1">{step.time}</p>
                      </div>
                    </div>

                    {/* Transaction Hash */}
                    {step.hash && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 p-2 rounded-lg bg-white/3 flex items-center justify-between"
                      >
                        <span className="text-[10px] text-slate-500 font-mono">
                          {truncateHash(step.hash)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(step.hash, 'Hash')}
                            className="p-1 rounded hover:bg-white/5 text-slate-500"
                          >
                            <FiCopy className="w-3 h-3" />
                          </button>
                          <button className="p-1 rounded hover:bg-white/5 text-slate-500">
                            <FiExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {showStats && (
        <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-4">
          {[
            {
              icon: FiShield,
              label: t('blockchain_smart_contract'),
              value: t('verified'),
              color: 'text-green-400 bg-green-500/10',
            },
            {
              icon: FiLink,
              label: t('blockchain_immutable'),
              value: t('blockchain_confirmed'),
              color: 'text-primary-400 bg-primary-500/10',
            },
            {
              icon: FiCheck,
              label: t('blockchain_transparent'),
              value: `${blockData?.confirmations || 0} blocks`,
              color: 'text-purple-400 bg-purple-500/10',
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -3 }}
              className="glass-card-hover p-4 text-center"
            >
              <div
                className={`w-10 h-10 mx-auto mb-2 rounded-xl ${stat.color} 
                           flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-white font-semibold text-sm">{stat.value}</p>
              <p className="text-[10px] text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default BlockchainTracker;