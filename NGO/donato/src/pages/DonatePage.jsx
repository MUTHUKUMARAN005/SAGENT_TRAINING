// Update src/pages/DonatePage.jsx - Add pickup option for non-money donations
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import DonationForm from '../components/donation/DonationForm';
import PickupRequestMap from '../components/map/PickupRequestMap';
import { api } from '../utils/api';
import { pageTransition } from '../animations/variants';
import ProgressBar from '../components/common/ProgressBar';
import { FiUsers, FiCalendar, FiTarget, FiDollarSign, FiPackage, FiLock, FiLogIn, FiUserPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../utils/roles';

const DonatePage = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donationType, setDonationType] = useState('money');
  const [schedulingPickup, setSchedulingPickup] = useState(false);
  const schedulingInFlightRef = useRef(false);

  const handleSchedulePhysicalPickup = async (pickupData) => {
    if (schedulingInFlightRef.current) {
      return null;
    }

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    schedulingInFlightRef.current = true;
    setSchedulingPickup(true);
    try {
      const resolvedCampaignId = Number(campaign?.campaign_id ?? campaign?.id ?? 0);
      if (!Number.isFinite(resolvedCampaignId) || resolvedCampaignId <= 0) {
        throw new Error('Invalid campaign selected for pickup request');
      }

      const donationPayload = {
        campaignId: resolvedCampaignId,
        donationType: 'PHYSICAL',
        amount: 0,
        itemType: pickupData.items?.join(', ') || 'Mixed Items',
        itemCount: pickupData.items?.length || 1,
      };

      console.log('[DEBUG] Creating donation with payload:', donationPayload);
      const donationResult = await api.createDonation(donationPayload);
      const donationResponse = donationResult?.data || donationResult;
      if (!donationResponse || !donationResponse.donation_id) {
        throw new Error('Failed to create donation record');
      }
      console.log('[DEBUG] Donation created:', donationResponse);

      // Ensure pickup_date is in the correct format (yyyy-MM-dd)
      let formattedPickupDate = pickupData.pickup_date;
      if (formattedPickupDate && typeof formattedPickupDate === 'string') {
        // If it's already in correct format, use it; otherwise try to parse
        const dateMatch = formattedPickupDate.match(/^\d{4}-\d{2}-\d{2}$/);
        if (!dateMatch) {
          // Try to convert it to the right format
          const date = new Date(formattedPickupDate);
          if (!isNaN(date.getTime())) {
            formattedPickupDate = date.toISOString().split('T')[0];
          }
        }
      }

      const resolvedDonationId = Number(
        donationResponse?.donation_id ?? donationResponse?.donationId ?? donationResponse?.id ?? 0
      );
      if (!Number.isFinite(resolvedDonationId) || resolvedDonationId <= 0) {
        throw new Error('Failed to create a valid donation for pickup scheduling');
      }

      const pickupPayload = {
        donationId: resolvedDonationId,
        address: String(pickupData.address || '').trim(),
        pickupDate: formattedPickupDate,
        timeSlot: String(pickupData.time_slot || '').trim(),
        contactPhone: String(pickupData.contact_phone || '').trim(),
        notes: String(pickupData.notes || '').trim(),
        latitude: pickupData.latitude,
        longitude: pickupData.longitude,
      };

      console.log('[DEBUG] Scheduling pickup with payload:', pickupPayload);
      console.log('[DEBUG] Pickup payload types:', {
        donationId: typeof pickupPayload.donationId,
        address: typeof pickupPayload.address,
        pickupDate: typeof pickupPayload.pickupDate,
        timeSlot: typeof pickupPayload.timeSlot,
        contactPhone: typeof pickupPayload.contactPhone,
        latitude: typeof pickupPayload.latitude,
        longitude: typeof pickupPayload.longitude,
      });
      console.log('[DEBUG] Pickup payload JSON:', JSON.stringify(pickupPayload, null, 2));
      
      const pickupResult = await api.schedulePickup(pickupPayload);
      const pickupResponse = pickupResult?.data || pickupResult;
      if (!pickupResponse || !pickupResponse.pickup_id) {
        throw new Error('Failed to schedule pickup');
      }

      console.log('[DEBUG] Pickup scheduled:', pickupResponse);
      toast.success('Physical donation scheduled! Volunteers will review your pickup request.');
      setDonationType('money');
      const role = normalizeRole(user?.role);
      const redirectByRole = {
        donor: '/dashboard/donor/history',
        admin: '/dashboard/admin/pickups',
        ngo: '/dashboard/ngo/pickups',
        volunteer: '/dashboard/volunteer/tasks',
      };
      const pickupId = String(pickupResponse.pickup_id || pickupResponse.pickupId || '').trim();
      const search = new URLSearchParams({
        pickupCreated: '1',
        ...(pickupId ? { pickupId } : {}),
      }).toString();
      navigate(`${redirectByRole[role] || '/dashboard'}?${search}`, { replace: false });
      return pickupResponse;
    } catch (error) {
      console.error('[DEBUG] Pickup scheduling error:', error);
      toast.error(error?.message || 'Failed to schedule pickup. Please try again.');
      throw error;
    } finally {
      setSchedulingPickup(false);
      schedulingInFlightRef.current = false;
    }
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      if (campaignId) {
        const result = await api.getCampaignById(campaignId);
        setCampaign(result || null);
      } else {
        const result = await api.getCampaigns();
        const campaigns = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];
        setCampaign(campaigns[0] || null);
      }
      setLoading(false);
    };
    fetchCampaign();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 
                      rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Auth Gate ── */
  if (!isAuthenticated) {
    return (
      <motion.div {...pageTransition} className="pt-24 pb-16 min-h-screen">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[70vh]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-10 text-center w-full"
          >
            {/* Lock Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-500/15 border-2 border-primary-500/40 flex items-center justify-center"
            >
              <FiLock className="w-9 h-9 text-primary-400" />
            </motion.div>

            <h2 className="text-2xl font-heading font-bold text-white mb-3">
              Sign In to Donate
            </h2>
            <p className="text-slate-400 text-sm mb-2 leading-relaxed">
              You need to be logged in to make a donation.
            </p>
            <p className="text-slate-500 text-xs mb-8 leading-relaxed">
              Please log in or create an account to continue supporting our campaigns.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                state={{ from: { pathname: window.location.pathname } }}
                className="flex-1 flex items-center justify-center gap-2 btn-primary py-3 text-base font-semibold"
              >
                <FiLogIn className="w-5 h-5" />
                Log In
              </Link>
              <Link
                to="/register"
                state={{ from: { pathname: window.location.pathname } }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/20 text-slate-200 hover:bg-white/5 hover:border-white/30 transition-all text-base font-semibold"
              >
                <FiUserPlus className="w-5 h-5" />
                Register
              </Link>
            </div>

            <p className="mt-6 text-xs text-slate-500">
              Want to explore campaigns first?{' '}
              <Link to="/campaigns" className="text-primary-400 hover:underline">
                Browse Campaigns
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageTransition} className="pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Donation Type Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <button
            onClick={() => setDonationType('money')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              donationType === 'money'
                ? 'bg-primary-600 text-white shadow-glow'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <FiDollarSign className="w-5 h-5" />
            Monetary Donation
          </button>
          <button
            onClick={() => setDonationType('physical')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              donationType === 'physical'
                ? 'bg-accent-orange text-white shadow-lg'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <FiPackage className="w-5 h-5" />
            Physical Donation
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Campaign Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="glass-card overflow-hidden sticky top-24">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={campaign?.image}
                  alt={campaign?.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://picsum.photos/seed/kindwave-fallback/1200/800';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="px-3 py-1 rounded-full bg-green-500/20 border 
                               border-green-500/30 text-green-400 text-xs font-medium">
                    ● Active Campaign
                  </span>
                </div>
              </div>

              <div className="p-6">
                <p className="text-xs text-primary-400 font-medium mb-2">
                  {campaign?.ngo_name}
                </p>
                <h2 className="text-2xl font-heading font-bold text-white mb-3">
                  {campaign?.title}
                </h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  {campaign?.description}
                </p>

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-bold text-lg">
                      ₹{(campaign?.collected_amount / 1000).toFixed(0)}K raised
                    </span>
                    <span className="text-slate-400 text-sm">
                      of ₹{(campaign?.target_amount / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <ProgressBar
                    value={campaign?.collected_amount || 0}
                    max={campaign?.target_amount || 1}
                    height="h-3"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: FiUsers, label: 'Donors', value: campaign?.donors_count },
                    { icon: FiCalendar, label: 'Days Left', value: Math.ceil((new Date(campaign?.end_date) - new Date()) / 86400000) },
                    { icon: FiTarget, label: 'Goal', value: `₹${(campaign?.target_amount / 1000).toFixed(0)}K` },
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center p-3 rounded-xl bg-white/3">
                      <stat.icon className="w-4 h-4 text-primary-400 mx-auto mb-1" />
                      <p className="text-white font-semibold text-sm">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form / Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {donationType === 'money' ? (
                <motion.div
                  key="money"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <DonationForm campaign={campaign} />
                </motion.div>
              ) : (
                <motion.div
                  key="physical"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="glass-card p-6 mb-4">
                    <h3 className="text-xl font-heading font-bold text-white mb-2 flex items-center gap-2">
                      <FiPackage className="w-5 h-5 text-accent-orange" />
                      Schedule a Pickup
                    </h3>
                    <p className="text-sm text-slate-400">
                      Select your location on the map and schedule a volunteer 
                      pickup for your physical donation items.
                    </p>
                  </div>
                  <PickupRequestMap
                    isSubmitting={schedulingPickup}
                    onPickupSubmit={handleSchedulePhysicalPickup}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DonatePage;
