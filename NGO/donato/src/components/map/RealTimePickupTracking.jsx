import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiActivity, FiPause, FiPlay, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import VolunteerNavigationMap from './VolunteerNavigationMap';

const lerp = (start, end, amount) => start + (end - start) * amount;

const RealTimePickupTracking = () => {
  const [pickups, setPickups] = useState([]);
  const [selectedPickupId, setSelectedPickupId] = useState('');
  const [volunteerLocation, setVolunteerLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoTrack, setAutoTrack] = useState(true);

  const loadTrackingData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getLivePickupTracking();
      const rows = Array.isArray(result?.data) ? result.data : [];
      setPickups(rows);

      if (!selectedPickupId && rows.length > 0) {
        setSelectedPickupId(String(rows[0].pickup_id));
      }
    } catch (_error) {
      toast.error('Unable to load live pickup tracking right now.');
      setPickups([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPickupId]);

  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  const selectedPickup = useMemo(
    () => pickups.find((p) => String(p.pickup_id) === String(selectedPickupId)) || pickups[0] || null,
    [pickups, selectedPickupId]
  );

  useEffect(() => {
    if (!selectedPickup) {
      setVolunteerLocation(null);
      return;
    }

    const fallbackStart = {
      lat: (Number(selectedPickup.latitude) || 19.0760) - 0.015,
      lng: (Number(selectedPickup.longitude) || 72.8777) + 0.015,
    };

    setVolunteerLocation({
      lat: Number(selectedPickup.volunteer_latitude) || fallbackStart.lat,
      lng: Number(selectedPickup.volunteer_longitude) || fallbackStart.lng,
    });
  }, [selectedPickup]);

  useEffect(() => {
    if (!autoTrack || !selectedPickup || !volunteerLocation) return undefined;

    const donorLat = Number(selectedPickup.latitude);
    const donorLng = Number(selectedPickup.longitude);
    if (!Number.isFinite(donorLat) || !Number.isFinite(donorLng)) return undefined;

    const timer = setInterval(() => {
      setVolunteerLocation((prev) => {
        if (!prev) return prev;

        const nextLat = lerp(prev.lat, donorLat, 0.18);
        const nextLng = lerp(prev.lng, donorLng, 0.18);
        const nearDonor = Math.abs(nextLat - donorLat) < 0.0006 && Math.abs(nextLng - donorLng) < 0.0006;

        if (nearDonor) {
          return { lat: donorLat, lng: donorLng };
        }

        return { lat: nextLat, lng: nextLng };
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [autoTrack, selectedPickup, volunteerLocation]);

  return (
    <div className="dashboard-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FiActivity className="w-5 h-5 text-primary-400" />
            Real-Time Pickup Tracking
          </h3>
          <p className="text-xs text-slate-500">Map shows volunteer movement towards donor location</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoTrack((v) => !v)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300
                     text-xs inline-flex items-center gap-1.5 hover:bg-white/10"
          >
            {autoTrack ? <FiPause className="w-3.5 h-3.5" /> : <FiPlay className="w-3.5 h-3.5" />}
            {autoTrack ? 'Pause' : 'Resume'}
          </button>

          <button
            onClick={loadTrackingData}
            className="px-3 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-300
                     text-xs inline-flex items-center gap-1.5 hover:bg-primary-500/20"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {pickups.length > 0 && (
        <select
          value={String(selectedPickup?.pickup_id || '')}
          onChange={(e) => setSelectedPickupId(e.target.value)}
          className="input-field"
        >
          {pickups.map((pickup) => (
            <option key={pickup.pickup_id} value={String(pickup.pickup_id)}>
              {pickup.donor_name} - {pickup.donor_address || 'Pickup Address'}
            </option>
          ))}
        </select>
      )}

      {!selectedPickup ? (
        <div className="glass-card p-6 text-center text-slate-400 text-sm">
          No live pickups available right now.
        </div>
      ) : (
        <VolunteerNavigationMap
          pickupRequest={selectedPickup}
          volunteerLocation={volunteerLocation}
        />
      )}
    </div>
  );
};

export default RealTimePickupTracking;

