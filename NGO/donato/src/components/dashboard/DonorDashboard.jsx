import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiHeart, FiTarget, FiAward, FiArrowRight, FiDownload,
  FiMapPin, FiCalendar, FiFileText, FiTrendingUp, FiHome,
  FiClock, FiBell, FiRefreshCw, FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import StatCard from './widgets/StatCard';
import DonationHistory from './widgets/DonationHistory';
import NearbyNGOMap from './widgets/NearbyNGOMap';
import CampaignRecommendations from '../campaigns/CampaignRecommendations';
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from '../../animations/variants';
import { api } from '../../utils/api';
import { useWishlist } from '../../hooks/useWishlist';

// Donor Dashboard Menu Sections
const donorSections = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard/donor', icon: FiHome },
  { key: 'donations', label: 'My Donations', path: '/dashboard/donor/donations', icon: FiHeart },
  { key: 'campaigns', label: 'Campaigns', path: '/dashboard/donor/campaigns', icon: FiTarget },
  { key: 'history', label: 'History', path: '/dashboard/donor/history', icon: FiClock },
  { key: 'notifications', label: 'Notifications', path: '/dashboard/donor/notifications', icon: FiBell },
  { key: 'profile', label: 'Profile', path: '/dashboard/donor/profile', icon: FiUser },
];

const resolveDonorSectionFromPath = (pathname = '') => {
  if (pathname.startsWith('/dashboard/donor/donations')) return 'donations';
  if (pathname.startsWith('/dashboard/donor/campaigns')) return 'campaigns';
  if (pathname.startsWith('/dashboard/donor/history')) return 'history';
  if (pathname.startsWith('/dashboard/donor/notifications')) return 'notifications';
  if (pathname.startsWith('/dashboard/donor/profile')) return 'profile';
  return 'dashboard';
};

const DonorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [donationHistory, setDonationHistory] = useState([]);
  const [myReceipts, setMyReceipts] = useState([]);
  const [pickupHistory, setPickupHistory] = useState([]);
  const [donorStats, setDonorStats] = useState(null);
  const [ratingDraftByPickup, setRatingDraftByPickup] = useState({});
  const [ratingSubmittingPickupId, setRatingSubmittingPickupId] = useState(null);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const { wishlistItems, removeFromWishlist } = useWishlist();

  useEffect(() => {
    setCurrentSection(resolveDonorSectionFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const pickupCreated = params.get('pickupCreated') === '1';
    if (!pickupCreated) return;

    const pickupId = String(params.get('pickupId') || '').trim();
    toast.success(pickupId ? `Pickup ${pickupId} scheduled successfully.` : 'Pickup scheduled successfully.');
    setCurrentSection('history');
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      const [donationsResult, receiptsResult, pickupsResult, donorStatsResult] = await Promise.allSettled([
        api.getDonationHistory(),
        api.getMyReceipts(),
        api.getMyPickups(),
        api.getDonorStats(),
      ]);

      if (!isMounted) return;

      const unwrapList = (promiseResult) => {
        if (promiseResult.status !== 'fulfilled') return [];
        const value = promiseResult.value;
        if (Array.isArray(value?.data)) return value.data;
        if (Array.isArray(value)) return value;
        return [];
      };

       const donations = unwrapList(donationsResult);
       const pickups = unwrapList(pickupsResult);
       const receipts = unwrapList(receiptsResult);

       const statsData = donorStatsResult.status === 'fulfilled'
         ? donorStatsResult.value?.data || donorStatsResult.value || null
         : null;

       console.log('[DonorDashboard] Fetched pickups:', pickups);
       setDonationHistory(donations);
       setMyReceipts(receipts);
       setPickupHistory(pickups);
       setDonorStats(statsData);
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const completedDonations = useMemo(
    () => donationHistory.filter((d) => d.status === 'completed'),
    [donationHistory]
  );

  const totalDonated = useMemo(
    () => completedDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0),
    [completedDonations]
  );

  const campaignsSupported = useMemo(
    () =>
      new Set(
        donationHistory
          .map((d) => d.campaign_id || d.campaign || d.campaign_name)
          .filter(Boolean)
      ).size,
    [donationHistory]
  );

  const peopleHelped = useMemo(() => {
    const fromApi = Number(donorStats?.people_helped ?? donorStats?.peopleHelped);
    if (Number.isFinite(fromApi) && fromApi > 0) return Math.round(fromApi);
    return Math.max(0, Math.round(totalDonated / 250));
  }, [donorStats, totalDonated]);

  const stats = [
    {
      icon: FiHeart,
      title: 'Total Donated',
      value: totalDonated,
      suffix: '',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: FiAward,
      title: 'Donations Made',
      value: completedDonations.length,
      suffix: '',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FiTarget,
      title: 'Campaigns Supported',
      value: campaignsSupported,
      suffix: '',
      color: 'from-primary-500 to-blue-500',
    },
    {
      icon: FiTrendingUp,
      title: 'People Helped',
      value: peopleHelped,
      suffix: '',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  const recentReceipts = useMemo(
    () => {
      const receipts = myReceipts
        .filter((r) => r?.receipt_number)
        .sort((a, b) => {
          const left = new Date(a.issued_date || a.date || 0).getTime();
          const right = new Date(b.issued_date || b.date || 0).getTime();
          return right - left;
        });

      if (receipts.length > 0) return receipts.slice(0, 3);

      return completedDonations
        .filter((d) => d.receipt_number)
        .slice(0, 3);
    },
    [completedDonations, myReceipts]
  );

  const normalizedPickups = useMemo(
    () =>
      pickupHistory
      .map((pickup, idx) => ({
        id: pickup.pickup_id || pickup.id || idx,
        pickup_id: pickup.pickup_id || pickup.pickupId || `PICK-${1000 + idx}`,
        donation_id: pickup.donation_id || pickup.donationId || null,
        volunteer_name: pickup.volunteer_name || pickup.volunteerName || '',
        status: (pickup.pickup_status || pickup.pickupStatus || pickup.status || 'pending').toLowerCase(),
        date: pickup.pickup_date || pickup.pickupDate || '-',
        time_slot: pickup.time_slot || pickup.timeSlot || '-',
        address: pickup.donor_address || pickup.address || '-',
        items: Array.isArray(pickup.items) ? pickup.items : [],
      }))
      .sort((left, right) => {
        const leftTime = new Date(left.date || '').getTime();
        const rightTime = new Date(right.date || '').getTime();
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
        return safeRight - safeLeft;
      }),
    [pickupHistory]
  );

  const updateRatingDraft = (pickupId, patch = {}) => {
    setRatingDraftByPickup((prev) => ({
      ...prev,
      [pickupId]: {
        stars: Number(prev[pickupId]?.stars || 5),
        feedback: String(prev[pickupId]?.feedback || ''),
        submitted: Boolean(prev[pickupId]?.submitted),
        ...patch,
      },
    }));
  };

  const submitPickupRating = async (pickupId) => {
    const draft = ratingDraftByPickup[pickupId] || { stars: 5, feedback: '' };
    const stars = Number(draft.stars || 0);

    if (stars < 1 || stars > 5) {
      toast.error('Please select a rating between 1 and 5 stars.');
      return;
    }

    setRatingSubmittingPickupId(pickupId);
    try {
      await api.submitPickupRating(pickupId, {
        stars,
        feedback: draft.feedback || '',
      });
      updateRatingDraft(pickupId, { submitted: true });
      toast.success('Thank you for rating the volunteer.');
    } catch (error) {
      toast.error(error?.message || 'Unable to submit rating.');
    } finally {
      setRatingSubmittingPickupId(null);
    }
  };

  const donationBreakdown = useMemo(() => {
    const total = completedDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    if (total === 0) return [];

    const grouped = completedDonations.reduce((acc, donation) => {
      const rawType = String(donation.type || donation.donation_type || 'other').toLowerCase();
      const label = rawType === 'money' ? 'Money' : rawType === 'item' ? 'Items' : 'Other';
      acc[label] = (acc[label] || 0) + Number(donation.amount || 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([label, amount], index) => ({
        label,
        amount,
        percentage: Math.round((amount / total) * 100),
        color: [
          'from-purple-500 to-blue-500',
          'from-red-500 to-orange-500',
          'from-green-500 to-emerald-500',
          'from-yellow-500 to-amber-500',
        ][index % 4],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [completedDonations]);

  const handleViewReceipt = (entry) => {
    const receiptNumber = entry?.receipt_number;
    if (!receiptNumber) return;
    navigate(`/receipt/${encodeURIComponent(receiptNumber)}`);
  };

  // Dashboard Overview Section
  const DashboardOverviewSection = () => (
    <motion.div variants={fadeInUp} className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-white">Dashboard Overview</h2>

      {/* ---- Impact Banner ---- */}
      <motion.div
        variants={fadeInUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900/80
                 via-blue-900/60 to-primary-900/80 border border-primary-500/20"
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20">
          <img
            src="https://picsum.photos/seed/kindwave-impact/900/500"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-transparent" />
        </div>

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🌟</span>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-white">
              Your Donation Impact
            </h2>
          </div>
          <p className="text-slate-300 mb-6 max-w-lg">
            You have completed <span className="text-primary-400 font-semibold">{completedDonations.length} donations</span>
            {' '}supporting <span className="text-primary-400 font-semibold">{campaignsSupported} campaigns</span>
            {' '}with a total contribution of <span className="text-primary-400 font-semibold">₹{totalDonated.toLocaleString()}</span>.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/campaigns">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-accent flex items-center gap-2 py-2.5 px-6 text-sm"
              >
                <FiHeart className="w-4 h-4" />
                Donate Again
              </motion.button>
            </Link>
            <Link to="/map">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary flex items-center gap-2 py-2.5 px-6 text-sm"
              >
                <FiMapPin className="w-4 h-4" />
                Explore Map
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: recentReceipts.length > 0 ? 1.05 : 1 }}
              whileTap={{ scale: recentReceipts.length > 0 ? 0.95 : 1 }}
              disabled={recentReceipts.length === 0}
              onClick={() => {
                if (recentReceipts.length > 0) {
                  handleViewReceipt(recentReceipts[0]);
                }
              }}
              className="btn-ghost flex items-center gap-2 text-sm border border-white/10 disabled:opacity-50"
            >
              <FiFileText className="w-4 h-4" />
              View Latest Receipt
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} delay={idx * 0.1} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <motion.div variants={fadeInLeft}>
            <DonationHistory donations={donationHistory} onViewReceipt={handleViewReceipt} />
          </motion.div>

          <motion.div variants={fadeInUp}>
            <NearbyNGOMap />
          </motion.div>

          <motion.div variants={fadeInUp} className="dashboard-card">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              📊 Your Donation Breakdown
            </h3>

            {donationBreakdown.length === 0 ? (
              <div className="empty-state py-8">
                <p className="empty-state-title">No donations yet</p>
                <p className="empty-state-text text-sm">Your category-wise impact will appear after completed donations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {donationBreakdown.map((cat, idx) => (
                  <motion.div
                    key={`${cat.label}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="text-center p-4 rounded-xl bg-white/3 hover:bg-white/5 transition-colors"
                  >
                    <p className="text-white font-semibold text-sm mb-1">
                      ₹{cat.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mb-2">{cat.label}</p>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 1, delay: 0.8 + idx * 0.1 }}
                        className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{cat.percentage}%</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <motion.div variants={fadeInRight} className="space-y-6 min-w-0">
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiFileText className="w-5 h-5 text-primary-400" />
                Tax Receipts
              </h3>
              <span className="badge-success">
                80G Ready
              </span>
            </div>

            <div className="space-y-3">
              {recentReceipts.length === 0 && (
                <div className="empty-state py-6">
                  <p className="empty-state-title">No receipts available</p>
                  <p className="empty-state-text text-sm">Complete a donation to generate your first receipt.</p>
                </div>
              )}

              {recentReceipts.map((receipt, idx) => (
                <motion.div
                  key={receipt.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/3
                           hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => handleViewReceipt(receipt)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center
                                  justify-center shrink-0">
                      <FiFileText className="w-4 h-4 text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-white font-medium truncate">
                        {receipt.campaign}
                      </p>
                      <p className="text-[10px] text-primary-400 font-mono">
                        {receipt.receipt_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white font-semibold">
                      ₹{Number(receipt.amount || 0).toLocaleString()}
                    </span>
                    <FiDownload className="w-3.5 h-3.5 text-slate-500 opacity-0
                                        group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => {
                if (recentReceipts.length > 0) handleViewReceipt(recentReceipts[0]);
              }}
              disabled={recentReceipts.length === 0}
              className="w-full mt-4 py-2 text-sm text-primary-400 hover:bg-primary-500/5
                       rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              View All Receipts
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="dashboard-card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              📦 Pickup History
            </h3>

            {normalizedPickups.length === 0 && (
              <div className="empty-state py-6">
                <p className="empty-state-title">No pickups scheduled</p>
                <p className="empty-state-text text-sm">Item donations with pickup requests will appear here.</p>
              </div>
            )}

            <div className="space-y-3">
              {normalizedPickups.slice(0, 10).map((pickup) => (
                <div
                  key={pickup.id}
                  className="p-3 rounded-xl bg-white/3 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-primary-400 font-mono">
                      {pickup.pickup_id}
                    </span>
                    <span className={`badge ${
                      pickup.status === 'completed' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {pickup.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <FiCalendar className="w-3 h-3" />
                    {pickup.date} • {pickup.time_slot}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <FiMapPin className="w-3 h-3" />
                    {pickup.address}
                  </div>
                  {pickup.items.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pickup.items.map((item) => (
                        <span
                          key={item}
                          className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400
                                   text-[10px] capitalize"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                ❤️ Wishlist
              </h3>
              <Link to="/dashboard/donor/wishlist" className="text-xs text-primary-400 hover:text-primary-300">
                View All
              </Link>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="empty-state py-6">
                <p className="empty-state-title">No campaigns saved</p>
                <p className="empty-state-text text-sm">Tap the heart icon on any campaign to save it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistItems.slice(0, 4).map((item) => (
                  <div
                    key={item.campaign_id}
                    className="p-3 rounded-xl bg-white/3 border border-white/5 flex items-center gap-3"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white font-medium line-clamp-1">{item.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{item.ngo_name}</p>
                    </div>
                    <button
                      onClick={() => removeFromWishlist(item.campaign_id)}
                      className="text-xs px-2 py-1 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <motion.div variants={fadeInUp}>
            <CampaignRecommendations maxItems={4} showHeader={true} />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );

  // My Donations Section
  const MyDonationsSection = () => (
    <motion.div variants={fadeInUp} className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-white">💙 My Donations</h2>
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Donations</h3>
          <span className="text-sm text-slate-400">{donationHistory.length} total</span>
        </div>
        <DonationHistory donations={donationHistory} onViewReceipt={handleViewReceipt} />
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/campaigns" className="btn-accent py-2.5 px-5 text-sm">
            Donate to Campaign
          </Link>
          <Link to="/donate" className="btn-secondary py-2.5 px-5 text-sm">
            Donate Physical Items
          </Link>
        </div>
      </div>
    </motion.div>
  );

  // Donation History Section
  const DonationHistorySection = () => (
    <motion.div variants={fadeInUp} className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-white">📜 Donation History</h2>
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">All Past Donations</h3>
          <span className="text-sm text-slate-400">{donationHistory.length} total</span>
        </div>
        <DonationHistory donations={donationHistory} onViewReceipt={handleViewReceipt} />
      </div>
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">📦 Pickup History</h3>
          <span className="text-sm text-slate-400">{normalizedPickups.length} total</span>
        </div>

        {normalizedPickups.length === 0 && (
          <div className="empty-state py-6">
            <p className="empty-state-title">No pickups scheduled</p>
            <p className="empty-state-text text-sm">Item donations with pickup requests will appear here.</p>
          </div>
        )}

        <div className="space-y-3">
          {normalizedPickups.slice(0, 20).map((pickup) => (
            <div
              key={pickup.id}
              className="p-3 rounded-xl bg-white/3 border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-primary-400 font-mono">
                  {pickup.pickup_id}
                </span>
                <span className={`badge ${
                  pickup.status === 'completed' ? 'badge-success' : 'badge-warning'
                }`}>
                  {pickup.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <FiCalendar className="w-3 h-3" />
                {pickup.date} • {pickup.time_slot}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <FiMapPin className="w-3 h-3" />
                {pickup.address}
              </div>
              {pickup.volunteer_name ? (
                <div className="text-xs text-slate-300 mb-2">
                  Volunteer: <span className="text-slate-200">{pickup.volunteer_name}</span>
                </div>
              ) : null}
              {pickup.items.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {pickup.items.map((item) => (
                    <span
                      key={item}
                      className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400
                               text-[10px] capitalize"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {pickup.status === 'completed' ? (
                <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                  <p className="text-xs font-semibold text-slate-200">Rate volunteer</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={Number(ratingDraftByPickup[pickup.pickup_id]?.stars || 5)}
                      onChange={(event) => updateRatingDraft(pickup.pickup_id, { stars: Number(event.target.value) })}
                      disabled={Boolean(ratingDraftByPickup[pickup.pickup_id]?.submitted)}
                      className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100"
                    >
                      {[5, 4, 3, 2, 1].map((star) => (
                        <option key={star} value={star}>{star} Star{star > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Optional feedback"
                      value={String(ratingDraftByPickup[pickup.pickup_id]?.feedback || '')}
                      onChange={(event) => updateRatingDraft(pickup.pickup_id, { feedback: event.target.value })}
                      disabled={Boolean(ratingDraftByPickup[pickup.pickup_id]?.submitted)}
                      className="min-w-[180px] flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => submitPickupRating(pickup.pickup_id)}
                      disabled={Boolean(ratingDraftByPickup[pickup.pickup_id]?.submitted) || ratingSubmittingPickupId === pickup.pickup_id}
                      className="px-2.5 py-1 rounded-md text-xs bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-60"
                    >
                      {ratingDraftByPickup[pickup.pickup_id]?.submitted
                        ? 'Rated'
                        : ratingSubmittingPickupId === pickup.pickup_id
                          ? 'Submitting...'
                          : 'Submit'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // Campaigns Section
  const CampaignsSection = () => (
    <motion.div variants={fadeInUp} className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-white">🎯 Browse Campaigns</h2>
      <CampaignRecommendations maxItems={8} showHeader={true} />
    </motion.div>
  );

  // Notifications Section
  const NotificationsSection = () => (
    <motion.div variants={fadeInUp} className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-white">🔔 Notifications</h2>
      <div className="dashboard-card">
        <p className="text-slate-400">Updates on pickups and successful donations will appear here.</p>
        <div className="mt-6 space-y-3">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-sm font-semibold text-green-400 mb-1">✓ Donation Completed</p>
            <p className="text-xs text-green-300">Your donation has been processed successfully.</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm font-semibold text-blue-400 mb-1">📦 Pickup Scheduled</p>
            <p className="text-xs text-blue-300">Pickup is scheduled for this week.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Profile Section
  const ProfileSection = () => (
    <motion.div variants={fadeInUp} className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-white">👤 Profile</h2>
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-white mb-4">Account Details</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-sm font-medium text-white mb-2">Edit Profile</p>
            <p className="text-xs text-slate-400 mb-3">Update your personal information</p>
            <Link to="/profile">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary text-sm"
              >
                Edit Profile
              </motion.button>
            </Link>
          </div>
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-sm font-medium text-white mb-2">Delete Account</p>
            <p className="text-xs text-slate-400 mb-3">Permanently remove your account and data</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-ghost border border-red-500/30 text-red-300 text-sm"
            >
              Delete Account
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Render section based on current selection
  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <DashboardOverviewSection />;
      case 'donations':
        return <MyDonationsSection />;
      case 'history':
        return <DonationHistorySection />;
      case 'campaigns':
        return <CampaignsSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'profile':
        return <ProfileSection />;
      default:
        return <DashboardOverviewSection />;
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ---- Dashboard Header ---- */}
      <motion.div variants={fadeInUp}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-white">
              Donor Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              Dashboard, donations, campaigns, history, notifications, and profile
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              window.location.reload();
              toast.success('Dashboard refreshed');
            }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-colors text-sm"
          >
            <FiRefreshCw className="inline-block mr-1 -mt-0.5" /> Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Main Grid with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
        {/* Sidebar Menu */}
        <motion.aside variants={fadeInUp} className="dashboard-card lg:sticky lg:top-28 self-start">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Donor Menu</p>
            <p className="text-sm text-slate-400 mt-1">Use the left menu to manage your donor account.</p>
          </div>
          <div className="space-y-2">
            {donorSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  onClick={() => {
                    setCurrentSection(section.key);
                    navigate(section.path);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors border ${
                    currentSection === section.key
                      ? 'bg-primary-500/12 border-primary-500/20 text-primary-300'
                      : 'bg-white/3 border-white/5 text-slate-300 hover:bg-white/6'
                  }`}
                >
                  <span className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <span className="text-sm font-medium text-left">{section.label}</span>
                </button>
              );
            })}
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <motion.div variants={fadeInUp} className="min-w-0 w-full">
          {renderSection()}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DonorDashboard;
