import React from 'react';
import { motion } from 'framer-motion';
import { GALLERY_IMAGES } from '../../utils/constants';
import { fadeInUp, staggerContainer } from '../../animations/variants';
import { useLanguage } from '../../context/LanguageContext';

const GallerySection = () => {
  const { t } = useLanguage();

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="page-container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-teal-500/10 border 
                         border-teal-500/20 text-teal-400 text-sm font-medium mb-4">
              {t('gallery_badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
              {t('gallery_title')} <span className="gradient-text">{t('gallery_title_highlight')}</span>
            </h2>
          </motion.div>

          {/* Masonry Grid */}
          <motion.div
            variants={staggerContainer}
            className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
          >
            {GALLERY_IMAGES.map((item, idx) => {
              const imageSrc = typeof item === 'string' ? item : item.src;
              const imageAlt = typeof item === 'string'
                ? `NGO donation gallery ${idx + 1}`
                : (item.alt || `NGO donation gallery ${idx + 1}`);
              const imageTitle = typeof item === 'string' ? '' : (item.title || '');
              const imageSubtitle = typeof item === 'string' ? '' : (item.subtitle || '');

              return (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="break-inside-avoid rounded-2xl overflow-hidden group cursor-pointer 
                         relative"
              >
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="w-full h-auto object-cover group-hover:scale-110 transition-transform 
                           duration-700"
                  style={{ height: idx % 3 === 0 ? '300px' : idx % 3 === 1 ? '200px' : '250px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-transparent 
                              to-transparent opacity-0 group-hover:opacity-100 transition-opacity 
                              duration-300 flex items-end p-4">
                  {(imageTitle || imageSubtitle) && (
                    <div>
                      <p className="text-white text-sm font-semibold">{imageTitle}</p>
                      <p className="text-slate-300 text-xs">{imageSubtitle}</p>
                    </div>
                  )}
                </div>
              </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default GallerySection;