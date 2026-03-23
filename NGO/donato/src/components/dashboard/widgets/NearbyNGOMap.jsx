// src/components/dashboard/widgets/NearbyNGOMap.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { FiMapPin, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { MAP_CONFIG, NGO_FALLBACK_IMAGE } from '../../../utils/mapConstants';
import { api } from '../../../utils/api';
import { NGOMarker } from '../../map/CustomMarker';

const userIcon = L.divIcon({
  className: 'custom-marker-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  html: `
    <div style="
      width: 24px; height: 24px;
      background: #3b82f6;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 8px rgba(15,23,42,0.45);
      position: relative;
    "></div>
  `,
});

const NearbyNGOMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [nearbyNGOs, setNearbyNGOs] = useState([]);

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

  useEffect(() => {
    if (ngos.length === 0) {
      setNearbyNGOs([]);
      return;
    }

    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          
          // Find nearby NGOs (within ~100km)
          const nearby = ngos.filter((ngo) => {
            const distance = getDistanceFromLatLon(loc[0], loc[1], ngo.lat, ngo.lng);
            return distance < 100; // 100km radius
          }).sort((a, b) => {
            const distA = getDistanceFromLatLon(loc[0], loc[1], a.lat, a.lng);
            const distB = getDistanceFromLatLon(loc[0], loc[1], b.lat, b.lng);
            return distA - distB;
          });
          setNearbyNGOs(nearby);
        },
        () => {
          // Default to Mumbai if location denied
          setUserLocation([19.076, 72.8777]);
          setNearbyNGOs(ngos.slice(0, 3));
        }
      );
    }
  }, [ngos]);

  function getDistanceFromLatLon(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const center = userLocation || MAP_CONFIG.defaultCenter;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="dashboard-card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FiMapPin className="w-5 h-5 text-primary-400" />
          NGOs Near You
        </h3>
        <Link
          to="/map"
          className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          Full Map <FiExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Mini Map */}
      <div className="rounded-xl overflow-hidden border border-dark-border mb-4" style={{ height: '250px' }}>
        <MapContainer
          center={center}
          zoom={userLocation ? 11 : MAP_CONFIG.defaultZoom}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          className={MAP_CONFIG.mapClassName}
        >
          <TileLayer
            url={MAP_CONFIG.darkTileUrl}
            attribution={MAP_CONFIG.darkAttribution}
          />

          {/* User Location */}
          {userLocation && (
            <>
              <Marker position={userLocation} icon={userIcon}>
                <Popup>
                  <div className="p-2 bg-[#1e293b]">
                    <p className="text-white text-xs font-medium">📍 Your Location</p>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={userLocation}
                radius={50000}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.05,
                  weight: 1,
                  dashArray: '5, 10',
                }}
              />
            </>
          )}

          {/* Nearby NGOs */}
          {nearbyNGOs.map((ngo) => (
            <NGOMarker key={ngo.id} ngo={ngo} />
          ))}
        </MapContainer>
      </div>

      {/* Nearby List */}
      <div className="space-y-2">
        {nearbyNGOs.slice(0, 3).map((ngo) => (
          <div
            key={ngo.id}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 
                     transition-colors cursor-pointer"
          >
            <img
              src={ngo.image}
              alt={ngo.name}
              className="w-10 h-10 rounded-lg object-cover shrink-0"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = NGO_FALLBACK_IMAGE;
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{ngo.name}</p>
              <p className="text-xs text-slate-500">{ngo.city}</p>
            </div>
            <span className="text-xs text-primary-400 shrink-0">
              {userLocation
                ? `${getDistanceFromLatLon(
                    userLocation[0], userLocation[1], ngo.lat, ngo.lng
                  ).toFixed(0)} km`
                : ngo.city}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default NearbyNGOMap;
