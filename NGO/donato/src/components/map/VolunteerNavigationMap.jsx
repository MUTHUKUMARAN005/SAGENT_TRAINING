// src/components/map/VolunteerNavigationMap.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Polyline,
  useMap, ZoomControl, Circle
} from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import {
  FiNavigation, FiMapPin, FiClock, FiTruck,
  FiExternalLink, FiRefreshCw, FiPackage, FiPhone
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { MAP_CONFIG } from '../../utils/mapConstants';

// ── Icons ──────────────────────────────────────────────
const volunteerIcon = L.divIcon({
  className: 'custom-marker-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `
    <div style="
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 14px rgba(59,130,246,0.6);
      border: 3px solid white;
    ">
      <span style="font-size: 16px;">🚴</span>
    </div>
  `,
});

const donorIcon = L.divIcon({
  className: 'custom-marker-icon',
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
  html: `
    <div style="
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 5px 16px rgba(249,115,22,0.55);
      border: 3px solid rgba(255,255,255,0.9);
    ">
      <span style="transform: rotate(45deg); font-size: 18px;">🏠</span>
    </div>
  `,
});

// ── FlyTo helper ───────────────────────────────────────
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions?.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

// ── Haversine distance ─────────────────────────────────
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const d = (deg) => deg * (Math.PI / 180);
  const a =
    Math.sin(d(lat2 - lat1) / 2) ** 2 +
    Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lon2 - lon1) / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

// ── ETA estimate ───────────────────────────────────────
const estimateETA = (distKm) => {
  const avgSpeedKmh = 25; // avg city travel speed
  const minutes = Math.ceil((distKm / avgSpeedKmh) * 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

// ── Fetch real route via OSRM ──────────────────────────
const fetchRoute = async (from, to) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data?.routes?.[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    }
  } catch { /* fallback to straight line */ }
  return null;
};

// ── Main Component ─────────────────────────────────────
/**
 * VolunteerNavigationMap
 * Props:
 *   pickupRequest - { id, donor_name, address, latitude, longitude, items, contact_phone, pickup_date, time_slot }
 *   volunteerLocation - { lat, lng } (current volunteer position)
 */
const VolunteerNavigationMap = ({ pickupRequest, volunteerLocation: externalVolLoc }) => {
  const [volLocation, setVolLocation] = useState(externalVolLoc || null);
  const [routePoints, setRoutePoints] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [locating, setLocating] = useState(false);
  const [status, setStatus] = useState('pending'); // pending | en_route | arrived | completed

  const donor = {
    lat: pickupRequest?.latitude  ?? 19.033,
    lng: pickupRequest?.longitude ?? 72.8651,
    name:  pickupRequest?.donor_name   ?? 'Donor',
    addr:  pickupRequest?.address      ?? 'Donor Address',
    phone: pickupRequest?.contact_phone ?? '',
    items: pickupRequest?.items        ?? [],
    id:    pickupRequest?.id           ?? 'PKP-001',
  };

  const distance = volLocation
    ? haversine(volLocation.lat, volLocation.lng, donor.lat, donor.lng)
    : null;
  const eta = distance ? estimateETA(parseFloat(distance)) : null;

  // Build route when volunteer location is known
  useEffect(() => {
    if (!volLocation) return;
    let cancelled = false;
    (async () => {
      setLoadingRoute(true);
      const points = await fetchRoute(volLocation, { lat: donor.lat, lng: donor.lng });
      if (!cancelled) {
        setRoutePoints(
          points ?? [
            [volLocation.lat, volLocation.lng],
            [donor.lat, donor.lng],
          ]
        );
      }
      setLoadingRoute(false);
    })();
    return () => { cancelled = true; };
  }, [volLocation, donor.lat, donor.lng]);

  const getMyLocation = useCallback(() => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setVolLocation({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
        toast.success('Location updated');
      },
      () => {
        setLocating(false);
        toast.error('Could not get location');
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const openGoogleNavigation = () => {
    const from = volLocation ? `${volLocation.lat},${volLocation.lng}` : '';
    const to   = `${donor.lat},${donor.lng}`;
    const url  = from
      ? `https://www.google.com/maps/dir/${from}/${to}`
      : `https://www.google.com/maps?q=${to}`;
    window.open(url, '_blank');
  };

  const mapPositions = [
    ...(volLocation ? [[volLocation.lat, volLocation.lng]] : []),
    [donor.lat, donor.lng],
  ];

  const statusConfig = {
    pending:   { label: 'Pending',   color: 'yellow', emoji: '⏳' },
    en_route:  { label: 'En Route',  color: 'blue',   emoji: '🚴' },
    arrived:   { label: 'Arrived',   color: 'green',  emoji: '📍' },
    completed: { label: 'Completed', color: 'emerald', emoji: '✅' },
  };

  const sc = statusConfig[status];

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="glass-card p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
            <FiPackage className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{donor.name}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <FiMapPin className="w-3 h-3" />
              {donor.addr.substring(0, 55)}{donor.addr.length > 55 ? '...' : ''}
            </p>
            {donor.items.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {donor.items.map((item) => (
                  <span
                    key={item}
                    className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-400 capitalize"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <span
            className={`px-2 py-1 rounded-lg text-xs font-medium bg-${sc.color}-500/10 
                        text-${sc.color}-400 border border-${sc.color}-500/20`}
          >
            {sc.emoji} {sc.label}
          </span>
          {donor.phone && (
            <a
              href={`tel:${donor.phone}`}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <FiPhone className="w-3 h-3" /> {donor.phone}
            </a>
          )}
        </div>
      </div>

      {/* Distance / ETA Row */}
      {volLocation && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: FiMapPin,    label: 'Distance', value: `${distance} km` },
            { icon: FiClock,     label: 'Est. ETA',  value: eta },
            { icon: FiTruck,     label: 'Pickup ID', value: donor.id },
          ].map((s) => (
            <div key={s.label} className="glass-card p-3 text-center">
              <s.icon className="w-4 h-4 text-primary-400 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-dark-border" style={{ height: '340px' }}>
        <MapContainer
          center={[donor.lat, donor.lng]}
          zoom={12}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          className={MAP_CONFIG.mapClassName}
        >
          <TileLayer
            url={MAP_CONFIG.darkTileUrl}
            attribution={MAP_CONFIG.darkAttribution}
          />
          <ZoomControl position="bottomright" />

          {/* Route polyline */}
          {routePoints.length >= 2 && (
            <Polyline
              positions={routePoints}
              pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.85, dashArray: '8 4' }}
            />
          )}

          {/* Volunteer marker */}
          {volLocation && (
            <Marker position={[volLocation.lat, volLocation.lng]} icon={volunteerIcon}>
              <Popup>
                <div className="p-2 bg-[#1e293b] text-xs text-white">
                  📍 Your Location<br />
                  <span className="text-slate-400">{distance} km to donor</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Donor marker */}
          <Marker position={[donor.lat, donor.lng]} icon={donorIcon}>
            <Popup maxWidth={220}>
              <div className="p-3 bg-[#1e293b]">
                <h4 className="text-white font-semibold text-xs mb-1">{donor.name}</h4>
                <p className="text-[11px] text-slate-400 flex items-start gap-1">
                  <FiMapPin className="w-3 h-3 shrink-0 mt-0.5 text-orange-400" />
                  {donor.addr}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Arrival radius */}
          <Circle
            center={[donor.lat, donor.lng]}
            radius={300}
            pathOptions={{ color: '#f97316', fillColor: '#f9731620', fillOpacity: 0.3, weight: 1 }}
          />

          {mapPositions.length >= 2 && <FitBounds positions={mapPositions} />}
        </MapContainer>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={getMyLocation}
          disabled={locating || loadingRoute}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl 
                   bg-white/5 border border-white/10 text-slate-300 text-sm 
                   hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
          {locating ? 'Locating...' : 'Update My Location'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openGoogleNavigation}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl 
                   btn-primary text-sm"
        >
          <FiNavigation className="w-4 h-4" />
          Open Navigation
        </motion.button>
      </div>

      {/* Status Update Buttons */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">
          Update Status
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(['pending', 'en_route', 'arrived', 'completed']).map((s) => {
            const cfg = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  toast.success(`Status: ${cfg.label}`);
                }}
                className={`py-2 rounded-xl text-xs transition-all border ${
                  status === s
                    ? `bg-${cfg.color}-500/20 border-${cfg.color}-500/40 text-${cfg.color}-400`
                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="block text-base mb-0.5">{cfg.emoji}</span>
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VolunteerNavigationMap;

