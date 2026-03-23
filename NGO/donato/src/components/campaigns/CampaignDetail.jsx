// src/components/campaigns/CampaignDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart, FiShare2, FiUsers, FiTarget,
  FiClock, FiChevronLeft, FiExternalLink,
  FiCheckCircle, FiTrendingUp
} from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { getDonationImpact } from '../../utils/donationImpact';
import {
  getPlatformShareUrl,
  prepareInstagramShare,
  shareCampaignNatively,
} from '../../utils/share';
import ProgressBar from '../common/ProgressBar';
import CampaignLocationMap from '../map/CampaignLocationMap';
import CampaignUpdatesFeed from './CampaignUpdatesFeed';
import VolunteerLeaderboardCard from './VolunteerLeaderboardCard';
import { useWishlist } from '../../hooks/useWishlist';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { fadeInUp, staggerContainer } from '../../animations/variants';

const CampaignDetail = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [volunteerApplying, setVolunteerApplying] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [statsRef] = useScrollAnimation(0.3);
  const campaignNotFoundShownRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCampaign = async () => {
      setLoading(true);
      try {
        const [campaignResult, campaignsResult] = await Promise.all([
          api.getCampaignById(campaignId),
          api.getCampaigns(),
        ]);

        if (isMounted && Array.isArray(campaignsResult?.data)) {
          setAllCampaigns(campaignsResult.data);
        }

        if (isMounted && campaignResult.success && campaignResult.data) {
          setCampaign(campaignResult.data);
        } else {
          if (!campaignNotFoundShownRef.current) {
            toast.error('Campaign not found');
            campaignNotFoundShownRef.current = true;
          }
          navigate('/campaigns');
        }
      } catch (error) {
        toast.error('Failed to load campaign');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCampaign();

    return () => {
      isMounted = false;
    };
  }, [campaignId, navigate]);

  const handleShare = async () => {
    const result = await shareCampaignNatively(campaign);
    if (result.mode === 'clipboard') {
      toast.success('Campaign link copied to clipboard!');
    } else if (result.mode === 'unsupported') {
      toast.error('Sharing is not supported on this device.');
    }
  };

  const handleSocialShare = async (platform) => {
    try {
      if (platform === 'instagram') {
        const { url } = await prepareInstagramShare(campaign);
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.success('Caption copied. Paste it into your Instagram post or story.');
        return;
      }

      const shareUrl = getPlatformShareUrl(platform, campaign);
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      toast.success(`Opening ${platform.charAt(0).toUpperCase() + platform.slice(1)} share…`);
    } catch (_error) {
      toast.error('Unable to open share link right now.');
    }
  };

  const handleLike = () => {
    const { added } = toggleWishlist(campaign);
    toast.success(added ? 'Added to wishlist ❤️' : 'Removed from wishlist');
  };

  const handleVolunteerApply = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in before applying as a volunteer.');
      navigate('/login', { state: { from: { pathname: `/campaigns/${campaignId}` } } });
      return;
    }

    const userId = Number(user?.user_id ?? user?.id ?? 0);
    if (!userId) {
      toast.error('Unable to identify your account. Please sign in again.');
      return;
    }

    setVolunteerApplying(true);
    try {
      const result = await api.registerVolunteer({
        userId,
        ngoId: campaign?.ngo_id || null,
        preferredCity: campaign?.city || user?.city || '',
        skills: 'pickup, distribution',
        availability: 'weekends',
        motivation: `I want to support campaign: ${campaign?.title || 'KindWave campaign'}`,
      });

      if (!result?.success) {
        toast.error(result?.error || 'Unable to submit volunteer application right now.');
        return;
      }
      toast.success('Volunteer application submitted successfully!');
    } catch (error) {
      toast.error(error?.message || 'Unable to submit volunteer application right now.');
    } finally {
      setVolunteerApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/5 rounded-xl w-32" />
            <div className="h-80 bg-white/5 rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-10 bg-white/5 rounded-xl w-3/4" />
                <div className="h-4 bg-white/5 rounded-full w-full" />
                <div className="h-4 bg-white/5 rounded-full w-5/6" />
                <div className="h-4 bg-white/5 rounded-full w-4/6" />
              </div>
              <div className="h-60 bg-white/5 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  const estimatedImpact = getDonationImpact({
    amount: 500,
    donationType: campaign.donation_type,
    campaign,
  });

  const percentage = ((campaign.collected_amount / campaign.target_amount) * 100).toFixed(1);
  const isLiked = isWishlisted(campaign.campaign_id);
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24))
  );

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'updates', label: 'Updates' },
    { id: 'donors', label: 'Donors' },
    { id: 'gallery', label: 'Gallery' },
  ];

  const socialPlatforms = [
    {
      id: 'facebook',
      label: 'Facebook',
      icon: FaFacebookF,
      className: 'text-[#1877F2] border-[#1877F2]/20 hover:bg-[#1877F2]/10',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: FaWhatsapp,
      className: 'text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/10',
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: FaXTwitter,
      className: 'text-white border-white/15 hover:bg-white/10',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      icon: FaInstagram,
      className: 'text-[#E1306C] border-[#E1306C]/20 hover:bg-[#E1306C]/10',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-16 min-h-screen"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors 
                   mb-6 group"
        >
          <FiChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Campaigns</span>
        </motion.button>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-8"
        >
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://picsum.photos/seed/kindwave-fallback/1200/800';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/30 to-transparent" />

          {/* Overlay Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center 
                       transition-colors ${
                         isLiked
                           ? 'bg-red-500/30 text-red-400 border border-red-500/50'
                           : 'bg-white/10 text-white border border-white/20'
                       }`}
            >
              <FiHeart className={`w-5 h-5 ${isLiked ? 'fill-red-400' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border 
                       border-white/20 flex items-center justify-center text-white"
            >
              <FiShare2 className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Status Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 
                         text-green-400 text-xs font-medium backdrop-blur-sm">
              ● {campaign.campaign_status === 'active' ? 'Active' : 'Inactive'}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 
                         text-white text-xs font-medium backdrop-blur-sm capitalize">
              {campaign.donation_type}
            </span>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500/30 backdrop-blur-sm flex 
                           items-center justify-center">
                <span className="text-sm">🏢</span>
              </div>
              <span className="text-sm text-white/80 font-medium">{campaign.ngo_name}</span>
              <FiCheckCircle className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2"
          >
            {/* Title & Description */}
            <motion.div variants={fadeInUp}>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                {campaign.title}
              </h1>
              <p className="text-slate-400 leading-relaxed mb-6">
                {campaign.description}
              </p>
            </motion.div>

            {/* Mini Stats */}
            <motion.div
              ref={statsRef}
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {[
                { icon: FiTarget, label: 'Goal', value: `₹${(campaign.target_amount / 1000).toFixed(0)}K` },
                { icon: FiUsers, label: 'Donors', value: campaign.donors_count },
                { icon: FiClock, label: 'Days Left', value: daysLeft },
                { icon: FiTrendingUp, label: 'Funded', value: `${percentage}%` },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="glass-card p-4 text-center"
                >
                  <stat.icon className="w-5 h-5 text-primary-400 mx-auto mb-2" />
                  <p className="text-white font-bold text-lg">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Tabs */}
            <motion.div variants={fadeInUp}>
              <div className="flex border-b border-white/10 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'about' && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="glass-card p-6">
                      <h3 className="text-white font-semibold mb-3">About This Campaign</h3>
                      <p className="text-slate-400 leading-relaxed text-sm">
                        {campaign.description}
                        {' '}This campaign aims to create lasting change by providing essential
                        support to communities in need. Every donation, no matter how small,
                        contributes to our mission and helps us reach our goals.
                      </p>
                      <p className="text-slate-400 leading-relaxed text-sm mt-3">
                        All donations are transparently tracked and verified. Regular updates
                        are provided to donors about how their contributions are being utilized.
                        Tax receipts are automatically generated for all eligible donations.
                      </p>
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="text-white font-semibold mb-3">Campaign Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Start Date', value: new Date(campaign.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                          { label: 'End Date', value: new Date(campaign.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                          { label: 'Donation Type', value: campaign.donation_type },
                          { label: 'NGO', value: campaign.ngo_name },
                        ].map((detail, idx) => (
                          <div key={idx}>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                              {detail.label}
                            </p>
                            <p className="text-sm text-white font-medium capitalize">
                              {detail.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <CampaignLocationMap campaign={campaign} height="340px" />
                  </motion.div>
                )}

                {activeTab === 'updates' && (
                  <motion.div
                    key="updates"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <CampaignUpdatesFeed campaignId={campaign.campaign_id} />
                  </motion.div>
                )}

                {activeTab === 'donors' && (
                  <motion.div
                    key="donors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="glass-card p-8 text-center">
                      <span className="text-4xl block mb-3">🤝</span>
                      <h4 className="text-white font-semibold mb-2">No public donor feed available</h4>
                      <p className="text-slate-400 text-sm">
                        This campaign currently shows the verified donor count only: {campaign.donors_count} donors.
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'gallery' && (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {[campaign.image].filter(Boolean).map((img, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.03 }}
                        className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                      >
                        <img
                          src={img}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-110 
                                   transition-transform duration-500"
                        />
                      </motion.div>
                    ))}
                    {!campaign.image && (
                      <div className="glass-card p-8 text-center col-span-full">
                        <span className="text-4xl block mb-3">🖼️</span>
                        <h4 className="text-white font-semibold mb-2">No gallery available</h4>
                        <p className="text-slate-400 text-sm">
                          Campaign media will appear here when uploaded by the NGO.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Sidebar - Donation Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 space-y-4">
              {/* Donation Progress Card */}
              <div className="glass-card p-6">
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-heading font-bold text-white">
                      ₹{(campaign.collected_amount / 1000).toFixed(0)}K
                    </span>
                    <span className="text-sm text-slate-400">
                      of ₹{(campaign.target_amount / 1000).toFixed(0)}K goal
                    </span>
                  </div>
                  <ProgressBar
                    value={campaign.collected_amount}
                    max={campaign.target_amount}
                    height="h-3"
                  />
                  <p className="text-sm text-primary-400 font-medium mt-2">
                    {percentage}% funded
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="text-center p-3 rounded-xl bg-white/3">
                    <p className="text-white font-bold">{campaign.donors_count}</p>
                    <p className="text-xs text-slate-500">Donors</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/3">
                    <p className="text-white font-bold">{daysLeft}</p>
                    <p className="text-xs text-slate-500">Days Left</p>
                  </div>
                </div>

                <Link to={`/donate/${campaign.campaign_id}`}>
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
                  >
                    <FiHeart className="w-5 h-5" />
                    Donate Now
                  </motion.button>
                </Link>

                <div className="mt-4 p-4 rounded-2xl bg-primary-500/5 border border-primary-500/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-primary-400 font-semibold mb-2">
                    Donation Impact Tracking
                  </p>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center text-lg shrink-0">
                      {estimatedImpact.icon}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium leading-relaxed">
                        {estimatedImpact.shortHeadline}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        {estimatedImpact.detail}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleShare}
                  className="w-full mt-3 py-3 border border-white/10 rounded-xl text-slate-300 
                           hover:bg-white/5 transition-colors flex items-center justify-center 
                           gap-2 text-sm"
                >
                  <FiShare2 className="w-4 h-4" />
                  Share Campaign
                </button>

                <button
                  onClick={handleVolunteerApply}
                  disabled={volunteerApplying}
                  className="w-full mt-3 py-3 border border-primary-500/30 rounded-xl text-primary-300
                           hover:bg-primary-500/10 transition-colors flex items-center justify-center
                           gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {volunteerApplying ? 'Submitting application...' : 'Apply as Volunteer'}
                </button>

                <Link
                  to="/dashboard/donor/wishlist"
                  className="w-full mt-3 py-3 border border-white/10 rounded-xl text-slate-300
                           hover:bg-white/5 transition-colors flex items-center justify-center
                           gap-2 text-sm"
                >
                  View Wishlist
                </Link>

                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-3">
                    Share this campaign
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {socialPlatforms.map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <button
                          key={platform.id}
                          onClick={() => handleSocialShare(platform.id)}
                          className={`py-2.5 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${platform.className}`}
                        >
                          <Icon className="w-4 h-4" />
                          {platform.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* NGO Info */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center 
                                justify-center">
                    <span className="text-lg">🏢</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{campaign.ngo_name}</p>
                    <div className="flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">Verified</span>
                    </div>
                  </div>
                </div>
                <button className="text-sm text-primary-400 hover:text-primary-300 
                               transition-colors flex items-center gap-1">
                  View NGO Profile <FiExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <VolunteerLeaderboardCard campaignId={campaign.campaign_id} limit={5} />

              {/* Similar Campaigns */}
              <div className="glass-card p-5">
                <h4 className="text-white font-semibold text-sm mb-4">Similar Campaigns</h4>
                <div className="space-y-3">
                  {allCampaigns.filter(c => c.campaign_id !== campaign.campaign_id)
                    .slice(0, 3)
                    .map((c) => (
                      <Link
                        key={c.campaign_id}
                        to={`/campaigns/${c.campaign_id}`}
                        className="flex gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                        <img
                          src={c.image}
                          alt={c.title}
                          className="w-16 h-12 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-white font-medium line-clamp-1 
                                     group-hover:text-primary-400 transition-colors">
                            {c.title}
                          </p>
                          <p className="text-xs text-accent-orange font-medium">
                            ₹{(c.collected_amount / 1000).toFixed(0)}K raised
                          </p>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CampaignDetail;
