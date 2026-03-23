// src/components/home/MapPreviewSection.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer } from 'react-leaflet';
import { FiArrowRight } from 'react-icons/fi';
import { MAP_CONFIG } from '../../utils/mapConstants';
import { api } from '../../utils/api';
import { NGOMarker } from '../map/CustomMarker';
import { fadeInUp, staggerContainer } from '../../animations/variants';

const MapPreviewSection = () => {
  const [ngos, setNgos] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadNgos = async () => {
      try {
        const result = await api.getNGOs();
        if (isMounted && result?.success) {
          setNgos(Array.isArray(result.data) ? result.data : []);
        }
      } catch {
        if (isMounted) setNgos([]);
      }
    };

    loadNgos();
    return () => { isMounted = false; };
  }, []);

  const cityCount = useMemo(() => new Set(ngos.map((ngo) => `${ngo.city}-${ngo.state}`)).size, [ngos]);

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="page-container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Discover verified NGOs, ongoing campaigns, and donation centers 
              across India on our interactive map.
            </p>
          </motion.div>

          {/* Map Preview */}
          <motion.div
            variants={fadeInUp}
            className="relative rounded-2xl overflow-hidden border border-dark-border"
            style={{ height: '450px' }}
          >
            <MapContainer
              center={MAP_CONFIG.defaultCenter}
              zoom={5}
              zoomControl={false}
              scrollWheelZoom={false}
              dragging={false}
              style={{ height: '100%', width: '100%' }}
              className={MAP_CONFIG.mapClassName}
            >
              <TileLayer
                url={MAP_CONFIG.darkTileUrl}
                attribution={MAP_CONFIG.darkAttribution}
              />
              {ngos.map((ngo) => (
                <NGOMarker key={ngo.id} ngo={ngo} />
              ))}
            </MapContainer>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent 
                          to-transparent pointer-events-none z-[999]" />

            {/* CTA Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 z-[1000] text-center">
              <div className="flex items-center justify-center gap-6 mb-4">
                {[
                  { value: `${ngos.length}+`, label: 'Verified NGOs' },
                  { value: `${cityCount}+`, label: 'Cities' },
                  { value: `${ngos.reduce((sum, ngo) => sum + Number(ngo.activeCampaigns || 0), 0)}+`, label: 'Campaigns' },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-white font-bold text-lg">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Link to="/map">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  className="group inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r 
                           from-primary-600 to-blue-600 text-white font-semibold rounded-xl 
                           shadow-glow"
                >
                  Explore Full Map
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default MapPreviewSection;
