import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCamera, FiX, FiMaximize2, FiMinimize2, FiInfo,
  FiMapPin, FiHeart, FiUsers, FiZoomIn
} from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { fadeInUp, staggerContainer } from '../../animations/variants';

// Simulated AR impact markers
const AR_MARKERS = [
  {
    id: 1,
    type: 'education',
    title: 'School Renovation',
    impact: '250 children educated',
    amount: '₹3,50,000',
    icon: '📚',
    x: 25,
    y: 35,
    color: '#8b5cf6',
    pulse: true,
  },
  {
    id: 2,
    type: 'food',
    title: 'Community Kitchen',
    impact: '500 meals daily',
    amount: '₹1,20,000',
    icon: '🍲',
    x: 60,
    y: 45,
    color: '#f97316',
    pulse: true,
  },
  {
    id: 3,
    type: 'health',
    title: 'Medical Camp',
    impact: '150 patients treated',
    amount: '₹2,80,000',
    icon: '🏥',
    x: 40,
    y: 65,
    color: '#ef4444',
    pulse: false,
  },
  {
    id: 4,
    type: 'water',
    title: 'Water Purification',
    impact: '1000+ villagers',
    amount: '₹4,50,000',
    icon: '💧',
    x: 75,
    y: 25,
    color: '#06b6d4',
    pulse: true,
  },
];

const ARVisualization = () => {
  const { t } = useLanguage();
  const [isActive, setIsActive] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsActive(true);
      setCameraError(false);
      setTimeout(() => setShowTutorial(false), 3000);
    } catch (err) {
      setCameraError(true);
      // Fallback: Show simulated AR
      setIsActive(true);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsActive(false);
    setSelectedMarker(null);
    setIsFullscreen(false);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Pre-launch view
  if (!isActive) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={fadeInUp} className="glass-card overflow-hidden">
          {/* Preview Image */}
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200"
              alt="AR Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent" />

            {/* AR Simulation overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {AR_MARKERS.slice(0, 2).map((marker) => (
                <motion.div
                  key={marker.id}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: marker.id * 0.3 }}
                  className="absolute"
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg 
                             border-2 border-white/50 backdrop-blur-sm"
                    style={{ backgroundColor: `${marker.color}40` }}
                  >
                    {marker.icon}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="absolute bottom-6 left-6 right-6 text-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="btn-primary py-4 px-10 text-lg flex items-center justify-center gap-3 
                         mx-auto"
              >
                <FiCamera className="w-6 h-6" />
                {t('ar_launch')}
              </motion.button>
            </div>
          </div>

          {/* Info */}
          <div className="p-6">
            <span className="badge-purple mb-3">
              <FiCamera className="w-3 h-3" />
              {t('ar_badge')}
            </span>
            <h3 className="text-xl font-heading font-bold text-white mb-2">
              {t('ar_title')} <span className="gradient-text">{t('ar_title_highlight')}</span>
            </h3>
            <p className="text-sm text-slate-400">{t('ar_description')}</p>
          </div>
        </motion.div>

        {/* Impact Stats Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {AR_MARKERS.map((marker, idx) => (
            <motion.div
              key={marker.id}
              variants={fadeInUp}
              whileHover={{ y: -3 }}
              className="glass-card-hover p-4 text-center"
            >
              <span className="text-2xl block mb-2">{marker.icon}</span>
              <p className="text-white font-semibold text-xs mb-0.5">{marker.title}</p>
              <p className="text-[10px] text-slate-500">{marker.impact}</p>
              <p className="text-xs text-primary-400 font-semibold mt-1">{marker.amount}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Active AR view
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl border border-dark-border ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : '500px' }}
    >
      {/* Camera Feed or Simulated Background */}
      {cameraStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600"
            alt="Simulated AR"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-dark-bg/30" />
        </div>
      )}

      {/* AR Overlay Grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border border-primary-500/10"
             style={{
               backgroundImage: `linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)`,
               backgroundSize: '40px 40px',
             }}
        />
      </div>

      {/* AR Markers */}
      {AR_MARKERS.map((marker, idx) => (
        <motion.div
          key={marker.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 + idx * 0.3, type: 'spring' }}
          className="absolute cursor-pointer pointer-events-auto z-20"
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          onClick={() => setSelectedMarker(marker)}
        >
          {/* Pulse Ring */}
          {marker.pulse && (
            <motion.div
              animate={{
                scale: [1, 2.5],
                opacity: [0.4, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: marker.color }}
            />
          )}

          {/* Marker */}
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="relative w-12 h-12 rounded-full flex items-center justify-center text-xl 
                     border-2 border-white/60 shadow-lg backdrop-blur-md"
            style={{ backgroundColor: `${marker.color}80` }}
          >
            {marker.icon}
          </motion.div>

          {/* Label */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
            <div className="px-2 py-1 rounded-lg bg-dark-bg/80 backdrop-blur-sm border 
                          border-white/10 text-[10px] text-white text-center">
              {marker.title}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Selected Marker Detail */}
      <AnimatePresence>
        {selectedMarker && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-20 left-4 right-4 z-30 glass-card p-5 pointer-events-auto"
          >
            <button
              onClick={() => setSelectedMarker(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/5"
            >
              <FiX className="w-4 h-4 text-slate-400" />
            </button>

            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: `${selectedMarker.color}20` }}
              >
                {selectedMarker.icon}
              </div>
              <div>
                <h4 className="text-white font-semibold">{selectedMarker.title}</h4>
                <p className="text-sm text-slate-400 mt-1">{selectedMarker.impact}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-primary-400 font-bold">{selectedMarker.amount}</span>
                  <span className="badge-success">
                    <FiCheck className="w-3 h-3" />
                    {t('verified')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-dark-bg/60 flex items-center justify-center z-40 
                     pointer-events-auto"
            onClick={() => setShowTutorial(false)}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-center"
            >
              <FiZoomIn className="w-12 h-12 text-primary-400 mx-auto mb-3" />
              <p className="text-white font-medium">{t('ar_scan')}</p>
              <p className="text-xs text-slate-400 mt-1">Tap markers to see impact details</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between z-30 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="badge bg-dark-bg/70 backdrop-blur-sm border-white/10 text-white">
            <span className="status-dot-online" />
            AR Active
          </span>
          <span className="badge bg-dark-bg/70 backdrop-blur-sm border-white/10 text-slate-300">
            {AR_MARKERS.length} markers
          </span>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl bg-dark-bg/70 backdrop-blur-sm border border-white/10 
                     flex items-center justify-center text-white"
          >
            {isFullscreen ? (
              <FiMinimize2 className="w-4 h-4" />
            ) : (
              <FiMaximize2 className="w-4 h-4" />
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={stopCamera}
            className="w-9 h-9 rounded-xl bg-red-500/80 backdrop-blur-sm border border-red-400/30 
                     flex items-center justify-center text-white"
          >
            <FiX className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-auto">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-dark-bg/70 
                      backdrop-blur-xl border border-white/10">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-white font-bold text-sm">₹12.4L</p>
              <p className="text-[9px] text-slate-400">{t('ar_total_impact')}</p>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <p className="text-white font-bold text-sm">4</p>
              <p className="text-[9px] text-slate-400">Impact Areas</p>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-center">
              <p className="text-white font-bold text-sm">1,900+</p>
              <p className="text-[9px] text-slate-400">Lives Touched</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARVisualization;