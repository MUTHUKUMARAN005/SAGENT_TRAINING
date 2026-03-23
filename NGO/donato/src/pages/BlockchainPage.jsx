import React from 'react';
import { motion } from 'framer-motion';
import BlockchainTracker from '../components/blockchain/BlockchainTracker';
import { pageTransition } from '../animations/variants';
import { useLanguage } from '../context/LanguageContext';

const BlockchainPage = () => {
  const { t } = useLanguage();

  const demoDonation = {
    amount: 5000,
    ngoName: 'Education For All Foundation',
    campaignTitle: 'Educate Underprivileged Children',
  };

  return (
    <motion.div {...pageTransition} className="pt-24 pb-16">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-glow-gradient opacity-20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">
            {t('blockchain_title')} <span className="gradient-text">{t('blockchain_title_highlight')}</span>
          </h1>
          <p className="text-slate-400 mt-2 max-w-3xl">
            {t('blockchain_description')}
          </p>
        </div>

        <BlockchainTracker donation={demoDonation} showTrail showStats />
      </div>
    </motion.div>
  );
};

export default BlockchainPage;
