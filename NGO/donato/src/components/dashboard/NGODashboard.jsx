import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiHome, FiTarget, FiPlus, FiDollarSign, FiUsers, FiPackage,
  FiAlertTriangle, FiBarChart2, FiBell, FiSettings, FiRefreshCw,
  FiChevronRight, FiCheck, FiClock, FiTrendingUp, FiPieChart,
  FiDownload, FiSearch, FiFilter, FiEdit2, FiCheckCircle,
  FiXCircle, FiChevronDown, FiMenu, FiX
} from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { staggerContainer, fadeInUp, fadeInLeft, fadeInRight } from '../../animations/variants';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import StatCard from './widgets/StatCard';

const NGODashboard = () => {
  const [ngoStats, setNgoStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    campaign_id: '',
    message: '',
    impact_count: '',
    impact_label: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsResult, campaignsResult] = await Promise.all([
        api.getNGOStats(),
        api.getNGOCampaigns(),
      ]);
      if (statsResult?.success && statsResult.data) setNgoStats(statsResult.data);
      if (Array.isArray(campaignsResult?.data)) setCampaigns(campaignsResult.data);
      else if (Array.isArray(campaignsResult)) setCampaigns(campaignsResult);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!updateForm.campaign_id && campaigns.length > 0) {
      setUpdateForm((prev) => ({
        ...prev,
        campaign_id: String(campaigns[0].campaign_id || ''),
      }));
    }
  }, [campaigns, updateForm.campaign_id]);

  const updateComposerField = (field, value) => {
    setUpdateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePostCampaignUpdate = async () => {
    const campaignId = Number(updateForm.campaign_id);
    const message = String(updateForm.message || '').trim();

    if (!campaignId) {
      toast.error('Select a campaign first');
      return;
    }
    if (!message) {
      toast.error('Please write an update message');
      return;
    }

    setPostingUpdate(true);
    try {
      await api.createCampaignUpdate(campaignId, {
        message,
        impact_count: Number(updateForm.impact_count) || 0,
        impact_label: String(updateForm.impact_label || '').trim(),
      });
      toast.success('Campaign update posted successfully');
      setUpdateForm((prev) => ({
        ...prev,
        message: '',
        impact_count: '',
        impact_label: '',
      }));
    } catch (_error) {
      toast.error('Failed to post campaign update');
    } finally {
      setPostingUpdate(false);
    }
  };

  const stats = [
    {
      icon: FiTarget,
      title: 'Campaigns Active',
      value: ngoStats?.active_campaigns ?? 0,
      color: 'from-primary-500 to-blue-500',
    },
    {
      icon: FiDollarSign,
      title: 'Total Funds Raised',
      value: ngoStats?.total_raised ?? 0,
      color: 'from-green-500 to-emerald-500',
      format: 'currency',
    },
    {
      icon: FiUsers,
      title: 'Total Donors',
      value: ngoStats?.total_donors ?? 0,
      color: 'from-accent-orange to-red-500',
    },
    {
      icon: FiTrendingUp,
      title: 'Total Campaigns',
      value: ngoStats?.total_campaigns ?? campaigns.length,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  const totalRaisedFromCampaigns = campaigns.reduce(
    (sum, c) => sum + Number(c.collected_amount || 0),
    0
  );
  const activeCampaignCount = campaigns.filter((c) => c.campaign_status === 'active').length;
  const estimatedPeopleHelped = Number(
    ngoStats?.people_helped
      ?? ngoStats?.total_people_helped
      ?? Math.max(Math.round((ngoStats?.total_donors ?? 0) * 3), activeCampaignCount * 60)
  );
  const estimatedItemsDistributed = Number(
    ngoStats?.items_distributed
      ?? ngoStats?.total_items_distributed
      ?? campaigns.reduce((sum, c) => {
        const donors = Number(c.donors_count || 0);
        const multiplier = c.donation_type === 'money' ? 1 : 2;
        return sum + donors * multiplier;
      }, 0)
  );

  const transparencyStats = [
    {
      icon: FiDollarSign,
      title: 'Total Donations',
      value: Number(ngoStats?.total_raised ?? totalRaisedFromCampaigns),
      color: 'from-green-500 to-emerald-500',
      format: 'currency',
    },
    {
      icon: FiTarget,
      title: 'Active Campaigns',
      value: Number(ngoStats?.active_campaigns ?? activeCampaignCount),
      color: 'from-primary-500 to-blue-500',
      format: 'number',
    },
    {
      icon: FiUsers,
      title: 'People Helped',
      value: estimatedPeopleHelped,
      color: 'from-accent-orange to-red-500',
      format: 'number',
    },
    {
      icon: FiPackage,
      title: 'Items Distributed',
      value: estimatedItemsDistributed,
      color: 'from-purple-500 to-pink-500',
      format: 'number',
    },
  ];

  const selectedCampaignTitle = campaigns.find(
    (c) => String(c.campaign_id) === String(updateForm.campaign_id)
  )?.title;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-white">
            NGO Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            {ngoStats?.ngo_name
              ? `${ngoStats.ngo_name} • Manage campaigns and track donations`
              : 'Manage campaigns and track donations'}
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border 
                     border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} delay={idx * 0.1} />
        ))}
      </div>

      <motion.div variants={fadeInUp} className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">NGO Transparency Dashboard</h3>
            <p className="text-xs text-slate-500">Live public impact and accountability metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {transparencyStats.map((stat, idx) => (
            <StatCard key={`transparency-${idx}`} {...stat} delay={idx * 0.08} />
          ))}
        </div>
      </motion.div>

      {/* Campaign Progress List */}
      {campaigns.length > 0 && (
        <motion.div variants={fadeInUp} className="dashboard-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">My Campaigns</h3>
            <span className="text-sm text-slate-400">{campaigns.length} total</span>
          </div>
          <div className="space-y-4">
            {campaigns.slice(0, 5).map((c, idx) => {
              const pct = c.target_amount > 0
                ? Math.min((c.collected_amount / c.target_amount) * 100, 100)
                : 0;
              return (
                <div key={c.campaign_id ?? idx} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{c.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">
                        {c.donation_type} • {c.city || 'India'}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium
                      ${c.campaign_status === 'active'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-slate-500/10 text-slate-400'}`}>
                      {c.campaign_status}
                    </span>
                  </div>
                  <ProgressBar value={c.collected_amount} max={c.target_amount} height="h-2" />
                  <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>₹{Number(c.collected_amount).toLocaleString()} raised</span>
                    <span>{pct.toFixed(1)}% of ₹{Number(c.target_amount).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {campaigns.length > 0 && (
        <motion.div variants={fadeInUp} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Post Campaign Update</h3>
            <span className="text-xs text-slate-500">Visible on campaign update feed</span>
          </div>

          <div className="space-y-3">
            <select
              value={updateForm.campaign_id}
              onChange={(e) => updateComposerField('campaign_id', e.target.value)}
              className="input-field"
            >
              {campaigns.map((c) => (
                <option key={c.campaign_id} value={String(c.campaign_id)}>
                  {c.title}
                </option>
              ))}
            </select>

            <textarea
              value={updateForm.message}
              onChange={(e) => updateComposerField('message', e.target.value)}
              placeholder="Update: Food distributed to 200 families."
              rows={4}
              className="input-field resize-none"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="number"
                value={updateForm.impact_count}
                onChange={(e) => updateComposerField('impact_count', e.target.value)}
                placeholder="Impact count (optional)"
                className="input-field"
              />
              <input
                type="text"
                value={updateForm.impact_label}
                onChange={(e) => updateComposerField('impact_label', e.target.value)}
                placeholder="Impact label e.g. families reached"
                className="input-field"
              />
            </div>

            <button
              onClick={handlePostCampaignUpdate}
              disabled={postingUpdate}
              className="btn-primary px-5 py-2.5 inline-flex items-center gap-2 disabled:opacity-60"
            >
              <FiSend className="w-4 h-4" />
              {postingUpdate ? 'Posting...' : 'Post Update'}
            </button>
          </div>
        </motion.div>
      )}

      {campaigns.length > 0 && updateForm.campaign_id && (
        <motion.div variants={fadeInUp} className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Manage Campaign Updates</h3>
              <p className="text-xs text-slate-500">
                {selectedCampaignTitle ? `Editing updates for: ${selectedCampaignTitle}` : 'Select a campaign above'}
              </p>
            </div>
          </div>

          <CampaignUpdatesFeed
            campaignId={Number(updateForm.campaign_id)}
            manageMode
          />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CampaignTable />
        <DonationChart />
      </div>

      <SubmitCampaignRequest />
    </motion.div>
  );
};

export default NGODashboard;
