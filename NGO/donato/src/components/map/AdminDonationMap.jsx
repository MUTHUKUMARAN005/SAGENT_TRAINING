// src/components/map/AdminDonationMap.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl
} from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import {
  FiUsers, FiPackage, FiRefreshCw, FiCheckCircle, FiTruck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { MAP_CONFIG } from '../../utils/mapConstants';
import { api } from '../../utils/api';

// ── Icon factories ─────────────────────────────────────
const makeIcon = (color, emoji, size = 36) =>
  L.divIcon({
    className: 'custom-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 14px rgba(15,23,42,0.35);
        border: 2px solid rgba(255,255,255,0.85);
      ">
        <span style="transform: rotate(45deg); font-size: ${size * 0.42}px;">${emoji}</span>
      </div>
    `,
  });

const ngoIcon        = makeIcon('#8b5cf6', '🏢',  38);
const pickupIcon     = makeIcon('#f97316', '📦',  34);
const alertIcon      = makeIcon('#ef4444', '⚠️',  32);

// ── Live-update overlay ────────────────────────────────
const LAYER_KEYS = ['ngos', 'pickups'];

const statusColor = {
  active: 'text-green-400 bg-green-500/10',
  pending: 'text-yellow-400 bg-yellow-500/10',
  completed: 'text-slate-400 bg-white/5',
  scheduled: 'text-blue-400 bg-blue-500/10',
  in_progress: 'text-orange-400 bg-orange-500/10',
  en_route: 'text-blue-400 bg-blue-500/10',
  available: 'text-green-400 bg-green-500/10',
};

// ── Map auto-refresh indicator ─────────────────────────
const AdminDonationMap = ({ height = '500px' }) => {
  const [layers, setLayers] = useState({ ngos: true, pickups: true });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [pickups, setPickups] = useState([]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const [ngoResult, ...pickupResults] = await Promise.allSettled([
        api.getNGOs(),
        api.getPickupsByStatus('SCHEDULED'),
        api.getPickupsByStatus('PENDING'),
        api.getPickupsByStatus('IN_PROGRESS'),
        api.getPickupsByStatus('COMPLETED'),
      ]);

      if (ngoResult.status === 'fulfilled' && ngoResult.value?.success) {
        setNgos(Array.isArray(ngoResult.value.data) ? ngoResult.value.data : []);
      }

      const mergedPickups = pickupResults
        .filter((result) => result.status === 'fulfilled' && result.value?.success)
        .flatMap((result) => result.value.data || []);

      const uniquePickups = Array.from(
        new Map(mergedPickups.map((pickup) => [pickup.pickup_id, pickup])).values()
      );

      setPickups(uniquePickups);
      setLastUpdate(new Date());
    } catch (error) {
      toast.error(error?.message || 'Unable to refresh admin map data');
      setNgos([]);
      setPickups([]);
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh every 30s
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleLayer = (key) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const layerConfig = useMemo(() => ({
    ngos: { label: 'NGO Offices', icon: '🏢', color: '#8b5cf6', count: ngos.length },
    pickups: { label: 'Pickup Requests', icon: '📦', color: '#f97316', count: pickups.length },
  }), [ngos.length, pickups.length]);

  const activePickups = pickups.filter((p) => p.pickup_status !== 'completed').length;
  const verifiedNgos = ngos.filter((ngo) => ngo.verified).length;
  const citiesCovered = new Set(ngos.map((ngo) => `${ngo.city}-${ngo.state}`)).size;
  const pickupMarkers = pickups.filter((pickup) => pickup.latitude != null && pickup.longitude != null);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Mini Stats */}
        <div className="grid grid-cols-4 gap-3 flex-1">
          {[
            { icon: FiUsers,       label: 'Verified NGOs',   value: verifiedNgos,   color: 'text-blue-400' },
            { icon: FiTruck,       label: 'Pickup Requests', value: pickups.length,  color: 'text-green-400' },
            { icon: FiPackage,     label: 'Pending Pickups', value: activePickups,   color: 'text-orange-400' },
            { icon: FiCheckCircle, label: 'Cities Covered',  value: citiesCovered,   color: 'text-purple-400' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-3 text-center">
              <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
              <p className="text-white font-bold text-sm">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-400
                   hover:bg-white/10 transition-colors text-sm disabled:opacity-50 self-start"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="flex flex-wrap gap-2">
        {LAYER_KEYS.map((key) => {
          const cfg = layerConfig[key];
          return (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all
                         border ${layers[key]
                ? 'border-transparent text-white'
                : 'border-white/10 text-slate-500 hover:text-slate-300'
              }`}
              style={layers[key] ? { background: cfg.color + '30', borderColor: cfg.color + '60' } : {}}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span
                className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ background: cfg.color + '20', color: cfg.color }}
              >
                {cfg.count}
              </span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live · Updated {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Map */}
      <div
        className="rounded-2xl overflow-hidden border border-dark-border relative"
        style={{ height }}
      >
        <MapContainer
          center={MAP_CONFIG.defaultCenter}
          zoom={5}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          className={MAP_CONFIG.mapClassName}
        >
          <TileLayer
            url={MAP_CONFIG.darkTileUrl}
            attribution={MAP_CONFIG.darkAttribution}
          />
          <ZoomControl position="bottomright" />

          {/* NGO markers */}
          {layers.ngos && ngos.filter((ngo) => ngo.lat != null && ngo.lng != null).map((ngo) => (
            <Marker
              key={`ngo-${ngo.id}`}
              position={[ngo.lat, ngo.lng]}
              icon={ngoIcon}
              eventHandlers={{ click: () => setSelectedItem({ type: 'ngo', data: ngo }) }}
            >
              <Popup maxWidth={240}>
                <div className="p-3 bg-[#1e293b]">
                  <h4 className="text-white font-semibold text-xs mb-1">{ngo.name}</h4>
                  <p className="text-[11px] text-slate-400">{ngo.city}, {ngo.state}</p>
                  <p className="text-[11px] text-purple-400 mt-1">{ngo.activeCampaigns} active campaigns</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Pickup markers */}
          {layers.pickups && pickupMarkers.map((pickup) => (
            <React.Fragment key={`pickup-${pickup.id}`}>
              <Marker
                position={[pickup.latitude, pickup.longitude]}
                icon={pickup.pickup_status === 'pending' || String(pickup?.pickupStatus || '').toLowerCase() === 'pending' ? alertIcon : pickupIcon}
                eventHandlers={{ click: () => setSelectedItem({ type: 'pickup', data: pickup }) }}
              >
                <Popup maxWidth={240}>
                  <div className="p-3 bg-[#1e293b]">
                    <h4 className="text-white font-semibold text-xs mb-1">📦 PKP-{pickup.pickup_id}</h4>
                    <p className="text-[11px] text-slate-400 mb-1">{pickup.donor_address}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${statusColor[pickup.pickup_status] || statusColor[String(pickup?.pickupStatus || '').toLowerCase()]}`}>
                      {(pickup.pickup_status || String(pickup?.pickupStatus || '').toLowerCase()).replace('_', ' ')}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">{pickup.items.join(', ') || 'No items listed'}</p>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[pickup.latitude, pickup.longitude]}
                radius={400}
                pathOptions={{ color: '#f97316', fillColor: '#f9731615', fillOpacity: 0.3, weight: 1 }}
              />
            </React.Fragment>
          ))}
        </MapContainer>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 z-[999] glass-card p-3">
          <p className="text-[10px] text-slate-500 mb-2 font-semibold uppercase tracking-wider">
            Legend
          </p>
          {[
            { color: '#8b5cf6', label: 'NGO Office',      icon: '🏢' },
            { color: '#f97316', label: 'Pickup Request',  icon: '📦' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-[10px] text-slate-400">{item.icon} {item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Item Detail */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass-card p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {selectedItem.type === 'ngo' && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">🏢 NGO OFFICE</p>
                    <h4 className="text-white font-semibold text-sm">{selectedItem.data.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{selectedItem.data.address || `${selectedItem.data.city}, ${selectedItem.data.state}`}</p>
                    <p className="text-xs text-purple-400 mt-1">{selectedItem.data.activeCampaigns} campaigns</p>
                  </div>
                )}
                {selectedItem.type === 'pickup' && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">📦 PICKUP REQUEST</p>
                    <h4 className="text-white font-semibold text-sm">PKP-{selectedItem.data.pickup_id}</h4>
                    <p className="text-xs text-slate-400 mt-1">{selectedItem.data.donor_address}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusColor[selectedItem.data.pickup_status]}`}>
                        {selectedItem.data.pickup_status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500">{selectedItem.data.items.join(', ') || 'No items listed'}</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDonationMap;

