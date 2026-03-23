// src/components/home/NearbyDonationMapSection.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import {
  FiMapPin, FiNavigation, FiSliders, FiExternalLink,
  FiStar, FiCheckCircle, FiPhone, FiPackage, FiClock, FiArrowRight, FiX,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MAP_CONFIG, NGO_LOCATIONS, PICKUP_LOCATIONS } from '../../utils/mapConstants';
import { fadeInUp, staggerContainer } from '../../animations/variants';

// ─── Category colour map ─────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  education: '#8b5cf6', food: '#f97316', healthcare: '#ef4444',
  water: '#06b6d4', disaster_relief: '#dc2626', clothing: '#14b8a6',
  environment: '#22c55e', women: '#ec4899', children: '#a855f7', rural: '#eab308',
};

// ─── Haversine distance ──────────────────────────────────────────────────────
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const d = (deg) => (deg * Math.PI) / 180;
  const a =
    Math.sin(d(lat2 - lat1) / 2) ** 2 +
    Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lon2 - lon1) / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

// ─── Map fly-to helper ───────────────────────────────────────────────────────
const FlyTo = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// ─── Icon factories ───────────────────────────────────────────────────────────
const userIcon = L.divIcon({
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `<div style="
    width:28px;height:28px;background:#3b82f6;border-radius:50%;
    border:3px solid white;box-shadow:0 3px 12px rgba(59,130,246,.65);
    display:flex;align-items:center;justify-content:center;">
    <div style="width:8px;height:8px;background:white;border-radius:50%;"></div>
  </div>`,
});

const makeNGOIcon = (color = '#8b5cf6', selected = false) => {
  const sz = selected ? 46 : 36;
  const anchor = selected ? 23 : 18;
  const border = selected ? '3px' : '2px';
  const fs = selected ? '18px' : '14px';
  return L.divIcon({
    className: '',
    iconSize:    [sz, sz],
    iconAnchor:  [anchor, sz],
    popupAnchor: [0, -sz],
    html: `<div style="width:${sz}px;height:${sz}px;background:${color};
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 16px rgba(15,23,42,.4);border:${border} solid rgba(255,255,255,.9);">
      <span style="transform:rotate(45deg);font-size:${fs};">🏢</span>
    </div>`,
  });
};

const makeCenterIcon = (selected = false) => {
  const sz = selected ? 46 : 36;
  const anchor = selected ? 23 : 18;
  const border = selected ? '3px' : '2px';
  const fs = selected ? '18px' : '14px';
  return L.divIcon({
    className: '',
    iconSize:    [sz, sz],
    iconAnchor:  [anchor, sz],
    popupAnchor: [0, -sz],
    html: `<div style="width:${sz}px;height:${sz}px;background:#22c55e;
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 16px rgba(15,23,42,.4);border:${border} solid rgba(255,255,255,.9);">
      <span style="transform:rotate(45deg);font-size:${fs};">📦</span>
    </div>`,
  });
};

