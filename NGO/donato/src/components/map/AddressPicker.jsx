// src/components/map/AddressPicker.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { FiMapPin, FiNavigation, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { MAP_CONFIG } from '../../utils/mapConstants';

// Custom draggable pin icon
const pinIcon = L.divIcon({
  className: 'custom-marker-icon',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  html: `
    <div style="
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 20px rgba(59,130,246,0.6);
      border: 3px solid rgba(255,255,255,0.9);
    ">
      <span style="transform: rotate(45deg); font-size: 18px;">📍</span>
    </div>
  `,
});

// Handles click-to-place marker
const DragLocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Fly to position effect
const FlyTo = ({ position, zoom = 15 }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], zoom, { duration: 1.2 });
    }
  }, [position, zoom, map]);
  return null;
};

const AddressPicker = ({ value, onChange, className = '' }) => {
  const [position, setPosition] = useState(
    value?.lat && value?.lng ? { lat: value.lat, lng: value.lng } : null
  );
  const [address, setAddress] = useState(value?.address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Reverse geocode lat/lng to address string
  const reverseGeocode = useCallback(async (lat, lng) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(addr);
      return addr;
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(fallback);
      return fallback;
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleLocationSelect = useCallback(async ({ lat, lng }) => {
    const pos = { lat, lng };
    setPosition(pos);
    const addr = await reverseGeocode(lat, lng);
    onChange?.({ lat, lng, address: addr });
  }, [reverseGeocode, onChange]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    toast.loading('Getting your location...', { id: 'loc' });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        toast.dismiss('loc');
        toast.success('Location found!');
        await handleLocationSelect({ lat: coords.latitude, lng: coords.longitude });
        setExpanded(true);
      },
      () => {
        toast.dismiss('loc');
        toast.error('Could not get location. Please allow access or search manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async (q) => {
    if (!q || q.length < 3) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5&addressdetails=1`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSelect = async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const pos = { lat, lng };
    setPosition(pos);
    setAddress(result.display_name);
    setSearchQuery(result.display_name.split(',')[0]);
    setSearchResults([]);
    onChange?.({ lat, lng, address: result.display_name });
    setExpanded(true);
  };

  const mapCenter = position
    ? [position.lat, position.lng]
    : MAP_CONFIG.defaultCenter;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Address Display + Trigger */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="relative cursor-pointer input-field flex items-center gap-3 pr-10 select-none"
      >
        <FiMapPin className={`w-4 h-4 shrink-0 ${position ? 'text-primary-400' : 'text-slate-500'}`} />
        <span className={`text-sm truncate ${position ? 'text-white' : 'text-slate-500'}`}>
          {geocoding ? 'Fetching address...' : address || 'Click to select location on map'}
        </span>
        {position && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <FiCheck className="w-4 h-4 text-green-400" />
          </span>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-3">
              {/* Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    placeholder="Search address, landmark..."
                    className="input-field pl-9 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSearchQuery(''); setSearchResults([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCurrentLocation(); }}
                  className="px-3 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20
                           text-primary-400 text-xs hover:bg-primary-500/20 transition-colors
                           flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FiNavigation className="w-3.5 h-3.5" />
                  Use Me
                </button>
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {(searching || searchResults.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-dark-card border border-dark-border rounded-xl overflow-hidden z-50"
                  >
                    {searching ? (
                      <div className="p-3 text-center text-xs text-slate-500">Searching...</div>
                    ) : (
                      searchResults.map((r, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); handleSearchSelect(r); }}
                          className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-white/5
                                   transition-colors border-b border-white/5 last:border-0"
                        >
                          <FiMapPin className="w-3.5 h-3.5 text-primary-400 mt-0.5 shrink-0" />
                          <span className="text-xs text-slate-300 line-clamp-2">{r.display_name}</span>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Map */}
              <div
                className="rounded-xl overflow-hidden border border-dark-border"
                style={{ height: '260px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <MapContainer
                  center={mapCenter}
                  zoom={position ? 14 : MAP_CONFIG.defaultZoom}
                  style={{ height: '100%', width: '100%' }}
                  className={MAP_CONFIG.mapClassName}
                  zoomControl={true}
                >
                  <TileLayer
                    url={MAP_CONFIG.darkTileUrl}
                    attribution={MAP_CONFIG.darkAttribution}
                  />
                  <DragLocationPicker onLocationSelect={handleLocationSelect} />
                  {position && (
                    <>
                      <Marker
                        position={[position.lat, position.lng]}
                        icon={pinIcon}
                        draggable={true}
                        eventHandlers={{
                          dragend: (e) => {
                            const { lat, lng } = e.target.getLatLng();
                            handleLocationSelect({ lat, lng });
                          },
                        }}
                      />
                      <FlyTo position={position} />
                    </>
                  )}
                </MapContainer>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                🖱️ Click on map to place pin • Drag pin to adjust • Use search or GPS for accuracy
              </p>

              {/* Confirm Button */}
              {position && (
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                  className="w-full py-2.5 bg-primary-600 text-white text-sm rounded-xl
                           hover:bg-primary-500 transition-colors flex items-center justify-center gap-2"
                >
                  <FiCheck className="w-4 h-4" />
                  Confirm Location
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddressPicker;

