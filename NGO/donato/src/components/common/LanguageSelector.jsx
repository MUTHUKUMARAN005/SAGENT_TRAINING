import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGlobe, FiCheck, FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSelector = ({ variant = 'dropdown', className = '' }) => {
  const { language, setLanguage, languages, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              language === lang.code
                ? 'bg-primary-600 text-white shadow-glow'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="mr-1">{lang.flag}</span>
            {lang.nativeLabel}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 
                 hover:border-primary-500/30 transition-all text-sm"
      >
        <FiGlobe className="w-4 h-4 text-primary-400" />
        <span className="text-slate-300">{currentLanguage.flag}</span>
        <span className="text-slate-300 hidden sm:inline">{currentLanguage.nativeLabel}</span>
        <FiChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-52 glass-card py-2 shadow-2xl z-50"
            >
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                  Select Language
                </p>
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    language === lang.code
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{lang.nativeLabel}</p>
                    <p className="text-[10px] text-slate-500">{lang.label}</p>
                  </div>
                  {language === lang.code && (
                    <FiCheck className="w-4 h-4 text-primary-400" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;