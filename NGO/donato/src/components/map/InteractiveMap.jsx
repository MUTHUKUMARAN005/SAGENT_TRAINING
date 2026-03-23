// src/components/map/InteractiveMap.jsx
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiFilter, FiMapPin, FiList, FiMap, FiNavigation,
  FiChevronDown, FiX, FiLayers, FiTarget
} from 'react-icons/fi';
import { NGOMarker, PickupMarker, CampaignMarker } from './CustomMarker';
import {
  MAP_CONFIG, NGO_LOCATIONS, PICKUP_LOCATIONS,
  CAMPAIGN_LOCATIONS, MAP_CATEGORIES
} from '../../utils/mapConstants';
import { fadeInUp, staggerContainer } from '../../animations/variants';

// Map controller to fly to locations
const MapController = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 12, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

// Locate user button
const LocateControl = () => {
  const map = useMap();

  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 13, enableHighAccuracy: true });
    map.on('locationfound', (e) => {
      // User located
    });
    map.on('locationerror', () => {
      alert('Location access denied or not available');
    });
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '10px', marginRight: '10px' }}>
      <div className="leaflet-control">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLocate}
          className="w-9 h-9 rounded-xl bg-dark-card border border-dark-border flex items-center 
                   justify-center text-white hover:bg-primary-600 hover:border-primary-500 
                   transition-all shadow-lg"
          title="Find my location"
        >
          <FiNavigation className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