// ─── Distance chips ───────────────────────────────────────────────────────────
const RADIUS_OPTIONS = [5, 10, 25, 50];

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'ngos',    label: 'Nearby NGOs',           icon: '🏢' },
  { id: 'centers', label: 'Donation Centers',       icon: '📦' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const NearbyDonationMapSection = () => {
  const [userLoc,      setUserLoc]      = useState(null);
  const [locating,     setLocating]     = useState(false);
  const [radiusKm,     setRadiusKm]     = useState(25);
  const [activeTab,    setActiveTab]    = useState('ngos');
  const [selected,     setSelected]     = useState(null);
  const [flyCenter,    setFlyCenter]    = useState(null);
  const [flyZoom,      setFlyZoom]      = useState(13);
  const [showFilters,  setShowFilters]  = useState(false);
  const [catFilter,    setCatFilter]    = useState('all');

  // ── Locate user ─────────────────────────────────────────────────────────────
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude };
        setUserLoc(loc);
        setFlyCenter([loc.lat, loc.lng]);
        setFlyZoom(11);
        setLocating(false);
        toast.success('Location found! Showing nearby results.');
      },
      () => {
        setLocating(false);
        // Fallback: Mumbai
        const fallback = { lat: 19.076, lng: 72.8777 };
        setUserLoc(fallback);
        setFlyCenter([fallback.lat, fallback.lng]);
        setFlyZoom(10);
        toast('Using Mumbai as default location.', { icon: '📍' });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => { locateUser(); }, [locateUser]);

  // ── Filter helpers ───────────────────────────────────────────────────────────
  const withDistance = useCallback(
    (items) =>
      items.map((item) => ({
        ...item,
        distance: userLoc ? haversine(userLoc.lat, userLoc.lng, item.lat, item.lng) : null,
      })),
    [userLoc]
  );

  const filteredNGOs = useMemo(() => {
    const withDist = withDistance(NGO_LOCATIONS);
    return withDist
      .filter((ngo) => {
        const inRadius = !userLoc || ngo.distance <= radiusKm;
        const matchCat = catFilter === 'all' || ngo.category === catFilter;
        return inRadius && matchCat;
      })
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
  }, [withDistance, userLoc, radiusKm, catFilter]);

  const filteredCenters = useMemo(() => {
    const withDist = withDistance(PICKUP_LOCATIONS);
    return withDist
      .filter((c) => !userLoc || c.distance <= radiusKm)
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
  }, [withDistance, userLoc, radiusKm]);

  const activeList   = activeTab === 'ngos' ? filteredNGOs : filteredCenters;
  const mapCenter    = userLoc ? [userLoc.lat, userLoc.lng] : MAP_CONFIG.defaultCenter;
  const ngoCategories = ['all', ...new Set(NGO_LOCATIONS.map((n) => n.category).filter(Boolean))];

  const handleSelect = (item) => {
    setSelected((prev) => (prev?.id === item.id ? null : item));
    setFlyCenter([item.lat, item.lng]);
    setFlyZoom(14);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      className="mt-20"
    >
      {/* ── Section header ───────────────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="text-center mb-10">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                         bg-green-500/10 border border-green-500/20 text-green-400
                         text-sm font-medium mb-4">
          <FiMapPin className="w-3.5 h-3.5" />
          Nearby Donations
        </span>
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
          Find Donation{' '}
          <span className="gradient-text">Spots Near You</span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Discover NGOs and donation drop-off centers within your radius.
          Select a distance, explore the map, and take action locally.
        </p>
      </motion.div>

      {/* ── Controls bar ─────────────────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-4">
        {/* Tabs */}
        <div className="flex bg-dark-card border border-dark-border rounded-xl p-1 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelected(null); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium
                         transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Radius chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Within:</span>
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => { setRadiusKm(r); setSelected(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                radiusKm === r
                  ? 'bg-accent-orange text-white border-accent-orange shadow-md'
                  : 'bg-white/5 text-slate-400 border-dark-border hover:bg-white/10 hover:text-white'
              }`}
            >
              {r} km
            </button>
          ))}
        </div>

        {/* Locate me button */}
        <button
          onClick={locateUser}
          disabled={locating}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-primary-500/10 border border-primary-500/20 text-primary-400
                     text-sm hover:bg-primary-500/20 transition-colors disabled:opacity-50"
        >
          <FiNavigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
          {locating ? 'Locating…' : 'My Location'}
        </button>

        {/* Category filter (NGOs only) */}
        {activeTab === 'ngos' && (
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
              showFilters
                ? 'bg-primary-600 text-white'
                : 'bg-white/5 border border-dark-border text-slate-400 hover:bg-white/10'
            }`}
          >
            <FiSliders className="w-4 h-4" />
            Category
          </button>
        )}
      </motion.div>

      {/* ── Category filter panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && activeTab === 'ngos' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass-card p-4 flex flex-wrap gap-2">
              {ngoCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all font-medium ${
                    catFilter === cat ? 'text-white shadow-sm' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                  style={catFilter === cat ? { background: CATEGORY_COLORS[cat] || '#3b82f6' } : {}}
                >
                  {cat === 'all' ? '🌍 All' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map + List grid ───────────────────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '520px' }}>

        {/* ── Sidebar list ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-3 overflow-y-auto max-h-[520px]
                        pr-1 scrollbar-thin scrollbar-thumb-white/10">

          {/* Result count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              <span className="text-white font-semibold">{activeList.length}</span>{' '}
              {activeTab === 'ngos' ? 'NGOs' : 'Centers'}
              {userLoc && ` within ${radiusKm} km`}
            </p>
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-slate-500 hover:text-white flex items-center gap-1"
              >
                <FiX className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {activeList.length === 0 && (
            <div className="glass-card p-8 text-center flex-1">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-white font-medium mb-1">Nothing found nearby</p>
              <p className="text-slate-400 text-sm mb-4">Try expanding the radius.</p>
              <button
                onClick={() => setRadiusKm(100)}
                className="text-primary-400 text-xs hover:underline"
              >
                Expand to 100 km
              </button>
            </div>
          )}

          {activeList.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => handleSelect(item)}
              className={`glass-card p-4 cursor-pointer transition-all hover:border-primary-500/30 ${
                selected?.id === item.id
                  ? 'border-primary-500/60 bg-primary-500/5'
                  : ''
              }`}
            >
              {/* ── NGO card ───────────────────────────────────────────────── */}
              {activeTab === 'ngos' ? (
                <div className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 mb-0.5">
                      <h4 className="text-white font-semibold text-sm truncate">{item.name}</h4>
                      {item.verified && (
                        <FiCheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-1.5">{item.city}, {item.state}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.distance !== null && (
                        <span className="text-xs text-primary-400 flex items-center gap-0.5">
                          <FiNavigation className="w-3 h-3" /> {item.distance} km
                        </span>
                      )}
                      {item.rating && (
                        <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                          <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {item.rating}
                        </span>
                      )}
                      {item.category && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] capitalize font-medium"
                          style={{
                            background: `${CATEGORY_COLORS[item.category] || '#64748b'}25`,
                            color: CATEGORY_COLORS[item.category] || '#cbd5e1',
                          }}
                        >
                          {item.category.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Donation center card ────────────────────────────────── */
                <div className="flex gap-3 items-start">
                  <div className="w-12 h-12 rounded-xl bg-green-500/15 shrink-0
                                  flex items-center justify-center">
                    <FiPackage className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-semibold text-sm truncate mb-0.5">{item.name}</h4>
                    <p className="text-xs text-slate-500 mb-1.5">{item.city}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.distance !== null && (
                        <span className="text-xs text-primary-400 flex items-center gap-0.5">
                          <FiNavigation className="w-3 h-3" /> {item.distance} km
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-[11px] text-green-400">
                        <FiClock className="w-3 h-3" /> {item.timing}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Expanded detail ─────────────────────────────────────── */}
              <AnimatePresence>
                {selected?.id === item.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                      {activeTab === 'ngos' ? (
                        <>
                          <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <FiMapPin className="w-3 h-3 text-primary-400 shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <FiPhone className="w-3 h-3 text-primary-400" />
                            <span>{item.phone}</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Link
                              to={`/campaigns?ngo=${item.id}`}
                              className="flex-1 text-center py-1.5 bg-primary-600 text-white
                                         text-xs rounded-lg hover:bg-primary-500 transition-colors"
                            >
                              View Campaigns
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  `https://www.google.com/maps/dir/Current+Location/${item.lat},${item.lng}`,
                                  '_blank'
                                );
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white/5
                                         text-slate-300 text-xs rounded-lg hover:bg-white/10 transition-colors"
                            >
                              <FiNavigation className="w-3 h-3" /> Directions
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <FiMapPin className="w-3 h-3 text-green-400 shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <FiPhone className="w-3 h-3 text-green-400" />
                            <span>{item.phone}</span>
                          </div>
                          {Array.isArray(item.acceptedItems) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.acceptedItems.map((it) => (
                                <span
                                  key={it}
                                  className="px-1.5 py-0.5 bg-green-500/10 text-green-400
                                             text-[10px] rounded capitalize"
                                >
                                  {it}
                                </span>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `https://www.google.com/maps/dir/Current+Location/${item.lat},${item.lng}`,
                                '_blank'
                              );
                            }}
                            className="w-full mt-2 flex items-center justify-center gap-1.5
                                       py-1.5 bg-green-500/10 border border-green-500/20
                                       text-green-400 text-xs rounded-lg hover:bg-green-500/20 transition-colors"
                          >
                            <FiNavigation className="w-3 h-3" /> Get Directions
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* ── Explore full map CTA ───────────────────────────────────────── */}
          <Link
            to="/map"
            className="flex items-center justify-center gap-2 py-3 rounded-xl
                       border border-dashed border-primary-500/30 text-primary-400
                       text-sm hover:bg-primary-500/5 transition-colors mt-1"
          >
            <FiExternalLink className="w-4 h-4" />
            Explore Full Map
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Map ────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-dark-border"
             style={{ minHeight: '480px' }}>
          <MapContainer
            center={mapCenter}
            zoom={userLoc ? 9 : MAP_CONFIG.defaultZoom}
            zoomControl={false}
            style={{ height: '100%', width: '100%', minHeight: '480px' }}
            className={MAP_CONFIG.mapClassName}
          >
            <TileLayer url={MAP_CONFIG.darkTileUrl} attribution={MAP_CONFIG.darkAttribution} />
            <ZoomControl position="bottomright" />

            {flyCenter && <FlyTo center={flyCenter} zoom={flyZoom} />}

            {/* User marker + radius circle */}
            {userLoc && (
              <>
                <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                  <Popup>
                    <div className="text-xs text-white bg-[#1e293b] p-2 rounded">📍 Your Location</div>
                  </Popup>
                </Marker>
                <Circle
                  center={[userLoc.lat, userLoc.lng]}
                  radius={radiusKm * 1000}
                  pathOptions={{
                    color: '#3b82f6', fillColor: '#3b82f6',
                    fillOpacity: 0.07, weight: 1.5, dashArray: '6 4',
                  }}
                />
              </>
            )}

            {/* NGO markers */}
            {activeTab === 'ngos' &&
              filteredNGOs.map((ngo) => (
                <Marker
                  key={`ngo-${ngo.id}`}
                  position={[ngo.lat, ngo.lng]}
                  icon={makeNGOIcon(
                    CATEGORY_COLORS[ngo.category] || '#3b82f6',
                    selected?.id === ngo.id
                  )}
                  eventHandlers={{ click: () => handleSelect(ngo) }}
                >
                  <Popup maxWidth={240} minWidth={200}>
                    <div className="bg-[#1e293b] p-3 rounded">
                      <h4 className="text-white font-semibold text-sm mb-1">{ngo.name}</h4>
                      <p className="text-xs text-slate-400 mb-1">{ngo.city}, {ngo.state}</p>
                      {ngo.distance !== null && (
                        <p className="text-xs text-primary-400 mb-2">📍 {ngo.distance} km away</p>
                      )}
                      <Link
                        to={`/campaigns?ngo=${ngo.id}`}
                        className="block text-center py-1.5 bg-primary-600 text-white
                                   text-xs rounded-lg hover:bg-primary-500 transition-colors"
                      >
                        View Campaigns <FiExternalLink className="inline w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Donation center markers */}
            {activeTab === 'centers' &&
              filteredCenters.map((center) => (
                <Marker
                  key={`center-${center.id}`}
                  position={[center.lat, center.lng]}
                  icon={makeCenterIcon(selected?.id === center.id)}
                  eventHandlers={{ click: () => handleSelect(center) }}
                >
                  <Popup maxWidth={240} minWidth={200}>
                    <div className="bg-[#1e293b] p-3 rounded">
                      <h4 className="text-white font-semibold text-sm mb-1">{center.name}</h4>
                      <p className="text-xs text-slate-400 mb-1">{center.address}</p>
                      {center.distance !== null && (
                        <p className="text-xs text-green-400 mb-1">📍 {center.distance} km away</p>
                      )}
                      <p className="text-xs text-slate-500">🕐 {center.timing}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </motion.div>

      {/* ── Legend ───────────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeInUp}
        className="mt-4 flex flex-wrap items-center gap-4 justify-center text-xs text-slate-500"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Your Location
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" /> NGOs
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Donation Centers
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-12 h-0.5 inline-block border-t-2 border-dashed border-blue-500"
          /> Search Radius
        </span>
      </motion.div>
    </motion.div>
  );
};

export default NearbyDonationMapSection;





