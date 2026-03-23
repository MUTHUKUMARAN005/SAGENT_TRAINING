import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { FiArrowRight, FiPlay, FiHeart, FiUsers, FiTrendingUp } from 'react-icons/fi';
import ParticleBackground from '../common/ParticleBackground';
import { HERO_IMAGES } from '../../utils/constants';
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer } from '../../animations/variants';

const HeroSection = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { icon: FiHeart, value: '₹12.4L+', label: 'Donated' },
    { icon: FiUsers, value: '4,200+', label: 'Donors' },
    { icon: FiTrendingUp, value: '58', label: 'NGOs' },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Images with Transition */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <img
              src={HERO_IMAGES[currentImage]}
              alt="Hero background"
              className="w-full h-full object-cover object-center brightness-[0.88] contrast-110 saturate-110"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/80 via-dark-bg/45 to-dark-bg/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/55 via-dark-bg/10 to-transparent" />
      </div>

      {/* Particles */}
      <ParticleBackground />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full 
                           bg-primary-500/10 border border-primary-500/20 text-primary-400 
                           text-sm font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Trusted by 4,200+ donors across India
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold 
                       leading-tight mb-6"
            >
              Make a{' '}
              <span className="gradient-text relative">
                Difference
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <motion.path
                    d="M2 10C60 2 120 2 150 6C180 10 240 10 298 2"
                    stroke="url(#grad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                  />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="300" y2="0">
                      <stop stopColor="#3b82f6" />
                      <stop offset="1" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              ,<br />
              <span className="text-white">Change </span>
              <TypeAnimation
                sequence={[
                  'Lives',
                  2000,
                  'Communities',
                  2000,
                  'Futures',
                  2000,
                  'the World',
                  2000,
                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
                className="gradient-text-warm"
              />
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeInUp}
              className="text-lg text-slate-400 mb-8 max-w-lg leading-relaxed"
            >
              Donate seamlessly to verified campaigns. Track every rupee. 
              See the real impact of your generosity through our transparent platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 mb-12">
              <Link to="/campaigns">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r 
                           from-primary-600 to-blue-600 text-white font-semibold rounded-xl 
                           shadow-glow transition-all"
                >
                  Donate Now
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-8 py-4 border-2 border-white/20 
                           text-white font-semibold rounded-xl hover:border-primary-500 
                           hover:bg-primary-500/10 transition-all"
                >
                  <FiPlay className="w-5 h-5" />
                  See How It Works
                </motion.button>
              </Link>
            </motion.div>

            {/* Mini Stats */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center gap-8"
            >
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <stat.icon className="w-5 h-5 text-primary-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Floating Card */}
          <motion.div
            variants={fadeInRight}
            initial="hidden"
            animate="visible"
            className="hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              {/* Main Card */}
              <div className="glass-card p-6 max-w-md ml-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center 
                                justify-center">
                    <FiHeart className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Latest Donation</p>
                    <p className="text-xs text-slate-400">Just now</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm mb-4">
                  Rahul donated <span className="text-green-400 font-bold">₹5,000</span> to 
                  "Educate Underprivileged Children"
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 
                                 to-blue-600 border-2 border-dark-bg flex items-center 
                                 justify-center text-xs text-white font-bold"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">+245 donors</span>
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div
                animate={{ y: [0, -5, 0], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -top-4 -left-4 glass-card px-4 py-2 flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-accent-orange/20 rounded-lg flex items-center 
                              justify-center text-accent-orange text-lg">
                  🎯
                </div>
                <div>
                  <p className="text-xs text-slate-400">Active Campaigns</p>
                  <p className="text-lg font-bold text-white">27</p>
                </div>
              </motion.div>

              {/* Success Badge */}
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-4 -right-4 glass-card px-4 py-2 flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center 
                              justify-center text-green-400">
                  ✓
                </div>
                <div>
                  <p className="text-xs text-slate-400">Verified & Trusted</p>
                  <p className="text-sm font-bold text-green-400">100% Transparent</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start 
                      justify-center p-1.5">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-primary-400 rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;