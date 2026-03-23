// src/components/map/CampaignLocationMap.jsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { FiMapPin, FiExternalLink, FiNavigation, FiZoomIn } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { MAP_CONFIG } from '../../utils/mapConstants';

const ngoIcon = L.divIcon({
  className: 'custom-marker-icon',
  iconSize: [46, 46],
  iconAnchor: [23, 46],
  popupAnchor: [0, -46],
  html: `
    <div style="
      width: 46px; height: 46px;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 20px rgba(139,92,246,0.55);
      border: 3px solid rgba(255,255,255,0.85);
    ">
      <span style="transform: rotate(45deg); font-size: 20px;">🏢</span>
    </div>
  `,
});

const campaignIcon = L.divIcon({
  className: 'custom-marker-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  html: `
    <div style="
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 5px 16px rgba(34,197,94,0.5);
      border: 3px solid rgba(255,255,255,0.85);
    ">
      <span style="transform: rotate(45deg); font-size: 16px;">🎯</span>
    </div>
  `,
});

/**
 * CampaignLocationMap
 * Props:
 *   campaign - campaign object (should have ngo_lat, ngo_lng, ngo_name, ngo_address or lat/lng)
 *   height   - CSS height string (default '320px')
 */
const CampaignLocationMap = ({ campaign, height = '320px' }) => {
  const [zoomed, setZoomed] = useState(false);

  // Fallback coordinates from mapConstants NGO data if campaign doesn't carry coords
  const ngoLat  = campaign?.ngo_lat  ?? campaign?.lat  ?? 19.076;
  const ngoLng  = campaign?.ngo_lng  ?? campaign?.lng  ?? 72.8777;
  const ngoName = campaign?.ngo_name ?? 'NGO Office';
  const ngoAddr = campaign?.ngo_address ?? campaign?.address ?? 'Location on map';

  const center = [ngoLat, ngoLng];

  const openGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${ngoLat},${ngoLng}`, '_blank');
  };

  const openNavigation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          window.open(
            `https://www.google.com/maps/dir/${latitude},${longitude}/${ngoLat},${ngoLng}`,
            '_blank'
          );
        },
        () => window.open(`https://www.google.com/maps?q=${ngoLat},${ngoLng}`, '_blank')
      );
    } else {
      window.open(`https://www.google.com/maps?q=${ngoLat},${ngoLng}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <FiMapPin className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">NGO Location</h3>
            <p className="text-[11px] text-slate-500">Where your donation goes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setZoomed(!zoomed)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 
                     hover:text-white transition-colors"
            title="Toggle zoom"
          >
            <FiZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={openGoogleMaps}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 
                     hover:text-white transition-colors"
            title="Open in Google Maps"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: zoomed ? '420px' : height }} className="transition-all duration-300">
        <MapContainer
          center={center}
          zoom={14}
          zoomControl={false}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          className={MAP_CONFIG.mapClassName}
        >
          <TileLayer
            url={MAP_CONFIG.darkTileUrl}
            attribution={MAP_CONFIG.darkAttribution}
          />
          <ZoomControl position="bottomright" />

          {/* Radius circle */}
          <Circle
            center={center}
            radius={500}
            pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf620', fillOpacity: 0.35, weight: 1.5 }}
          />

          {/* NGO Marker */}
          <Marker position={center} icon={ngoIcon}>
            <Popup maxWidth={260} minWidth={220}>
              <div className="p-3 bg-[#1e293b]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏢</span>
                  <h4 className="text-white font-semibold text-sm">{ngoName}</h4>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-slate-400 mb-3">
                  <FiMapPin className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                  <span>{ngoAddr}</span>
                </div>
                <button
                  onClick={openNavigation}
                  className="w-full py-1.5 bg-purple-600 text-white text-xs rounded-lg
                           hover:bg-purple-500 transition-colors flex items-center justify-center gap-1"
                >
                  <FiNavigation className="w-3 h-3" /> Get Directions
                </button>
              </div>
            </Popup>
          </Marker>

          {/* Campaign marker (slightly offset) */}
          {campaign?.campaign_lat && campaign?.campaign_lng && (
            <Marker
              position={[campaign.campaign_lat, campaign.campaign_lng]}
              icon={campaignIcon}
            >
              <Popup maxWidth={220}>
                <div className="p-3 bg-[#1e293b]">
                  <h4 className="text-white font-semibold text-xs mb-1">{campaign.title}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px]">
                    Active Campaign
                  </span>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Footer */}
      <div className="p-4 pt-3 flex items-center justify-between">
        <div className="flex items-start gap-2">
          <FiMapPin className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 line-clamp-1">{ngoAddr}</p>
        </div>
        <button
          onClick={openNavigation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 
                   border border-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/20 
                   transition-colors whitespace-nowrap ml-3"
        >
          <FiNavigation className="w-3 h-3" />
          Navigate
        </button>
      </div>
    </motion.div>
  );
};

export default CampaignLocationMap;

