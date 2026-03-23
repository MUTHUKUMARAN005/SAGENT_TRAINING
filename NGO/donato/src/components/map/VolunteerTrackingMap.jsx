// src/components/map/VolunteerTrackingMap.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import {
  FiNavigation, FiMapPin, FiClock, FiActivity,
  FiPlay, FiPause, FiRadio, FiCheckCircle
} from 'react-icons/fi';
import { MAP_CONFIG } from '../../utils/mapConstants';

// ── Icons ──────────────────────────────────────────────
const volunteerMovingIcon = L.divIcon({
  className: 'custom-marker-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  html: `
    <div style="
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 6px rgba(34,197,94,0.25), 0 4px 16px rgba(34,197,94,0.5);
      border: 3px solid white;
      animation: pulse-ring 1.5s infinite;
    ">
      <span style="font-size: 18px;">🚴</span>
    </div>
  `,
});

const destinationIcon = L.divIcon({
  className: 'custom-marker-icon',
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  html: `
    <div style="
      width: 42px; height: 42px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 5px 18px rgba(249,115,22,0.5);
      border: 3px solid rgba(255,255,255,0.9);
    ">
      <span style="transform: rotate(45deg); font-size: 18px;">🏠</span>
    </div>
  `,
});

// ── Trail points updater ───────────────────────────────
const VolunteerMover = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo([position.lat, position.lng], { animate: true, duration: 1 });
  }, [position, map]);
  return null;
};

// ── Sample pickup request for demo ────────────────────
const DEMO_PICKUP = {
  id: 'PKP-2024-001',
  donor_name: 'Priya Sharma',
  address: 'Bandra West, Mumbai - 400050',
  lat: 19.0601,
  lng: 72.8372,
  items: ['clothes', 'books'],
  contact: '+91 98765 43210',
};

// Simulate volunteer moving along a route
const ROUTE_SIMULATION = [
  { lat: 19.0760, lng: 72.8777 },
  { lat: 19.0710, lng: 72.8720 },
  { lat: 19.0680, lng: 72.8660 },
  { lat: 19.0650, lng: 72.8580 },
  { lat: 19.0630, lng: 72.8500 },
  { lat: 19.0615, lng: 72.8440 },
  { lat: 19.0601, lng: 72.8372 }, // destination
];

// ── Main Component ─────────────────────────────────────
/**
 * VolunteerTrackingMap
 * Props:
 *   pickupRequest  - pickup data (optional, uses demo if not provided)
 *   volunteerName  - name of the volunteer being tracked
 *   isLive         - whether this is real-time (from API)
 */
const VolunteerTrackingMap = ({
  pickupRequest = DEMO_PICKUP,
  volunteerName = 'Arjun Verma',
  isLive = false,
}) => {
  const [currentPos, setCurrentPos]   = useState(ROUTE_SIMULATION[0]);
  const [trail, setTrail]             = useState([ROUTE_SIMULATION[0]]);
  const [routeIdx, setRouteIdx]       = useState(0);
  const [tracking, setTracking]       = useState(false);
  const [arrived, setArrived]         = useState(false);
  const [elapsed, setElapsed]         = useState(0); // seconds
  const intervalRef  = useRef(null);
  const timerRef     = useRef(null);

  const destination = {
    lat: pickupRequest?.lat  ?? DEMO_PICKUP.lat,
    lng: pickupRequest?.lng  ?? DEMO_PICKUP.lng,
    addr: pickupRequest?.address ?? DEMO_PICKUP.address,
    donor: pickupRequest?.donor_name ?? DEMO_PICKUP.donor_name,
  };

  const totalPoints = ROUTE_SIMULATION.length;

  const progressPct = Math.round(((routeIdx) / (totalPoints - 1)) * 100);

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const d = (deg) => deg * (Math.PI / 180);
    const a =
      Math.sin(d(lat2 - lat1) / 2) ** 2 +
      Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lon2 - lon1) / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
  };

  const distRemaining = haversine(
    currentPos.lat, currentPos.lng,
    destination.lat, destination.lng
  );

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startTracking = useCallback(() => {
    if (arrived) return;
    setTracking(true);

    // Move volunteer along route every 2s
    intervalRef.current = setInterval(() => {
      setRouteIdx((prev) => {
        const next = prev + 1;
        if (next >= totalPoints) {
          clearInterval(intervalRef.current);
          setTracking(false);
          setArrived(true);
          return prev;
        }
        const newPos = ROUTE_SIMULATION[next];
        setCurrentPos(newPos);
        setTrail((t) => [...t, newPos]);
        return next;
      });
    }, 2000);

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
  }, [arrived, totalPoints]);

  const stopTracking = useCallback(() => {
    clearInterval(intervalRef.current);
    clearInterval(timerRef.current);
    setTracking(false);
  }, []);

  const resetTracking = () => {
    stopTracking();
    setCurrentPos(ROUTE_SIMULATION[0]);
    setTrail([ROUTE_SIMULATION[0]]);
    setRouteIdx(0);
    setArrived(false);
    setElapsed(0);
  };

  useEffect(() => () => { stopTracking(); }, [stopTracking]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            arrived ? 'bg-green-500/20' : tracking ? 'bg-blue-500/20' : 'bg-white/5'
          }`}>
            {arrived ? (
              <FiCheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <FiActivity className={`w-5 h-5 ${tracking ? 'text-blue-400' : 'text-slate-400'}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm">{volunteerName}</p>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                arrived
                  ? 'bg-green-500/10 text-green-400'
                  : tracking
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-white/5 text-slate-500'
              }`}>
                {arrived ? '✅ Arrived' : tracking ? (
                  <><FiRadio className="w-2.5 h-2.5 animate-pulse" /> Live</>
                ) : '⏸ Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-400">→ {destination.donor} · {destination.addr.substring(0, 35)}…</p>
          </div>
        </div>
        <p className="text-primary-400 font-mono text-sm">{formatTime(elapsed)}</p>
      </div>

      {/* Progress bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>🏁 Start</span>
          <span className="text-primary-400 font-semibold">{progressPct}% complete</span>
          <span>🏠 Destination</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-green-500"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>📍 {distRemaining} km remaining</span>
          <span>⏱ {elapsed > 0 ? formatTime(elapsed) : '--:--'} elapsed</span>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-dark-border" style={{ height: '360px' }}>
        <MapContainer
          center={[currentPos.lat, currentPos.lng]}
          zoom={13}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          className={MAP_CONFIG.mapClassName}
        >
          <TileLayer
            url={MAP_CONFIG.darkTileUrl}
            attribution={MAP_CONFIG.darkAttribution}
          />
          <ZoomControl position="bottomright" />

          <VolunteerMover position={currentPos} />

          {/* Trail (path taken) */}
          {trail.length >= 2 && (
            <Polyline
              positions={trail.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.9 }}
            />
          )}

          {/* Remaining route (dashed) */}
          {routeIdx < totalPoints - 1 && (
            <Polyline
              positions={ROUTE_SIMULATION.slice(routeIdx).map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.5, dashArray: '8 5' }}
            />
          )}

          {/* Volunteer marker */}
          <Marker position={[currentPos.lat, currentPos.lng]} icon={volunteerMovingIcon}>
            <Popup>
              <div className="p-2 bg-[#1e293b] text-xs text-white">
                🚴 {volunteerName}<br />
                <span className="text-green-400">{distRemaining} km to destination</span>
              </div>
            </Popup>
          </Marker>

          {/* Destination marker */}
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="p-2 bg-[#1e293b] text-xs text-white">
                🏠 {destination.donor}<br />
                <span className="text-slate-400">{destination.addr}</span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!arrived ? (
          <>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={tracking ? stopTracking : startTracking}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm ${
                tracking
                  ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                  : 'btn-primary'
              } transition-colors`}
            >
              {tracking ? (
                <><FiPause className="w-4 h-4" /> Pause Tracking</>
              ) : (
                <><FiPlay className="w-4 h-4" /> {routeIdx === 0 ? 'Start Tracking' : 'Resume'}</>
              )}
            </motion.button>
            <button
              onClick={resetTracking}
              className="px-4 py-3 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 
                       transition-colors text-sm border border-white/10"
            >
              Reset
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-3 py-3 rounded-xl
                       bg-green-500/10 border border-green-500/20 text-green-400">
            <FiCheckCircle className="w-5 h-5" />
            <span className="font-semibold">Volunteer Arrived! 🎉</span>
          </div>
        )}
      </div>

      {/* Info note */}
      <p className="text-[11px] text-slate-600 text-center">
        {isLive
          ? '📡 Live GPS tracking active'
          : '🎬 Demo simulation — In production, real GPS coordinates stream from volunteer app'}
      </p>
    </div>
  );
};

export default VolunteerTrackingMap;

