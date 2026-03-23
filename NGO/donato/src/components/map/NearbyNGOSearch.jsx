// src/components/map/NearbyNGOSearch.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, useMap
} from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import {
  FiMapPin, FiNavigation, FiSearch, FiSliders, FiExternalLink,
  FiStar, FiCheckCircle, FiPhone, FiX
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { MAP_CONFIG, NGO_FALLBACK_IMAGE } from '../../utils/mapConstants';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

// ── User location icon ─────────────────────────────────
const userIcon = L.divIcon({
  className: 'custom-marker-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `
    <div style="
      width: 28px; height: 28px;
      background: #3b82f6;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(59,130,246,0.6);
    ">
      <div style="
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%,-50%);
        width: 8px; height: 8px;
        background: white;
        border-radius: 50%;
      "></div>
    </div>
  `,
});

// ── NGO icon factory ───────────────────────────────────
const makeNGOIcon = (color = '#8b5cf6', selected = false) =>
  L.divIcon({
    className: 'custom-marker-icon',
    iconSize:   selected ? [48, 48] : [38, 38],
    iconAnchor: selected ? [24, 48] : [19, 38],
    popupAnchor: [0, selected ? -48 : -38],
    html: `
      <div style="
        width: ${selected ? 48 : 38}px; height: ${selected ? 48 : 38}px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 5px 18px rgba(15,23,42,0.35);
        border: ${selected ? '4px' : '2px'} solid rgba(255,255,255,0.9);
      ">
        <span style="transform: rotate(45deg); font-size: ${selected ? '20px' : '16px'};">🏢</span>
      </div>
    `,
  });

// ── Haversine ──────────────────────────────────────────
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const d = (deg) => deg * (Math.PI / 180);
  const a =
    Math.sin(d(lat2 - lat1) / 2) ** 2 +
    Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lon2 - lon1) / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

// ── Fly-to helper ──────────────────────────────────────
const FlyTo = ({ center, zoom = 14 }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

const CATEGORY_COLORS = {
  education: '#8b5cf6', food: '#f97316', healthcare: '#ef4444',
  water: '#06b6d4', disaster_relief: '#dc2626', clothing: '#14b8a6',
  environment: '#22c55e', women: '#ec4899', children: '#a855f7', rural: '#eab308',
};

// ── Main Component ─────────────────────────────────────
const NearbyNGOSearch = ({ height = '520px' }) => {
  const [ngos, setNgos] = useState([]);
  const [userLoc, setUserLoc] = useState(null);
  const [locating, setLocating] = useState(false);
  const [radiusKm, setRadiusKm]   = useState(50);
  const [searchQ, setSearchQ]     = useState('');
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [flyCenter, setFlyCenter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const loadNgos = async () => {
      try {
        const result = await api.getNGOs();
        if (isMounted && result?.success) {
          setNgos(Array.isArray(result.data) ? result.data : []);
        }
      } catch {
        if (isMounted) {
          setNgos([]);
        }
      }
    };

    loadNgos();
    return () => { isMounted = false; };
  }, []);

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude };
        setUserLoc(loc);
        setFlyCenter([loc.lat, loc.lng]);
        setLocating(false);
        toast.success('Location found! Showing nearby NGOs.');
      },
      () => {
        setLocating(false);
        toast.error('Location access denied. Using default city.');
        // fallback to Mumbai
        setUserLoc({ lat: 19.076, lng: 72.8777 });
      },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => { locateUser(); }, [locateUser]);

  // Filtered NGOs with distance
  const filteredNGOs = useMemo(() => {
    return ngos
      .map((ngo) => ({
        ...ngo,
        category: ngo.category || null,
        rating: ngo.rating ?? null,
        image: ngo.image || NGO_FALLBACK_IMAGE,
        distance: userLoc
          ? haversine(userLoc.lat, userLoc.lng, ngo.lat, ngo.lng)
          : null,
      }))
      .filter((ngo) => {
        const withinRadius = !userLoc || ngo.distance <= radiusKm;
        const matchCat = selectedCategory === 'all' || ngo.category === selectedCategory;
        const matchSearch =
          !searchQ ||
          ngo.name.toLowerCase().includes(searchQ.toLowerCase()) ||
          ngo.city.toLowerCase().includes(searchQ.toLowerCase());
        return withinRadius && matchCat && matchSearch;
      })
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
  }, [ngos, userLoc, radiusKm, searchQ, selectedCategory]);

  const handleNGOClick = (ngo) => {
    setSelectedNGO(ngo);
    setFlyCenter([ngo.lat, ngo.lng]);
  };

  const mapCenter = userLoc
    ? [userLoc.lat, userLoc.lng]
    : MAP_CONFIG.defaultCenter;

  const categories = ['all', ...new Set(ngos.map((ngo) => ngo.category).filter(Boolean))];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search NGO name or city..."
            className="input-field pl-9"
          />
          {searchQ && (
            <button
              onClick={() => setSearchQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Locate */}
        <button
          onClick={locateUser}
          disabled={locating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500/10 
                   border border-primary-500/20 text-primary-400 text-sm 
                   hover:bg-primary-500/20 transition-colors disabled:opacity-50"
        >
          <FiNavigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
          {locating ? 'Locating...' : 'My Location'}
        </button>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors ${
            showFilters
              ? 'bg-primary-600 text-white'
              : 'bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          <FiSliders className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-4">
              {/* Radius */}
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
                  Search Radius: <span className="text-primary-400">{radiusKm} km</span>
                </p>
                <div className="flex gap-2">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadiusKm(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                        radiusKm === r
                          ? 'bg-primary-600 text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
                  Category
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                        selectedCategory === cat
                          ? 'text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                      style={
                        selectedCategory === cat
                          ? { background: CATEGORY_COLORS[cat] || '#3b82f6' }
                          : {}
                      }
                    >
                      {cat === 'all' ? '🌍 All' : cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Found{' '}
          <span className="text-white font-semibold">{filteredNGOs.length}</span> NGOs
          {userLoc && ` within ${radiusKm} km`}
        </p>
        {selectedNGO && (
          <button
            onClick={() => setSelectedNGO(null)}
            className="text-xs text-slate-500 hover:text-white flex items-center gap-1"
          >
            <FiX className="w-3 h-3" /> Clear selection
          </button>
        )}
      </div>

      {/* Map + List layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ height }}>
        {/* NGO List */}
        <div className="lg:col-span-2 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
          {filteredNGOs.length === 0 && (
            <div className="glass-card p-8 text-center">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="text-slate-400 text-sm">No NGOs found nearby</p>
              <button
                onClick={() => setRadiusKm(100)}
                className="mt-3 text-primary-400 text-xs hover:underline"
              >
                Expand to 100 km
              </button>
            </div>
          )}
          {filteredNGOs.map((ngo) => (
            <motion.div
              key={ngo.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => handleNGOClick(ngo)}
              className={`glass-card p-4 cursor-pointer transition-all hover:border-primary-500/30 ${
                selectedNGO?.id === ngo.id
                  ? 'border-primary-500/60 bg-primary-500/5'
                  : ''
              }`}
            >
              <div className="flex gap-3">
                <img
                  src={ngo.image}
                  alt={ngo.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = NGO_FALLBACK_IMAGE;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h4 className="text-white font-semibold text-sm truncate">{ngo.name}</h4>
                    {ngo.verified && <FiCheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{ngo.city}, {ngo.state}</p>
                  <div className="flex items-center gap-2">
                    {ngo.distance !== null && (
                      <span className="text-xs text-primary-400 flex items-center gap-0.5">
                        <FiNavigation className="w-3 h-3" /> {ngo.distance} km
                      </span>
                    )}
                      <div className="flex items-center gap-0.5">
                        <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] text-slate-400">{ngo.rating ?? '—'}</span>
                      </div>
                      {ngo.category && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] capitalize"
                          style={{ background: `${CATEGORY_COLORS[ngo.category] || '#64748b'}20`, color: CATEGORY_COLORS[ngo.category] || '#cbd5e1' }}
                        >
                          {ngo.category}
                        </span>
                      )}
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {selectedNGO?.id === ngo.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                      <p className="text-xs text-slate-400 line-clamp-2">{ngo.description}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <FiMapPin className="w-3 h-3 text-primary-400" />
                        <span className="truncate">{ngo.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <FiPhone className="w-3 h-3 text-primary-400" />
                        <span>{ngo.phone}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Link
                          to={`/campaigns?ngo=${ngo.id}`}
                          className="flex-1 text-center py-1.5 bg-primary-600 text-white text-xs
                                   rounded-lg hover:bg-primary-500 transition-colors"
                        >
                          View Campaigns
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `https://www.google.com/maps/dir/Current+Location/${ngo.lat},${ngo.lng}`,
                              '_blank'
                            );
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white/5 text-slate-300
                                   text-xs rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <FiNavigation className="w-3 h-3" /> Directions
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Map */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-dark-border">
          <MapContainer
            center={mapCenter}
            zoom={userLoc ? 9 : MAP_CONFIG.defaultZoom}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            className={MAP_CONFIG.mapClassName}
          >
            <TileLayer
              url={MAP_CONFIG.darkTileUrl}
              attribution={MAP_CONFIG.darkAttribution}
            />
            <ZoomControl position="bottomright" />

            {flyCenter && <FlyTo center={flyCenter} zoom={selectedNGO ? 14 : 10} />}

            {/* User location */}
            {userLoc && (
              <>
                <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                  <Popup>
                    <div className="p-2 bg-[#1e293b] text-xs text-white">📍 Your Location</div>
                  </Popup>
                </Marker>
                <Circle
                  center={[userLoc.lat, userLoc.lng]}
                  radius={radiusKm * 1000}
                  pathOptions={{
                    color: '#3b82f6', fillColor: '#3b82f610',
                    fillOpacity: 0.2, weight: 1.5, dashArray: '6 4',
                  }}
                />
              </>
            )}

            {/* NGO markers */}
            {filteredNGOs.map((ngo) => (
              <Marker
                key={ngo.id}
                position={[ngo.lat, ngo.lng]}
                icon={makeNGOIcon(
                  CATEGORY_COLORS[ngo.category] || '#3b82f6',
                  selectedNGO?.id === ngo.id
                )}
                eventHandlers={{ click: () => handleNGOClick(ngo) }}
              >
                <Popup maxWidth={260} minWidth={220}>
                  <div className="p-3 bg-[#1e293b]">
                    <h4 className="text-white font-semibold text-sm mb-1">{ngo.name}</h4>
                    <p className="text-xs text-slate-400 mb-2">{ngo.address}</p>
                    {ngo.distance !== null && (
                      <p className="text-xs text-primary-400 mb-2">
                        📍 {ngo.distance} km from you
                      </p>
                    )}
                    <Link
                      to={`/campaigns?ngo=${ngo.id}`}
                      className="block text-center py-1.5 bg-primary-600 text-white text-xs 
                               rounded-lg hover:bg-primary-500 transition-colors"
                    >
                      View Campaigns <FiExternalLink className="inline w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default NearbyNGOSearch;

