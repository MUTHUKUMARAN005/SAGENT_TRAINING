// src/components/map/PickupRequestMap.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import {
  FiMapPin, FiNavigation, FiClock, FiPackage, FiCheck, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { MAP_CONFIG } from '../../utils/mapConstants';
import { fadeInUp } from '../../animations/variants';

const pinIcon = L.divIcon({
  className: 'custom-marker-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  html: `
    <div style="
      width: 40px; height: 40px;
      background: #3b82f6;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(59,130,246,0.5);
      border: 3px solid white;
    ">
      <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
    </div>
  `,
});

const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const FlyToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.5 });
    }
  }, [position, map]);
  return null;
};

const PickupRequestMap = ({ onPickupSubmit, isSubmitting = false }) => {
  const [step, setStep] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [confirmedPickupId, setConfirmedPickupId] = useState('');
  const [address, setAddress] = useState('');
  const [formData, setFormData] = useState({
    pickup_date: '',
    time_slot: '',
    items: [],
    notes: '',
    contact_phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const submitInFlightRef = useRef(false);
  const effectiveSubmitting = loading || isSubmitting;

  const timeSlots = [
    '9:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM',
    '2:00 PM - 4:00 PM',
    '4:00 PM - 6:00 PM',
  ];

  const itemCategories = [
    { value: 'clothes', label: 'Clothes', icon: '👕' },
    { value: 'food', label: 'Food', icon: '🍲' },
    { value: 'books', label: 'Books', icon: '📚' },
  ];
  const handleLocationSelect = async (latlng) => {
    setSelectedPosition([latlng.lat, latlng.lng]);
    setGeocoding(true);

    // Reverse geocode
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await response.json();
      setAddress(data.display_name || `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    } catch {
      setAddress(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    }
    setGeocoding(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          handleLocationSelect(latlng);
        },
        () => toast.error('Could not get your location'),
        { enableHighAccuracy: true }
      );
    }
  };

  const toggleItem = (item) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.includes(item)
        ? prev.items.filter(i => i !== item)
        : [...prev.items, item],
    }));
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (submitInFlightRef.current || loading || isSubmitting) {
      console.log('[DEBUG] Submission already in progress, ignoring duplicate call');
      return;
    }

    if (!selectedPosition) return toast.error('Please select a pickup location');
    if (!formData.pickup_date) return toast.error('Please select a date');
    if (!formData.time_slot) return toast.error('Please select a time slot');
    if (formData.items.length === 0) return toast.error('Please select items to donate');
    if (!formData.contact_phone) return toast.error('Please enter contact number');

    submitInFlightRef.current = true;
    setLoading(true);

    const pickupData = {
      ...formData,
      address,
      latitude: selectedPosition[0],
      longitude: selectedPosition[1],
      status: 'scheduled',
    };

    console.log('[DEBUG] PickupRequestMap: Submitting pickup data:', pickupData);
    console.log('[DEBUG] pickup_date type:', typeof formData.pickup_date, 'value:', formData.pickup_date);

    try {
      const response = await onPickupSubmit?.(pickupData);
      const pickupId = response?.pickup_id || response?.pickupId || `PKP-${Date.now()}`;
      setConfirmedPickupId(String(pickupId));
      toast.success('Pickup request submitted! 🎉');
      setStep(3);
    } catch (error) {
      // Parent handler surfaces the backend error message via toast.
      console.error('[DEBUG] PickupRequestMap: Submission error:', error);
    } finally {
      setLoading(false);
      submitInFlightRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-4 mb-2">
        {[
          { num: 1, label: 'Location' },
          { num: 2, label: 'Details' },
          { num: 3, label: 'Confirmed' },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                             font-semibold text-sm transition-all duration-500 ${
                               step >= s.num
                                 ? 'bg-primary-600 text-white shadow-glow'
                                 : 'bg-white/5 text-slate-500 border border-white/10'
                             }`}>
                {step > s.num ? <FiCheck className="w-5 h-5" /> : s.num}
              </div>
              <span className="text-[10px] text-slate-500">{s.label}</span>
            </div>
            {idx < 2 && (
              <div className={`w-12 h-0.5 rounded-full transition-all duration-500 -mt-4 ${
                step > s.num ? 'bg-primary-500' : 'bg-white/10'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Location Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="glass-card p-4">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <FiMapPin className="w-5 h-5 text-primary-400" />
                Select Pickup Location
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Click on the map to set your pickup address or use current location
              </p>

              <button
                onClick={getCurrentLocation}
                className="mb-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 
                         border border-primary-500/20 text-primary-400 text-sm hover:bg-primary-500/20 
                         transition-colors"
              >
                <FiNavigation className="w-4 h-4" />
                Use My Current Location
              </button>
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden border border-dark-border" style={{ height: '350px' }}>
              <MapContainer
                center={MAP_CONFIG.defaultCenter}
                zoom={MAP_CONFIG.defaultZoom}
                style={{ height: '100%', width: '100%' }}
                className={MAP_CONFIG.mapClassName}
              >
                <TileLayer
                  url={MAP_CONFIG.darkTileUrl}
                  attribution={MAP_CONFIG.darkAttribution}
                />
                <LocationPicker onLocationSelect={handleLocationSelect} />
                {selectedPosition && (
                  <>
                    <Marker position={selectedPosition} icon={pinIcon} />
                    <FlyToLocation position={selectedPosition} />
                  </>
                )}
              </MapContainer>
            </div>

            {/* Address Display */}
            {selectedPosition && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4"
              >
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Selected Address</p>
                    <p className="text-sm text-white">
                      {geocoding ? 'Fetching address...' : address}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (selectedPosition) setStep(2);
                else toast.error('Please select a location on the map');
              }}
              disabled={!selectedPosition}
              className="w-full btn-primary py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Details
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Pickup Details */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Items Selection */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-primary-400" />
                What are you donating?
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {itemCategories.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => toggleItem(item.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      formData.items.includes(item.value)
                        ? 'border-primary-500 bg-primary-500/10 shadow-glow'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl block mb-1">{item.icon}</span>
                    <span className="text-[10px] text-slate-300">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="glass-card p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FiClock className="w-5 h-5 text-primary-400" />
                Schedule Pickup
              </h3>

              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-1.5 block">Pickup Date</label>
                <input
                  type="date"
                  value={formData.pickup_date}
                  onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Preferred Time Slot</label>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setFormData({ ...formData, time_slot: slot })}
                      className={`py-2.5 rounded-xl text-sm border transition-all ${
                        formData.time_slot === slot
                          ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                          : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="glass-card p-5">
              <label className="text-sm text-slate-400 mb-1.5 block">Contact Phone *</label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="input-field mb-3"
              />

              <label className="text-sm text-slate-400 mb-1.5 block">Special Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions for pickup..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            {/* Summary */}
            <div className="glass-card p-4 bg-primary-500/5 border-primary-500/10">
              <h4 className="text-sm text-white font-semibold mb-2">📋 Pickup Summary</h4>
              <div className="space-y-1 text-xs text-slate-400">
                <p>📍 {address?.substring(0, 60)}...</p>
                <p>📅 {formData.pickup_date || 'Not selected'} | {formData.time_slot || 'Not selected'}</p>
                <p>📦 {formData.items.length > 0 ? formData.items.join(', ') : 'No items selected'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-white/10 rounded-xl text-slate-300 
                         hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={effectiveSubmitting}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
              >
                {effectiveSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full 
                                animate-spin" />
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Confirm Pickup
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 border-2 
                       border-green-500 flex items-center justify-center"
            >
              <FiCheck className="w-10 h-10 text-green-400" />
            </motion.div>

            <h3 className="text-2xl font-heading font-bold text-white mb-2">
              Pickup Scheduled! 🎉
            </h3>
            <p className="text-slate-400 mb-6">
              Our volunteer will arrive at your location on the scheduled date and time.
            </p>

            <div className="glass-card p-4 text-left mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pickup ID</span>
                  <span className="text-primary-400 font-mono">{confirmedPickupId || `PKP-${Date.now()}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date</span>
                  <span className="text-white">{formData.pickup_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time Slot</span>
                  <span className="text-white">{formData.time_slot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Items</span>
                  <span className="text-white capitalize">{formData.items.join(', ')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setConfirmedPickupId('');
                setSelectedPosition(null);
                setAddress('');
                setFormData({ pickup_date: '', time_slot: '', items: [], notes: '', contact_phone: '' });
              }}
              className="btn-secondary"
            >
              Schedule Another Pickup
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PickupRequestMap;