const InteractiveMap = ({
  showNGOs = true,
  showPickups = true,
  showCampaigns = true,
  height = '600px',
  showControls = true,
  showSearch = true,
  showSidebar = true,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // map or list
  const [showLayers, setShowLayers] = useState(false);
  const [layers, setLayers] = useState({
    ngos: showNGOs,
    pickups: showPickups,
    campaigns: showCampaigns,
  });
  const mapRef = useRef(null);

  const filteredNGOs = useMemo(() => {
    return NGO_LOCATIONS.filter((ngo) => {
      const matchCategory = activeCategory === 'all' || ngo.category === activeCategory;
      const matchSearch = !search ||
        ngo.name.toLowerCase().includes(search.toLowerCase()) ||
        ngo.city.toLowerCase().includes(search.toLowerCase()) ||
        ngo.state.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, search]);

  const handleNGOClick = useCallback((ngo) => {
    setSelectedNGO(ngo);
    setMapCenter([ngo.lat, ngo.lng]);
    setMapZoom(14);
  }, []);

  const handleResetView = useCallback(() => {
    setMapCenter(MAP_CONFIG.defaultCenter);
    setMapZoom(MAP_CONFIG.defaultZoom);
    setSelectedNGO(null);
  }, []);

  const toggleLayer = (layer) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Top Controls */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            {showSearch && (
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search NGOs, cities, states..."
                  className="input-field pl-11 pr-10"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 
                             hover:text-white transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {MAP_CATEGORIES.slice(0, 6).map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap 
                           transition-all flex items-center gap-1.5 ${
                    activeCategory === cat.value
                      ? 'text-white shadow-glow'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                  style={{
                    background: activeCategory === cat.value ? cat.color : undefined,
                  }}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* View & Layer Controls */}
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'map' ? 'bg-primary-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <FiMap className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>

              {/* Layers Control */}
              <div className="relative">
                <button
                  onClick={() => setShowLayers(!showLayers)}
                  className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 
                           transition-colors"
                >
                  <FiLayers className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showLayers && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 glass-card p-3 z-50 shadow-xl"
                    >
                      <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
                        Map Layers
                      </p>
                      {[
                        { key: 'ngos', label: 'NGO Locations', icon: '🏢', count: NGO_LOCATIONS.length },
                        { key: 'pickups', label: 'Pickup Centers', icon: '📦', count: PICKUP_LOCATIONS.length },
                        { key: 'campaigns', label: 'Campaign Areas', icon: '🎯', count: CAMPAIGN_LOCATIONS.length },
                      ].map((layer) => (
                        <label
                          key={layer.key}
                          className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 
                                   rounded-lg px-2 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={layers[layer.key]}
                            onChange={() => toggleLayer(layer.key)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 
                                     text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm">{layer.icon}</span>
                          <span className="text-sm text-slate-300 flex-1">{layer.label}</span>
                          <span className="text-xs text-slate-500">{layer.count}</span>
                        </label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reset View */}
              <button
                onClick={handleResetView}
                className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 
                         transition-colors"
                title="Reset view"
              >
                <FiTarget className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-slate-400">
              Showing <span className="text-white font-semibold">{filteredNGOs.length}</span> NGOs
              {activeCategory !== 'all' && (
                <span className="ml-1">
                  in <span className="text-primary-400 capitalize">{activeCategory}</span>
                </span>
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex gap-4" style={{ height }}>
        {/* Sidebar (List View) */}
        {showSidebar && (
          <AnimatePresence>
            {viewMode === 'list' && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '380px' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <div className="h-full overflow-y-auto pr-2 space-y-3 scrollbar-thin 
                              scrollbar-thumb-white/10" style={{ width: '380px' }}>
                  {filteredNGOs.map((ngo, idx) => (
                    <motion.div
                      key={ngo.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleNGOClick(ngo)}
                      className={`glass-card p-4 cursor-pointer transition-all hover:border-primary-500/30 
                               ${selectedNGO?.id === ngo.id ? 'border-primary-500/50 bg-primary-500/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={ngo.image}
                          alt={ngo.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <h4 className="text-white font-semibold text-sm truncate">
                              {ngo.name}
                            </h4>
                            {ngo.verified && (
                              <span className="text-green-400 text-xs">✓</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mb-1">
                            {ngo.city}, {ngo.state}
                          </p>
                          <p className="text-xs text-slate-400 line-clamp-2">{ngo.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-primary-400">
                              {ngo.activeCampaigns} campaigns
                            </span>
                            <span className="text-xs text-green-400">
                              {ngo.totalDonations} raised
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {filteredNGOs.length === 0 && (
                    <div className="text-center py-12">
                      <span className="text-4xl block mb-2">🔍</span>
                      <p className="text-slate-400 text-sm">No NGOs found</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-dark-border relative">
          <MapContainer
            center={MAP_CONFIG.defaultCenter}
            zoom={MAP_CONFIG.defaultZoom}
            minZoom={MAP_CONFIG.minZoom}
            maxZoom={MAP_CONFIG.maxZoom}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
            className={MAP_CONFIG.mapClassName}
          >
            <TileLayer
              url={MAP_CONFIG.darkTileUrl}
              attribution={MAP_CONFIG.darkAttribution}
            />
            <ZoomControl position="bottomright" />
            <LocateControl />

            {mapCenter && <MapController center={mapCenter} zoom={mapZoom} />}

            {/* NGO Markers */}
            {layers.ngos && filteredNGOs.map((ngo) => (
              <NGOMarker key={`ngo-${ngo.id}`} ngo={ngo} />
            ))}

            {/* Pickup Center Markers */}
            {layers.pickups && PICKUP_LOCATIONS.map((loc) => (
              <PickupMarker key={`pickup-${loc.id}`} location={loc} />
            ))}

            {/* Campaign Location Markers */}
            {layers.campaigns && CAMPAIGN_LOCATIONS.map((campaign) => (
              <CampaignMarker key={`campaign-${campaign.campaign_id}`} campaign={campaign} />
            ))}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-[999] glass-card p-3">
            <p className="text-xs text-slate-500 mb-2 font-medium">Legend</p>
            <div className="space-y-1.5">
              {[
                { color: '#3b82f6', label: 'NGO Location', icon: '🏢' },
                { color: '#f97316', label: 'Pickup Center', icon: '📦' },
                { color: '#22c55e', label: 'Campaign Area', icon: '🎯' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] text-slate-400">{item.icon} {item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
