// Update src/pages/HomePage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import HeroSection from '../components/home/HeroSection';
import UrgentNeedsBannerSection from '../components/home/UrgentNeedsBannerSection';
import FeaturedCampaigns from '../components/home/FeaturedCampaigns';
import RealTimeCampaignsSection from '../components/home/RealTimeCampaignsSection';
import StatsCounter from '../components/home/StatsCounter';
import ImpactSection from '../components/home/ImpactSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import GallerySection from '../components/home/GallerySection';
import { pageTransition } from '../animations/variants';

const HomePage = () => {
  return (
    <motion.div {...pageTransition}>
      <HeroSection />
      <UrgentNeedsBannerSection />
      <StatsCounter />
      <FeaturedCampaigns />
      <RealTimeCampaignsSection />
      <ImpactSection />
      <TestimonialsSection />
      <GallerySection />
    </motion.div>
  );
};

export default HomePage;
