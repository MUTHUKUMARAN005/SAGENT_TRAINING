import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiBell,
  FiBriefcase,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiGift,
  FiGlobe,
  FiHome,
  FiMapPin,
  FiMoreHorizontal,
  FiPlus,
  FiTrash2,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Dashboard (NGO Overview)', icon: FiHome },
  { id: 'campaigns', label: 'Campaigns', icon: FiBriefcase },
  { id: 'donations', label: 'Donations', icon: FiGift },
  { id: 'pickups', label: 'Pickup Requests', icon: FiMapPin },
  { id: 'volunteers', label: 'Volunteers', icon: FiUsers },
  { id: 'donor_users', label: 'Users (Donors)', icon: FiUserPlus },
  { id: 'urgent_needs', label: 'Urgent Needs', icon: FiAlertTriangle },
  { id: 'reports', label: 'Reports & Analytics', icon: FiFileText },
  { id: 'notifications', label: 'Notifications', icon: FiBell },
];

const AVATAR_TONES = [
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
];

const numberOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numberOr(value, 0));

const formatNumber = (value) => numberOr(value, 0).toLocaleString('en-US');

const formatMonthYear = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const toDateTimeLocalInput = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const percentOf = (part, total) => {
  const safeTotal = numberOr(total, 0);
  if (safeTotal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((numberOr(part, 0) / safeTotal) * 100)));
};

const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildMonthlyOverview = (donations = []) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const validDonationDates = donations
    .map((item) => {
      const rawDate = item?.date || item?.donation_date || item?.created_at || item?.createdAt;
      const parsed = rawDate ? new Date(rawDate) : null;
      return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    })
    .filter(Boolean);

  const latestDonationDate = validDonationDates.length
    ? new Date(Math.max(...validDonationDates.map((date) => date.getTime())))
    : null;

  const baseDate = latestDonationDate || new Date();

  const months = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - (5 - index), 1);
    return {
      key: getMonthKey(date),
      month: monthNames[date.getMonth()],
      donations: 0,
      trend: 0,
    };
  });

  donations.forEach((donation) => {
    const status = String(donation?.status || donation?.donation_status || '').trim().toLowerCase();
    const paymentStatus = String(donation?.payment_status || '').trim().toLowerCase();
    if (status && status !== 'completed' && paymentStatus !== 'confirmed' && paymentStatus !== 'completed') {
      return;
    }

    const rawDate = donation?.date || donation?.donation_date || donation?.created_at || donation?.createdAt;
    const date = rawDate ? new Date(rawDate) : null;
    if (!date || Number.isNaN(date.getTime())) return;

    const key = getMonthKey(date);
    const targetMonth = months.find((row) => row.key === key);
    if (!targetMonth) return;

    targetMonth.donations += numberOr(donation?.amount, 0);
  });

  const hasValues = months.some((row) => row.donations > 0);
  if (!hasValues) {
    return months.map((row) => ({
      month: row.month,
      donations: 0,
      trend: 0,
    }));
  }

  let runningTotal = 0;
  return months.map((row) => {
    runningTotal += numberOr(row.donations, 0);
    return {
      month: row.month,
      donations: numberOr(row.donations, 0),
      trend: runningTotal,
    };
  });
};

const progressLabelClass = (status = '') => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'active' || normalized === 'in_progress') {
    return 'bg-green-100 text-green-700';
  }
  if (normalized === 'ongoing' || normalized === 'pending') {
    return 'bg-amber-100 text-amber-700';
  }
  return 'bg-slate-100 text-slate-600';
};

const formatStatus = (status = '') => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'active' || normalized === 'in_progress') return 'In Progress';
  if (normalized === 'ongoing' || normalized === 'pending') return 'Ongoing';
  return 'Planned';
};

const formatDonationTypeLabel = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'Money';
  if (normalized === 'food') return 'Food';
  if (normalized === 'money') return 'Money';
  if (normalized === 'clothes' || normalized === 'books' || normalized === 'medicine') return 'Goods';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatPaymentStatusLabel = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'Pending';
  if (normalized === 'confirmed' || normalized === 'success' || normalized === 'completed') return 'Confirmed';
  if (normalized === 'pending' || normalized === 'processing') return 'Pending';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const paymentStatusClass = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'confirmed' || normalized === 'success' || normalized === 'completed') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  return 'bg-amber-100 text-amber-700 border-amber-200';
};

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'NA';
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
};

const ProgressRing = ({ value = 0, color = '#16a34a', label = '' }) => {
  const pct = Math.max(0, Math.min(100, numberOr(value, 0)));
  const size = 86;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[86px] w-[86px]">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#dbe2ea"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <p className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-slate-700">
          {pct}%
        </p>
      </div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
};

const MiniAvatar = ({ name, index = 0 }) => (
  <span
    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
      AVATAR_TONES[index % AVATAR_TONES.length]
    }`}
  >
    {getInitials(name)}
  </span>
);

const NGO_NOTIFICATION_TEMPLATES = [
  {
    key: 'general_update',
    label: 'General Update',
    audience: 'DONORS',
    notificationType: 'GENERAL',
    title: 'Important update from our NGO',
    message: 'Thank you for your support. We have an important update to share with you.',
  },
  {
    key: 'campaign_progress',
    label: 'Campaign Update',
    audience: 'DONORS',
    notificationType: 'CAMPAIGN_UPDATE',
    title: 'Campaign progress update',
    message: 'Our campaign has reached a new milestone. Your support is creating real impact.',
  },
  {
    key: 'pickup_alert',
    label: 'Pickup Alert',
    audience: 'VOLUNTEERS',
    notificationType: 'PICKUP_ALERT',
    title: 'Pickup alert for volunteers',
    message: 'A pickup requires attention. Please check your assigned tasks for latest details.',
  },
];

const NGO_MENU_PATH_BY_ID = {
  overview: '/dashboard/ngo',
  campaigns: '/dashboard/ngo/campaigns',
  donations: '/dashboard/ngo/donations',
  pickups: '/dashboard/ngo/pickups',
  volunteers: '/dashboard/ngo/volunteers',
  donor_users: '/dashboard/ngo/users',
  urgent_needs: '/dashboard/ngo/urgent-needs',
  reports: '/dashboard/ngo/reports',
  notifications: '/dashboard/ngo/notifications',
};

const resolveNgoMenuFromPath = (pathname = '') => {
  if (pathname.startsWith('/dashboard/ngo/campaigns')) return 'campaigns';
  if (pathname.startsWith('/dashboard/ngo/donations')) return 'donations';
  if (pathname.startsWith('/dashboard/ngo/pickups')) return 'pickups';
  if (pathname.startsWith('/dashboard/ngo/volunteers')) return 'volunteers';
  if (pathname.startsWith('/dashboard/ngo/users')) return 'donor_users';
  if (pathname.startsWith('/dashboard/ngo/urgent-needs')) return 'urgent_needs';
  if (pathname.startsWith('/dashboard/ngo/reports')) return 'reports';
  if (pathname.startsWith('/dashboard/ngo/notifications')) return 'notifications';
  return 'overview';
};

const NGOAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ngoStats, setNgoStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [ngoDonations, setNgoDonations] = useState([]);
  const [ngoPickups, setNgoPickups] = useState([]);
  const [ngoVolunteers, setNgoVolunteers] = useState([]);
  const [urgentNeeds, setUrgentNeeds] = useState([]);
  const [volunteerStats, setVolunteerStats] = useState(null);
  const [volunteerSchedule, setVolunteerSchedule] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [selectedVolunteerTasks, setSelectedVolunteerTasks] = useState([]);
  const [newVolunteerUserId, setNewVolunteerUserId] = useState('');
  const [volunteerAssignForm, setVolunteerAssignForm] = useState({
    pickupId: '',
    volunteerId: '',
    description: '',
  });
  const [volunteerBusy, setVolunteerBusy] = useState(false);
  const [activeMenu, setActiveMenu] = useState(SIDEBAR_ITEMS[0].id);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [campaignSubmitting, setCampaignSubmitting] = useState(false);
  const [pickupBusyById, setPickupBusyById] = useState({});
  const [pickupVolunteerDrafts, setPickupVolunteerDrafts] = useState({});
  const [pickupStatusDrafts, setPickupStatusDrafts] = useState({});
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    donationType: 'MONEY',
    endDate: '',
    city: '',
    state: '',
  });
  const [urgentForm, setUrgentForm] = useState({
    title: '',
    message: '',
    startTime: '',
    endTime: '',
  });
  const [editingUrgentId, setEditingUrgentId] = useState(null);
  const [urgentSubmitting, setUrgentSubmitting] = useState(false);
  const [notificationSubmitting, setNotificationSubmitting] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    audience: 'DONORS',
    notificationType: 'GENERAL',
    templateKey: 'general_update',
    campaignId: '',
    pickupId: '',
    sendEmail: true,
    recipientUserIds: [],
    recipientEmails: [],
  });
  const [lastDeliveryReport, setLastDeliveryReport] = useState(null);

  const fetchData = async () => {
    const unwrapArray = (value) => {
      if (Array.isArray(value)) return value;
      if (Array.isArray(value?.data)) return value.data;
      return null;
    };

    const results = await Promise.allSettled([
      api.getNGOStats(),
      api.getNGOCampaigns(),
      api.getNGODonations({ page: 0, size: 60 }),
      api.getNGOPickups(),
      api.getNGOVolunteers(),
      api.getNGOVolunteerStats(),
      api.getNGOVolunteerSchedule(),
      api.getMyUrgentNeeds(),
      api.getNotifications(),
    ]);

    const [
      statsResult,
      campaignsResult,
      donationsResult,
      pickupsResult,
      volunteersResult,
      volunteerStatsResult,
      volunteerScheduleResult,
      urgentNeedsResult,
      notificationResult,
    ] = results;

    let fulfilledCount = 0;

    if (statsResult.status === 'fulfilled') {
      const stats = statsResult.value?.data ?? statsResult.value ?? null;
      if (stats && typeof stats === 'object') {
        setNgoStats(stats);
      }
      fulfilledCount++;
    }

    if (campaignsResult.status === 'fulfilled') {
      const rows = unwrapArray(campaignsResult.value);
      if (rows) setCampaigns(rows);
      fulfilledCount++;
    }

    if (donationsResult.status === 'fulfilled') {
      const rows = unwrapArray(donationsResult.value);
      if (rows) setNgoDonations(rows);
      fulfilledCount++;
    }

    if (pickupsResult.status === 'fulfilled') {
      const rows = unwrapArray(pickupsResult.value);
      if (rows) setNgoPickups(rows);
      fulfilledCount++;
    }

    if (volunteersResult.status === 'fulfilled') {
      const rows = unwrapArray(volunteersResult.value);
      if (rows) setNgoVolunteers(rows);
      fulfilledCount++;
    }

    if (volunteerStatsResult.status === 'fulfilled') {
      if (volunteerStatsResult.value && typeof volunteerStatsResult.value === 'object') {
        setVolunteerStats(volunteerStatsResult.value);
      }
      fulfilledCount++;
    }

    if (volunteerScheduleResult.status === 'fulfilled') {
      const rows = unwrapArray(volunteerScheduleResult.value);
      if (rows) setVolunteerSchedule(rows);
      fulfilledCount++;
    }

    if (urgentNeedsResult.status === 'fulfilled') {
      const rows = unwrapArray(urgentNeedsResult.value);
      if (rows) setUrgentNeeds(rows);
      fulfilledCount++;
    }

    if (notificationResult.status === 'fulfilled') {
      const rows = unwrapArray(notificationResult.value);
      if (rows) setNotificationHistory(rows);
      fulfilledCount++;
    }

    if (fulfilledCount === 0) {
      toast.error('Failed to load NGO dashboard data');
    }
  };

  const handleNotificationFormField = (field, value) => {
    setNotificationForm((prev) => {
      if (field === 'audience') {
        return {
          ...prev,
          audience: value,
          recipientUserIds: [],
          recipientEmails: [],
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const applyNotificationTemplate = (templateKey) => {
    const template = NGO_NOTIFICATION_TEMPLATES.find((item) => item.key === templateKey);
    if (!template) return;

    setNotificationForm((prev) => ({
      ...prev,
      templateKey: template.key,
      title: template.title,
      message: template.message,
      audience: template.audience,
      notificationType: template.notificationType,
      recipientUserIds: [],
      recipientEmails: [],
    }));
  };

  const toggleNotificationRecipientUser = (userId) => {
    const normalizedId = numberOr(userId, 0);
    if (!normalizedId) return;

    setNotificationForm((prev) => {
      const next = new Set(prev.recipientUserIds || []);
      if (next.has(normalizedId)) {
        next.delete(normalizedId);
      } else {
        next.add(normalizedId);
      }
      return {
        ...prev,
        recipientUserIds: Array.from(next),
      };
    });
  };

  const toggleNotificationRecipientEmail = (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return;

    setNotificationForm((prev) => {
      const next = new Set(prev.recipientEmails || []);
      if (next.has(normalizedEmail)) {
        next.delete(normalizedEmail);
      } else {
        next.add(normalizedEmail);
      }
      return {
        ...prev,
        recipientEmails: Array.from(next),
      };
    });
  };

  const handleSendNotification = async (event) => {
    event.preventDefault();
    const title = String(notificationForm.title || '').trim();
    const message = String(notificationForm.message || '').trim();

    if (!title || !message) {
      toast.error('Notification title and message are required');
      return;
    }

    const payload = {
      title,
      message,
      audience: String(notificationForm.audience || 'DONORS').toUpperCase(),
      notificationType: String(notificationForm.notificationType || 'GENERAL').toUpperCase(),
      templateKey: String(notificationForm.templateKey || '').trim(),
      campaignId: notificationForm.campaignId ? Number(notificationForm.campaignId) : null,
      pickupId: notificationForm.pickupId ? Number(notificationForm.pickupId) : null,
      sendEmail: Boolean(notificationForm.sendEmail),
      recipientUserIds: Array.isArray(notificationForm.recipientUserIds) ? notificationForm.recipientUserIds : [],
      recipientEmails: Array.isArray(notificationForm.recipientEmails) ? notificationForm.recipientEmails : [],
    };

    setNotificationSubmitting(true);
    try {
      const response = await api.sendNGONotification(payload);
      const sent = numberOr(response?.sent, 0);
      const emailSent = numberOr(response?.emailSent, 0);
      setLastDeliveryReport(response || null);
      toast.success(`Notification sent to ${sent} recipient(s)${payload.sendEmail ? `, ${emailSent} email(s)` : ''}`);
      setNotificationForm((prev) => ({
        ...prev,
        title: '',
        message: '',
        campaignId: '',
        pickupId: '',
        recipientUserIds: [],
        recipientEmails: [],
      }));
      const latest = await api.getNotifications();
      if (Array.isArray(latest)) {
        setNotificationHistory(latest);
      }
    } catch (_error) {
      toast.error('Failed to send notification');
    } finally {
      setNotificationSubmitting(false);
    }
  };

  const resetUrgentForm = () => {
    setUrgentForm({
      title: '',
      message: '',
      startTime: '',
      endTime: '',
    });
    setEditingUrgentId(null);
  };

  const startEditingUrgentNeed = (need) => {
    setEditingUrgentId(need?.urgent_id || null);
    setUrgentForm({
      title: String(need?.title || '').trim(),
      message: String(need?.message || '').trim(),
      startTime: toDateTimeLocalInput(need?.start_time),
      endTime: toDateTimeLocalInput(need?.end_time),
    });
    setActiveMenu('urgent_needs');
  };

  const handleUrgentFormField = (field, value) => {
    setUrgentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUrgentNeedSubmit = async (event) => {
    event.preventDefault();
    const title = String(urgentForm.title || '').trim();
    const message = String(urgentForm.message || '').trim();

    if (!title || !message) {
      toast.error('Title and message are required');
      return;
    }

    const payload = {
      title,
      message,
      startTime: toIsoOrNull(urgentForm.startTime),
      endTime: toIsoOrNull(urgentForm.endTime),
    };

    setUrgentSubmitting(true);
    try {
      if (editingUrgentId) {
        await api.updateUrgentNeed(editingUrgentId, payload);
        toast.success('Urgent need updated');
      } else {
        await api.createUrgentNeed(payload);
        toast.success('Urgent need created');
      }
      resetUrgentForm();
      await fetchData();
    } catch (_error) {
      toast.error(editingUrgentId ? 'Failed to update urgent need' : 'Failed to create urgent need');
    } finally {
      setUrgentSubmitting(false);
    }
  };

  const handleDeleteUrgentNeed = async (urgentId) => {
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm('Delete this urgent need alert?');
    if (!confirmed) return;

    try {
      await api.deleteUrgentNeed(urgentId);
      toast.success('Urgent need deleted');
      if (Number(editingUrgentId) === Number(urgentId)) {
        resetUrgentForm();
      }
      await fetchData();
    } catch (_error) {
      toast.error('Failed to delete urgent need');
    }
  };

  const loadVolunteerTaskHistory = async (volunteerId) => {
    if (!volunteerId) {
      setSelectedVolunteerTasks([]);
      return;
    }

    try {
      const history = await api.getNGOVolunteerTaskHistory(volunteerId);
      setSelectedVolunteerTasks(Array.isArray(history) ? history : []);
    } catch (_error) {
      toast.error('Failed to load volunteer task history');
      setSelectedVolunteerTasks([]);
    }
  };

  const resetCampaignForm = () => {
    setEditingCampaignId(null);
    setCampaignForm({
      title: '',
      description: '',
      targetAmount: '',
      donationType: 'MONEY',
      endDate: '',
      city: '',
      state: '',
    });
  };

  const startEditingCampaign = (campaign) => {
    setEditingCampaignId(campaign?.campaign_id || campaign?.id || null);
    setCampaignForm({
      title: String(campaign?.title || '').trim(),
      description: String(campaign?.description || '').trim(),
      targetAmount: String(numberOr(campaign?.target_amount, 0)),
      donationType: String(campaign?.donation_type || 'money').toUpperCase(),
      endDate: String(campaign?.end_date || '').slice(0, 10),
      city: String(campaign?.city || '').trim(),
      state: String(campaign?.state || '').trim(),
    });
    setActiveMenu('campaigns');
  };

  const handleCampaignFormField = (field, value) => {
    setCampaignForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCampaignSubmit = async (event) => {
    event.preventDefault();
    const title = String(campaignForm.title || '').trim();
    const targetAmount = Number(campaignForm.targetAmount);

    if (!title) {
      toast.error('Campaign title is required');
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount < 100) {
      toast.error('Goal amount must be at least 100');
      return;
    }

    const payload = {
      title,
      description: String(campaignForm.description || '').trim(),
      targetAmount,
      donationType: String(campaignForm.donationType || 'MONEY').toUpperCase(),
      endDate: campaignForm.endDate || null,
      city: String(campaignForm.city || '').trim(),
      state: String(campaignForm.state || '').trim(),
    };

    setCampaignSubmitting(true);
    try {
      if (editingCampaignId) {
        await api.updateCampaign(editingCampaignId, payload);
        toast.success('Campaign updated');
      } else {
        await api.createCampaign(payload);
        toast.success('Campaign created');
      }
      resetCampaignForm();
      await fetchData();
    } catch (_error) {
      toast.error(editingCampaignId ? 'Failed to update campaign' : 'Failed to create campaign');
    } finally {
      setCampaignSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm('Delete this campaign? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await api.deleteCampaign(campaignId);
      toast.success('Campaign deleted');
      if (editingCampaignId && Number(editingCampaignId) === Number(campaignId)) {
        resetCampaignForm();
      }
      await fetchData();
    } catch (_error) {
      toast.error('Failed to delete campaign');
    }
  };

  const markPickupBusy = (pickupId, busy) => {
    setPickupBusyById((prev) => ({ ...prev, [pickupId]: busy }));
  };

  const handlePickupVolunteerDraft = (pickupId, volunteerId) => {
    setPickupVolunteerDrafts((prev) => ({ ...prev, [pickupId]: String(volunteerId || '') }));
  };

  const handlePickupStatusDraft = (pickupId, status) => {
    setPickupStatusDrafts((prev) => ({ ...prev, [pickupId]: String(status || '').toUpperCase() }));
  };

  const handlePickupDecision = async (pickupId, decision) => {
    markPickupBusy(pickupId, true);
    try {
      await api.decideNGOPickup(pickupId, decision);
      toast.success(decision === 'accept' ? 'Pickup accepted' : 'Pickup rejected');
      await fetchData();
    } catch (_error) {
      toast.error(`Failed to ${decision} pickup request`);
    } finally {
      markPickupBusy(pickupId, false);
    }
  };

  const handleAssignPickupVolunteer = async (pickupId) => {
    const draftVolunteerId = Number(pickupVolunteerDrafts[pickupId] || 0);
    if (!draftVolunteerId) {
      toast.error('Select a volunteer first');
      return;
    }

    markPickupBusy(pickupId, true);
    try {
      await api.assignNGOPickupVolunteer(pickupId, draftVolunteerId);
      toast.success('Volunteer assigned');
      await fetchData();
    } catch (_error) {
      toast.error('Failed to assign volunteer');
    } finally {
      markPickupBusy(pickupId, false);
    }
  };

  const handleUpdatePickupStatus = async (pickupId) => {
    const status = String(pickupStatusDrafts[pickupId] || '').toUpperCase();
    if (!status) {
      toast.error('Select a status');
      return;
    }

    markPickupBusy(pickupId, true);
    try {
      await api.updateNGOPickupStatus(pickupId, status);
      toast.success('Pickup status updated');
      await fetchData();
    } catch (_error) {
      toast.error('Failed to update pickup status');
    } finally {
      markPickupBusy(pickupId, false);
    }
  };

  const handleRegisterVolunteer = async (event) => {
    event.preventDefault();
    const userId = Number(newVolunteerUserId);
    if (!userId) {
      toast.error('Enter a valid user ID');
      return;
    }

    setVolunteerBusy(true);
    try {
      await api.registerNGOVolunteer({ userId });
      toast.success('Volunteer added successfully');
      setNewVolunteerUserId('');
      await fetchData();
    } catch (_error) {
      toast.error('Failed to add volunteer');
    } finally {
      setVolunteerBusy(false);
    }
  };

  const handleVolunteerStatusUpdate = async (volunteerId, status) => {
    if (!volunteerId || !status) return;

    setVolunteerBusy(true);
    try {
      await api.updateNGOVolunteerStatus(volunteerId, status);
      toast.success('Volunteer status updated');
      await fetchData();
      if (Number(selectedVolunteerId) === Number(volunteerId)) {
        await loadVolunteerTaskHistory(volunteerId);
      }
    } catch (_error) {
      toast.error('Failed to update volunteer status');
    } finally {
      setVolunteerBusy(false);
    }
  };

  const handleVolunteerAssignTask = async (event) => {
    event.preventDefault();
    const pickupId = Number(volunteerAssignForm.pickupId || 0);
    const volunteerId = Number(volunteerAssignForm.volunteerId || 0);

    if (!pickupId || !volunteerId) {
      toast.error('Pickup ID and volunteer are required');
      return;
    }

    setVolunteerBusy(true);
    try {
      await api.assignNGOPickupVolunteer(pickupId, volunteerId, volunteerAssignForm.description);
      toast.success('Task assigned to volunteer');
      setVolunteerAssignForm({ pickupId: '', volunteerId: '', description: '' });
      await fetchData();
      if (Number(selectedVolunteerId) === Number(volunteerId)) {
        await loadVolunteerTaskHistory(volunteerId);
      }
    } catch (_error) {
      toast.error('Failed to assign task');
    } finally {
      setVolunteerBusy(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setActiveMenu(resolveNgoMenuFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const pickupCreated = params.get('pickupCreated') === '1';
    if (!pickupCreated) return;

    const pickupId = String(params.get('pickupId') || '').trim();
    toast.success(pickupId ? `Pickup ${pickupId} is now available in Pickup Requests.` : 'Pickup request created successfully.');
    setActiveMenu('pickups');
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!selectedVolunteerId) {
      setSelectedVolunteerTasks([]);
      return;
    }
    loadVolunteerTaskHistory(selectedVolunteerId);
  }, [selectedVolunteerId]);

  useEffect(() => {
    if (!ngoPickups.length) return;

     const nextStatusDrafts = {};
     const nextVolunteerDrafts = {};
     ngoPickups.forEach((pickup) => {
       const pickupId = pickup?.pickup_id;
       if (!pickupId) return;
       const status = pickup?.pickup_status || pickup?.pickupStatus || 'PENDING';
       nextStatusDrafts[pickupId] = String(status || '').toUpperCase();
       nextVolunteerDrafts[pickupId] = '';
     });
     setPickupStatusDrafts(nextStatusDrafts);
     setPickupVolunteerDrafts(nextVolunteerDrafts);
  }, [ngoPickups]);

  const totalDonations = useMemo(() => {
    const apiTotal = numberOr(ngoStats?.total_raised ?? ngoStats?.total_donations, 0);
    if (apiTotal > 0) return apiTotal;
    if (ngoDonations.length > 0) {
      return ngoDonations.reduce((sum, donation) => sum + numberOr(donation?.amount, 0), 0);
    }
    return campaigns.reduce((sum, campaign) => sum + numberOr(campaign?.collected_amount, 0), 0);
  }, [campaigns, ngoDonations, ngoStats]);

  const activeProjects = useMemo(() => {
    const apiActive = numberOr(ngoStats?.active_campaigns, 0);
    if (apiActive > 0) return apiActive;
    return campaigns.filter((campaign) => {
      const status = campaign?.campaign_status || campaign?.campaignStatus || '';
      return String(status || '').toLowerCase() === 'active';
    }).length;
  }, [campaigns, ngoStats]);

  const volunteersCount = numberOr(ngoStats?.volunteers_active ?? ngoStats?.total_volunteers, 0);
  const pendingPickupRequests = useMemo(
    () =>
      ngoPickups.filter((pickup) => {
        const pickupStatus = pickup?.pickup_status || pickup?.pickupStatus || '';
        const status = String(pickupStatus || '').toLowerCase();
        return status !== 'completed' && status !== 'cancelled' && status !== 'rejected';
      }).length,
    [ngoPickups]
  );

  const volunteerTaskSummary = useMemo(() => {
    const completedFromApi = numberOr(ngoStats?.tasks_completed ?? ngoStats?.completed_tasks, 0);
    const pendingFromApi = numberOr(ngoStats?.pending_tasks, 0);
    const totalFromApi = numberOr(ngoStats?.total_tasks, 0);

    if (completedFromApi > 0 || pendingFromApi > 0 || totalFromApi > 0) {
      const computedTotal = Math.max(totalFromApi, completedFromApi + pendingFromApi);
      return {
        completed: completedFromApi,
        pending: pendingFromApi,
        total: computedTotal,
      };
    }

    const completedFromPickups = ngoPickups.filter(
      (pickup) => {
        const pickupStatus = pickup?.pickup_status || pickup?.pickupStatus || '';
        return String(pickupStatus || '').toLowerCase() === 'completed';
      }
    ).length;
    const pendingFromPickups = pendingPickupRequests;
    return {
      completed: completedFromPickups,
      pending: pendingFromPickups,
      total: completedFromPickups + pendingFromPickups,
    };
  }, [ngoPickups, ngoStats, pendingPickupRequests]);

  const chartData = useMemo(() => buildMonthlyOverview(ngoDonations), [ngoDonations]);

  const projectRows = useMemo(() => {
    if (campaigns.length > 0) {
      return campaigns.slice(0, 3).map((campaign) => {
        const target = numberOr(campaign?.target_amount, 0);
        const raised = numberOr(campaign?.collected_amount, 0);
        return {
          id: campaign?.campaign_id || campaign?.id,
          title: campaign?.title || 'Campaign',
          status: String(campaign?.campaign_status || campaign?.campaignStatus || 'ongoing').toLowerCase(),
          fundedPercent: percentOf(raised, target),
          target,
        };
      });
    }

    return [];
  }, [campaigns]);

  const topDonors = useMemo(() => {
    if (!ngoDonations.length) return [];

    const donorTotals = new Map();
    ngoDonations.forEach((donation) => {
      const donor = donation?.donor_name || donation?.donorName || 'Donor';
      const amount = numberOr(donation?.amount, 0);
      donorTotals.set(donor, numberOr(donorTotals.get(donor), 0) + amount);
    });

    return Array.from(donorTotals.entries())
      .map(([donor, amount]) => ({ donor, amount }))
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 3);
  }, [ngoDonations]);

  const recentActivity = useMemo(() => {
    const donationEvents = ngoDonations.slice(0, 10).map((donation) => ({
      id: `donation-${donation?.id || donation?.donation_id || donation?.transaction_id || Math.random()}`,
      when: donation?.date || donation?.created_at || donation?.createdAt || '',
      text: `Donation received from ${donation?.donor_name || donation?.donorName || 'Donor'} (${formatCurrency(donation?.amount || 0)})`,
      type: 'donation',
    }));

    const pickupEvents = ngoPickups.slice(0, 10).map((pickup) => ({
      id: `pickup-${pickup?.pickup_id || pickup?.donation_id || Math.random()}`,
      when: pickup?.pickup_date || pickup?.updated_at || pickup?.updatedAt || '',
        text: `Pickup ${String(pickup?.pickup_status || pickup?.pickupStatus || 'scheduled').toLowerCase()} for ${pickup?.donor_name || 'donor'}`,
      type: 'pickup',
    }));

    return [...donationEvents, ...pickupEvents]
      .sort((left, right) => {
        const leftTime = new Date(left.when || '').getTime();
        const rightTime = new Date(right.when || '').getTime();
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
        return safeRight - safeLeft;
      })
      .slice(0, 6);
  }, [ngoDonations, ngoPickups]);

  const volunteerActivity = {
    newVolunteers: Math.max(0, Math.round(volunteersCount * 0.09)),
    hoursLogged: Math.max(0, numberOr(ngoStats?.hours_volunteered, 0)),
  };

  const impactMetrics = {
    childrenEducated: Math.max(0, numberOr(ngoStats?.children_educated, 0)),
    familiesSupported: Math.max(0, numberOr(ngoStats?.families_supported, 0)),
    waterWellsBuilt: Math.max(0, numberOr(ngoStats?.water_wells_built, 0)),
  };

  const progressRings = [
    { label: 'Training Sessions', value: 60, color: '#43a047' },
    { label: 'Supply Distribution', value: 45, color: '#ef9b2d' },
    { label: 'Community Outreach', value: 80, color: '#1e88e5' },
  ];
  const activeMenuItem = SIDEBAR_ITEMS.find((item) => item.id === activeMenu) || SIDEBAR_ITEMS[0];
  const campaignRows = useMemo(
    () =>
      [...campaigns].sort((left, right) => {
        const leftTime = new Date(left?.start_date || left?.created_at || '').getTime();
        const rightTime = new Date(right?.start_date || right?.created_at || '').getTime();
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
        return safeRight - safeLeft;
      }),
    [campaigns]
  );
  const pickupRows = useMemo(
    () =>
      [...ngoPickups].sort((left, right) => {
        const leftTime = new Date(left?.pickup_date || '').getTime();
        const rightTime = new Date(right?.pickup_date || '').getTime();
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
        return safeRight - safeLeft;
      }),
    [ngoPickups]
  );
  const pickupStatusSummary = useMemo(
    () => ({
      pending: pickupRows.filter((pickup) => {
        const pickupStatus = pickup?.pickup_status || pickup?.pickupStatus || '';
        return String(pickupStatus || '').toLowerCase() === 'pending';
      }).length,
      scheduled: pickupRows.filter((pickup) => {
        const pickupStatus = pickup?.pickup_status || pickup?.pickupStatus || '';
        return ['scheduled', 'approved', 'assigned', 'in_progress'].includes(
          String(pickupStatus || '').toLowerCase()
        );
      }).length,
      completed: pickupRows.filter((pickup) => {
        const pickupStatus = pickup?.pickup_status || pickup?.pickupStatus || '';
        return String(pickupStatus || '').toLowerCase() === 'completed';
      }).length,
    }),
    [pickupRows]
  );
  const donationRows = useMemo(
    () =>
      [...ngoDonations].sort((left, right) => {
        const leftTime = new Date(left?.date || left?.created_at || left?.createdAt || '').getTime();
        const rightTime = new Date(right?.date || right?.created_at || right?.createdAt || '').getTime();
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
        return safeRight - safeLeft;
      }),
    [ngoDonations]
  );

  const donorRows = useMemo(() => {
    const donorMap = new Map();

    donationRows.forEach((donation) => {
      const donorEmail = String(donation?.donor_email || donation?.donorEmail || '').trim().toLowerCase();
      const donorName = String(donation?.donor_name || donation?.donorName || 'Donor').trim() || 'Donor';
      const donorKey = donorEmail || donorName.toLowerCase();
      if (!donorKey) return;

      const amount = numberOr(donation?.amount, 0);
      const donationDate = donation?.date || donation?.created_at || donation?.createdAt || null;
      const existing = donorMap.get(donorKey) || {
        donor_name: donorName,
        donor_email: donorEmail,
        donations_count: 0,
        total_amount: 0,
        last_donation_date: null,
      };

      existing.donor_name = existing.donor_name || donorName;
      existing.donor_email = existing.donor_email || donorEmail;
      existing.donations_count += 1;
      existing.total_amount += amount;

      const currentTime = donationDate ? new Date(donationDate).getTime() : 0;
      const existingTime = existing.last_donation_date ? new Date(existing.last_donation_date).getTime() : 0;
      if (currentTime > existingTime) {
        existing.last_donation_date = donationDate;
      }

      donorMap.set(donorKey, existing);
    });

    return Array.from(donorMap.values()).sort((left, right) => right.total_amount - left.total_amount);
  }, [donationRows]);

  const donorRecipientOptions = useMemo(
    () => donorRows.filter((donor) => String(donor?.donor_email || '').trim()).map((donor) => ({
      email: String(donor.donor_email || '').trim().toLowerCase(),
      name: String(donor.donor_name || 'Donor').trim(),
    })),
    [donorRows]
  );

  const volunteerRecipientOptions = useMemo(
    () => ngoVolunteers
      .filter((volunteer) => numberOr(volunteer?.user_id, 0) > 0)
      .map((volunteer) => ({
        userId: numberOr(volunteer.user_id, 0),
        name: String(volunteer.name || 'Volunteer').trim(),
        email: String(volunteer.email || '').trim(),
      })),
    [ngoVolunteers]
  );

  const urgentRows = useMemo(
    () =>
      [...urgentNeeds].sort((left, right) => {
        const leftTime = new Date(left?.created_at || '').getTime();
        const rightTime = new Date(right?.created_at || '').getTime();
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
        return safeRight - safeLeft;
      }),
    [urgentNeeds]
  );

  const activeUrgentCount = useMemo(
    () => urgentRows.filter((item) => String(item?.urgent_status || '').toLowerCase() === 'approved').length,
    [urgentRows]
  );

  const donationReport = useMemo(() => {
    const totalAmount = donationRows.reduce((sum, donation) => sum + numberOr(donation?.amount, 0), 0);
    const totalRecords = donationRows.length;
    const avgDonation = totalRecords > 0 ? totalAmount / totalRecords : 0;

    const now = new Date();
    const currentMonthAmount = donationRows
      .filter((item) => {
        const date = new Date(item?.date || item?.created_at || item?.createdAt || '');
        if (Number.isNaN(date.getTime())) return false;
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, item) => sum + numberOr(item?.amount, 0), 0);

    return {
      totalAmount,
      totalRecords,
      avgDonation,
      currentMonthAmount,
    };
  }, [donationRows]);

  const campaignPerformanceRows = useMemo(
    () =>
      campaignRows.map((campaign) => {
        const target = numberOr(campaign?.target_amount, 0);
        const raised = numberOr(campaign?.collected_amount, 0);
        const donors = numberOr(campaign?.donors_count ?? campaign?.donorsCount, 0);
        const performance = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
        return {
          campaign_id: campaign?.campaign_id || campaign?.id,
          title: campaign?.title || 'Campaign',
          status: String(campaign?.campaign_status || campaign?.campaignStatus || 'active').toUpperCase(),
          target,
          raised,
          donors,
          performance,
        };
      }),
    [campaignRows]
  );

  const volunteerActivityRows = useMemo(() => {
    const taskMap = new Map();

    volunteerSchedule.forEach((task) => {
      const volunteerId = Number(task?.volunteer_id || 0);
      if (!volunteerId) return;
      const status = String(task?.status || 'ASSIGNED').toUpperCase();
      const bucket = taskMap.get(volunteerId) || { total: 0, completed: 0, inProgress: 0, pending: 0 };

      bucket.total += 1;
      if (status === 'COMPLETED') bucket.completed += 1;
      else if (status === 'IN_PROGRESS') bucket.inProgress += 1;
      else bucket.pending += 1;

      taskMap.set(volunteerId, bucket);
    });

    return ngoVolunteers.map((volunteer) => {
      const volunteerId = Number(volunteer?.volunteer_id || 0);
      const taskStats = taskMap.get(volunteerId) || { total: 0, completed: 0, inProgress: 0, pending: 0 };
      return {
        volunteer_id: volunteerId,
        name: volunteer?.name || 'Volunteer',
        status: String(volunteer?.status || 'ACTIVE').toUpperCase(),
        hours: numberOr(volunteer?.hours_volunteered, 0),
        totalTasks: taskStats.total,
        completedTasks: taskStats.completed,
        inProgressTasks: taskStats.inProgress,
        pendingTasks: taskStats.pending,
      };
    });
  }, [ngoVolunteers, volunteerSchedule]);

  const monthlySummaryRows = useMemo(() => {
    const monthlyMap = new Map();

    const ensureMonth = (dateValue) => {
      const date = new Date(dateValue || '');
      if (Number.isNaN(date.getTime())) return null;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          key,
          label: formatMonthYear(date),
          donations: 0,
          donationAmount: 0,
          campaignsStarted: 0,
          volunteerTasksCompleted: 0,
          pickupsCompleted: 0,
        });
      }
      return key;
    };

    donationRows.forEach((item) => {
      const key = ensureMonth(item?.date || item?.created_at || item?.createdAt);
      if (!key) return;
      const row = monthlyMap.get(key);
      row.donations += 1;
      row.donationAmount += numberOr(item?.amount, 0);
    });

    campaignRows.forEach((item) => {
      const key = ensureMonth(item?.start_date || item?.created_at || item?.createdAt);
      if (!key) return;
      const row = monthlyMap.get(key);
      row.campaignsStarted += 1;
    });

    ngoPickups.forEach((item) => {
      const key = ensureMonth(item?.pickup_date || item?.updated_at || item?.updatedAt);
      if (!key) return;
      const row = monthlyMap.get(key);
      if (String(item?.pickup_status || '').toLowerCase() === 'completed') {
        row.pickupsCompleted += 1;
      }
    });

    volunteerSchedule.forEach((item) => {
      const key = ensureMonth(item?.completed_date || item?.assigned_date || item?.created_at || item?.createdAt);
      if (!key) return;
      const row = monthlyMap.get(key);
      if (String(item?.status || '').toUpperCase() === 'COMPLETED') {
        row.volunteerTasksCompleted += 1;
      }
    });

    return Array.from(monthlyMap.values())
      .sort((left, right) => (left.key < right.key ? 1 : -1))
      .slice(0, 6);
  }, [campaignRows, donationRows, ngoPickups, volunteerSchedule]);

  const handleDownloadReceipt = async (receiptNumber) => {
    if (!receiptNumber) {
      toast.error('Receipt not available for this donation');
      return;
    }

    try {
      const blob = await api.downloadReceiptPdf(receiptNumber);
      if (!blob) {
        throw new Error('Unable to download receipt');
      }
      const objectUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `DaanSetu_Receipt_${receiptNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    } catch (_error) {
      toast.error('Failed to download receipt');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[#d3dce8] bg-[#e9eef5] shadow-xl"
    >
      <div className="flex flex-col lg:flex-row">
        <aside className="shrink-0 bg-gradient-to-b from-[#244f81] to-[#2e5f93] text-white lg:w-[360px]">
          <div className="flex items-center gap-3 border-b border-white/15 px-5 py-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#8bc34a] via-[#3aa0d8] to-[#fbc02d]">
              <FiGlobe className="h-4 w-4 text-white" />
            </span>
            <p className="text-4xl font-black tracking-tight">NGO</p>
          </div>
          <nav className="pt-2">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeMenu;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveMenu(item.id);
                    navigate(NGO_MENU_PATH_BY_ID[item.id] || '/dashboard/ngo');
                  }}
                  className={`flex w-full items-center gap-3 border-y border-white/5 px-6 py-3 text-left text-lg font-semibold transition-colors ${
                    active ? 'bg-white/12 text-white' : 'text-blue-100/95 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-[#dbe4ef] bg-white px-6 py-5">
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight text-[#1f3f60]">{activeMenuItem.label}</h1>
            <div className="flex items-center gap-2 text-[#9aacbf]">
              <button type="button" className="rounded-full p-1.5 hover:bg-slate-100" aria-label="Alerts">
                <FiBell className="h-5 w-5" />
              </button>
              <button type="button" className="rounded-full p-1.5 hover:bg-slate-100" aria-label="Members">
                <FiUserPlus className="h-5 w-5" />
              </button>
              <button type="button" className="rounded-full p-1.5 hover:bg-slate-100" aria-label="Reminders">
                <FiClock className="h-5 w-5" />
              </button>
              <span className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ef9a9a] to-[#ad1457] text-xs font-bold text-white">
                AD
              </span>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {activeMenu === 'campaigns' ? (
              <>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-1 rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">
                        {editingCampaignId ? 'Edit Campaign' : 'Create Campaign'}
                      </h3>
                      {editingCampaignId ? (
                        <button
                          type="button"
                          onClick={resetCampaignForm}
                          className="text-xs px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          New
                        </button>
                      ) : null}
                    </div>
                    <form onSubmit={handleCampaignSubmit} className="space-y-3">
                      <input
                        value={campaignForm.title}
                        onChange={(event) => handleCampaignFormField('title', event.target.value)}
                        placeholder="Campaign title"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        required
                      />
                      <textarea
                        value={campaignForm.description}
                        onChange={(event) => handleCampaignFormField('description', event.target.value)}
                        placeholder="Description"
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 resize-none focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                      />
                      <input
                        type="number"
                        min="100"
                        step="1"
                        value={campaignForm.targetAmount}
                        onChange={(event) => handleCampaignFormField('targetAmount', event.target.value)}
                        placeholder="Goal amount"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        required
                      />
                      <select
                        value={campaignForm.donationType}
                        onChange={(event) => handleCampaignFormField('donationType', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                      >
                        <option value="MONEY">Money</option>
                        <option value="FOOD">Food</option>
                        <option value="CLOTHES">Clothes</option>
                        <option value="BOOKS">Books</option>
                        <option value="MEDICINE">Medicine</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <input
                        type="date"
                        value={campaignForm.endDate}
                        onChange={(event) => handleCampaignFormField('endDate', event.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={campaignForm.city}
                          onChange={(event) => handleCampaignFormField('city', event.target.value)}
                          placeholder="City"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        />
                        <input
                          value={campaignForm.state}
                          onChange={(event) => handleCampaignFormField('state', event.target.value)}
                          placeholder="State"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={campaignSubmitting}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#244f81] text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                      >
                        <FiPlus className="h-4 w-4" />
                        {campaignSubmitting ? 'Saving...' : editingCampaignId ? 'Update Campaign' : 'Create Campaign'}
                      </button>
                    </form>
                  </div>

                  <div className="xl:col-span-2 rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">My Campaigns</h3>
                      <span className="text-xs text-slate-500">{campaignRows.length} total</span>
                    </div>
                    <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
                      {campaignRows.map((campaign) => {
                        const target = numberOr(campaign?.target_amount, 0);
                        const collected = numberOr(campaign?.collected_amount, 0);
                        const percent = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
                        return (
                          <div key={campaign?.campaign_id || campaign?.id} className="rounded-xl border border-slate-200 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate">{campaign?.title || 'Campaign'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Goal: {formatCurrency(target)} • Raised: {formatCurrency(collected)}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Type: {String(campaign?.donation_type || 'money').toUpperCase()} • Status: {String(campaign?.campaign_status || campaign?.campaignStatus || 'active').toUpperCase()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startEditingCampaign(campaign)}
                                  className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  <FiEdit2 className="h-3.5 w-3.5" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCampaign(campaign?.campaign_id || campaign?.id)}
                                  className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                                >
                                  <FiTrash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div className="h-full rounded-full bg-[#56b35e]" style={{ width: `${percent}%` }} />
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{percent}% progress tracked</div>
                          </div>
                        );
                      })}
                      {!campaignRows.length && (
                        <p className="text-sm text-slate-500">No campaigns yet. Create your first campaign.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : activeMenu === 'donations' ? (
              <>
                <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-700">Donor Contributions</h3>
                    <span className="text-xs text-slate-500">{donationRows.length} donations</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="text-left py-2 pr-3 font-semibold">Donor</th>
                          <th className="text-left py-2 pr-3 font-semibold">Type</th>
                          <th className="text-left py-2 pr-3 font-semibold">Amount</th>
                          <th className="text-left py-2 pr-3 font-semibold">Payment Status</th>
                          <th className="text-left py-2 pr-3 font-semibold">Date</th>
                          <th className="text-left py-2 font-semibold">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donationRows.map((donation) => {
                          const donationId = donation?.id
                            || donation?.donation_id
                            || donation?.transaction_id
                            || `${donation?.date || 'unknown'}-${donation?.amount || 0}-${donation?.donor_email || donation?.donor_name || 'donor'}`;
                          const receiptNumber = donation?.receipt_number || donation?.receiptNumber || '';
                          return (
                            <tr key={donationId} className="border-b border-slate-100">
                              <td className="py-2 pr-3">
                                <p className="font-semibold text-slate-700">{donation?.donor_name || donation?.donorName || 'Anonymous'}</p>
                                <p className="text-xs text-slate-500">{donation?.donor_email || donation?.donorEmail || ''}</p>
                              </td>
                              <td className="py-2 pr-3 text-slate-700">
                                {formatDonationTypeLabel(donation?.type || donation?.donation_type)}
                              </td>
                              <td className="py-2 pr-3 text-slate-700">
                                {formatCurrency(donation?.amount || 0)}
                              </td>
                              <td className="py-2 pr-3">
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${paymentStatusClass(donation?.payment_status || donation?.status)}`}>
                                  {formatPaymentStatusLabel(donation?.payment_status || donation?.status)}
                                </span>
                              </td>
                              <td className="py-2 pr-3 text-slate-600">
                                {donation?.date ? new Date(donation.date).toLocaleDateString('en-US') : '-'}
                              </td>
                              <td className="py-2">
                                {receiptNumber ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadReceipt(receiptNumber)}
                                    className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    <FiDownload className="h-3.5 w-3.5" />
                                    Download
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">N/A</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {!donationRows.length && (
                    <p className="text-sm text-slate-500 mt-3">No donations available for this NGO yet.</p>
                  )}
                </div>
              </>
            ) : activeMenu === 'pickups' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Pending</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(pickupStatusSummary.pending)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Scheduled</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(pickupStatusSummary.scheduled)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Completed</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(pickupStatusSummary.completed)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-700">Pickup Requests</h3>
                    <span className="text-xs text-slate-500">{pickupRows.length} requests</span>
                  </div>

                  <div className="space-y-3 max-h-[620px] overflow-auto pr-1">
                    {pickupRows.map((pickup) => {
                      const pickupId = pickup?.pickup_id;
                      const isBusy = Boolean(pickupBusyById[pickupId]);
                      const currentStatus = String(pickup?.pickup_status || pickup?.pickupStatus || '').toLowerCase();
                      const canDecide = currentStatus === 'pending' || currentStatus === 'scheduled';

                      return (
                        <div key={pickupId} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">
                                {pickup?.donor_name || 'Donor'} • {pickup?.pickup_date || 'Date not set'}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{pickup?.donor_address || 'Address unavailable'}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Items: {(pickup?.items || []).join(', ') || 'N/A'} • Contact: {pickup?.contact_phone || 'N/A'}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Volunteer: {pickup?.volunteer_name || 'Not assigned'} • Status: {String(pickup?.pickup_status || pickup?.pickupStatus || 'pending').toUpperCase()}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full xl:w-auto">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={isBusy || !canDecide}
                                  onClick={() => handlePickupDecision(pickupId, 'accept')}
                                  className="rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy || !canDecide}
                                  onClick={() => handlePickupDecision(pickupId, 'reject')}
                                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <select
                                  value={pickupVolunteerDrafts[pickupId] || ''}
                                  onChange={(event) => handlePickupVolunteerDraft(pickupId, event.target.value)}
                                  disabled={isBusy}
                                  className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 min-w-[140px]"
                                >
                                  <option value="">Assign volunteer</option>
                                  {ngoVolunteers.map((volunteer) => (
                                    <option key={volunteer.volunteer_id} value={String(volunteer.volunteer_id)}>
                                      {volunteer.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleAssignPickupVolunteer(pickupId)}
                                  className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                  Assign
                                </button>
                              </div>

                              <div className="flex gap-2">
                                <select
                                  value={pickupStatusDrafts[pickupId] || 'PENDING'}
                                  onChange={(event) => handlePickupStatusDraft(pickupId, event.target.value)}
                                  disabled={isBusy}
                                  className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 min-w-[130px]"
                                >
                                  <option value="PENDING" disabled>Pending</option>
                                  <option value="SCHEDULED" disabled>Scheduled</option>
                                  <option value="APPROVED">Approved</option>
                                  <option value="ASSIGNED">Assigned</option>
                                  <option value="IN_PROGRESS">In Progress</option>
                                  <option value="COMPLETED">Completed</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleUpdatePickupStatus(pickupId)}
                                  className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                  Update
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!pickupRows.length && (
                      <p className="text-sm text-slate-500">No pickup requests available for this NGO.</p>
                    )}
                  </div>
                </div>
              </>
            ) : activeMenu === 'volunteers' ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Total Volunteers</p>
                    <p className="mt-1 text-4xl font-bold text-[#284463]">{formatNumber(volunteerStats?.totalVolunteers ?? ngoVolunteers.length)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Active Volunteers</p>
                    <p className="mt-1 text-4xl font-bold text-[#284463]">{formatNumber(volunteerStats?.activeVolunteers)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Tasks Completed</p>
                    <p className="mt-1 text-4xl font-bold text-[#284463]">{formatNumber(volunteerStats?.totalTasksCompleted)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Hours Volunteered</p>
                    <p className="mt-1 text-4xl font-bold text-[#284463]">{formatNumber(volunteerStats?.totalHoursVolunteered)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <h3 className="text-lg font-bold text-slate-700">Add Volunteer</h3>
                    <p className="mt-1 text-xs text-slate-500">Use an existing user ID to register as volunteer in your NGO.</p>
                    <form onSubmit={handleRegisterVolunteer} className="mt-3 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={newVolunteerUserId}
                        onChange={(event) => setNewVolunteerUserId(event.target.value)}
                        placeholder="User ID"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                      />
                      <button
                        type="submit"
                        disabled={volunteerBusy}
                        className="rounded-lg bg-[#244f81] text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <h3 className="text-lg font-bold text-slate-700">Assign Task</h3>
                    <p className="mt-1 text-xs text-slate-500">Assign pickup tasks to your NGO volunteers.</p>
                    <form onSubmit={handleVolunteerAssignTask} className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="number"
                        min="1"
                        value={volunteerAssignForm.pickupId}
                        onChange={(event) => setVolunteerAssignForm((prev) => ({ ...prev, pickupId: event.target.value }))}
                        placeholder="Pickup ID"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                      />
                      <select
                        value={volunteerAssignForm.volunteerId}
                        onChange={(event) => setVolunteerAssignForm((prev) => ({ ...prev, volunteerId: event.target.value }))}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                      >
                        <option value="">Select volunteer</option>
                        {ngoVolunteers.map((volunteer) => (
                          <option key={volunteer.volunteer_id} value={String(volunteer.volunteer_id)}>
                            {volunteer.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={volunteerBusy}
                        className="rounded-lg bg-[#244f81] text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                      >
                        Assign
                      </button>
                      <input
                        type="text"
                        value={volunteerAssignForm.description}
                        onChange={(event) => setVolunteerAssignForm((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder="Task description (optional)"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 md:col-span-3 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                      />
                    </form>
                  </div>
                </div>

                <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-700">NGO Volunteers</h3>
                    <span className="text-xs text-slate-500">{ngoVolunteers.length} records</span>
                  </div>
                  <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                    {ngoVolunteers.map((volunteer) => (
                      <div key={volunteer.volunteer_id} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{volunteer.name}</p>
                            <p className="text-xs text-slate-500">{volunteer.email || 'No email'}{volunteer.phone ? ` • ${volunteer.phone}` : ''}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Tasks: {formatNumber(volunteer.tasks_completed)} • Hours: {formatNumber(volunteer.hours_volunteered)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedVolunteerId(String(volunteer.volunteer_id))}
                              className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              Track Status
                            </button>
                            <select
                              value={String(volunteer.status || 'ACTIVE').toUpperCase()}
                              onChange={(event) => handleVolunteerStatusUpdate(volunteer.volunteer_id, event.target.value)}
                              disabled={volunteerBusy}
                              className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="INACTIVE">INACTIVE</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!ngoVolunteers.length && (
                      <p className="text-sm text-slate-500">No volunteers added for this NGO yet.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-1">
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">Work Status</h3>
                      <span className="text-xs text-slate-500">
                        {selectedVolunteerId ? `Volunteer #${selectedVolunteerId}` : 'Select volunteer'}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
                      {selectedVolunteerTasks.map((task) => (
                        <div key={task.task_id} className="rounded-lg border border-slate-200 p-2.5">
                          <p className="font-semibold text-slate-800 text-sm">{task.description || `Task #${task.task_id}`}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Status: {task.status} • Pickup: {task.pickup_id || 'N/A'}
                          </p>
                        </div>
                      ))}
                      {!selectedVolunteerTasks.length && (
                        <p className="text-sm text-slate-500">No task history to display.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">Volunteer Schedule</h3>
                      <span className="text-xs text-slate-500">{volunteerSchedule.length} tasks</span>
                    </div>
                    <div className="space-y-2 max-h-[260px] overflow-auto pr-1">
                      {volunteerSchedule.map((task) => (
                        <div key={task.task_id} className="rounded-lg border border-slate-200 p-2.5">
                          <p className="font-semibold text-slate-800 text-sm">{task.volunteer_name || 'Volunteer'} • {task.description || `Task #${task.task_id}`}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {task.status} • Pickup: {task.pickup_id || 'N/A'}
                          </p>
                        </div>
                      ))}
                      {!volunteerSchedule.length && (
                        <p className="text-sm text-slate-500">No scheduled tasks yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : activeMenu === 'reports' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Donation Reports</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatCurrency(donationReport.totalAmount)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatNumber(donationReport.totalRecords)} donations</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Campaign Performance</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(campaignPerformanceRows.length)}</p>
                    <p className="mt-1 text-xs text-slate-500">campaigns tracked</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Volunteer Activity</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(volunteerActivityRows.length)}</p>
                    <p className="mt-1 text-xs text-slate-500">volunteers in report</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Monthly Summary</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatCurrency(donationReport.currentMonthAmount)}</p>
                    <p className="mt-1 text-xs text-slate-500">current month donations</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">Donation Reports</h3>
                      <span className="text-xs text-slate-500">NGO-only</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Total Amount</p>
                        <p className="text-lg font-bold text-slate-800">{formatCurrency(donationReport.totalAmount)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Average Donation</p>
                        <p className="text-lg font-bold text-slate-800">{formatCurrency(donationReport.avgDonation)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs text-slate-500">Records</p>
                        <p className="text-lg font-bold text-slate-800">{formatNumber(donationReport.totalRecords)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Data source: donations received by this NGO account.</p>
                  </div>

                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">Campaign Performance</h3>
                      <span className="text-xs text-slate-500">{campaignPerformanceRows.length} campaigns</span>
                    </div>
                    <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
                      {campaignPerformanceRows.map((campaign) => (
                        <div key={campaign.campaign_id} className="rounded-lg border border-slate-200 p-2.5">
                          <p className="font-semibold text-slate-800 text-sm">{campaign.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {campaign.status} • Donors: {formatNumber(campaign.donors)} • Performance: {campaign.performance}%
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Raised: {formatCurrency(campaign.raised)} / Target: {formatCurrency(campaign.target)}
                          </p>
                        </div>
                      ))}
                      {!campaignPerformanceRows.length && (
                        <p className="text-sm text-slate-500">No campaign performance data available.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-1">
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">Volunteer Activity</h3>
                      <span className="text-xs text-slate-500">{volunteerActivityRows.length} volunteers</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="text-left py-2 pr-3 font-semibold">Volunteer</th>
                            <th className="text-left py-2 pr-3 font-semibold">Status</th>
                            <th className="text-left py-2 pr-3 font-semibold">Hours</th>
                            <th className="text-left py-2 font-semibold">Tasks (C/IP/P)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {volunteerActivityRows.map((volunteer) => (
                            <tr key={volunteer.volunteer_id} className="border-b border-slate-100">
                              <td className="py-2 pr-3 font-semibold text-slate-700">{volunteer.name}</td>
                              <td className="py-2 pr-3 text-slate-600">{volunteer.status}</td>
                              <td className="py-2 pr-3 text-slate-700">{formatNumber(volunteer.hours)}</td>
                              <td className="py-2 text-slate-700">
                                {formatNumber(volunteer.completedTasks)} / {formatNumber(volunteer.inProgressTasks)} / {formatNumber(volunteer.pendingTasks)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!volunteerActivityRows.length && (
                      <p className="text-sm text-slate-500 mt-3">No volunteer activity data available.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">Monthly Summary</h3>
                      <span className="text-xs text-slate-500">Last {formatNumber(monthlySummaryRows.length)} months</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="text-left py-2 pr-3 font-semibold">Month</th>
                            <th className="text-left py-2 pr-3 font-semibold">Donations</th>
                            <th className="text-left py-2 pr-3 font-semibold">Campaigns</th>
                            <th className="text-left py-2 pr-3 font-semibold">Volunteer Tasks</th>
                            <th className="text-left py-2 font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlySummaryRows.map((row) => (
                            <tr key={row.key} className="border-b border-slate-100">
                              <td className="py-2 pr-3 font-semibold text-slate-700">{row.label}</td>
                              <td className="py-2 pr-3 text-slate-700">{formatNumber(row.donations)}</td>
                              <td className="py-2 pr-3 text-slate-700">{formatNumber(row.campaignsStarted)}</td>
                              <td className="py-2 pr-3 text-slate-700">{formatNumber(row.volunteerTasksCompleted)}</td>
                              <td className="py-2 text-slate-700">{formatCurrency(row.donationAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!monthlySummaryRows.length && (
                      <p className="text-sm text-slate-500 mt-3">No monthly summary data available yet.</p>
                    )}
                  </div>
                </div>
              </>
            ) : activeMenu === 'notifications' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Notify Donors</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(donorRows.length)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Notify Volunteers</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(ngoVolunteers.length)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Recent Notifications</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(notificationHistory.length)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-1 rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <h3 className="text-lg font-bold text-slate-700">Send Notification</h3>
                    <form onSubmit={handleSendNotification} className="mt-3 space-y-3">
                      <select
                        value={notificationForm.templateKey}
                        onChange={(event) => applyNotificationTemplate(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                      >
                        {NGO_NOTIFICATION_TEMPLATES.map((template) => (
                          <option key={template.key} value={template.key}>{template.label}</option>
                        ))}
                      </select>
                      <input
                        value={notificationForm.title}
                        onChange={(event) => handleNotificationFormField('title', event.target.value)}
                        placeholder="Notification title"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        required
                      />
                      <textarea
                        value={notificationForm.message}
                        onChange={(event) => handleNotificationFormField('message', event.target.value)}
                        placeholder="Notification message"
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 resize-none focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        required
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <select
                          value={notificationForm.audience}
                          onChange={(event) => handleNotificationFormField('audience', event.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        >
                          <option value="DONORS">Notify Donors</option>
                          <option value="VOLUNTEERS">Notify Volunteers</option>
                        </select>
                        <select
                          value={notificationForm.notificationType}
                          onChange={(event) => handleNotificationFormField('notificationType', event.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        >
                          <option value="GENERAL">General</option>
                          <option value="CAMPAIGN_UPDATE">Campaign Update</option>
                          <option value="PICKUP_ALERT">Pickup Alert</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <select
                          value={notificationForm.campaignId}
                          onChange={(event) => handleNotificationFormField('campaignId', event.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        >
                          <option value="">All campaigns</option>
                          {campaignRows.map((campaign) => (
                            <option key={campaign.campaign_id || campaign.id} value={String(campaign.campaign_id || campaign.id)}>
                              Campaign #{campaign.campaign_id || campaign.id}
                            </option>
                          ))}
                        </select>
                        <select
                          value={notificationForm.pickupId}
                          onChange={(event) => handleNotificationFormField('pickupId', event.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        >
                          <option value="">All pickups</option>
                          {pickupRows.map((pickup) => (
                            <option key={pickup.pickup_id} value={String(pickup.pickup_id)}>
                              Pickup #{pickup.pickup_id}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-lg border border-slate-300 bg-white p-2.5">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Target recipients (optional)</p>
                        {String(notificationForm.audience || '').toUpperCase() === 'DONORS' ? (
                          <div className="space-y-1 max-h-28 overflow-auto pr-1">
                            {donorRecipientOptions.map((recipient) => {
                              const checked = (notificationForm.recipientEmails || []).includes(recipient.email);
                              return (
                                <label key={recipient.email} className="flex items-center gap-2 text-xs text-slate-800">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleNotificationRecipientEmail(recipient.email)}
                                  />
                                  <span className="truncate">{recipient.name} ({recipient.email})</span>
                                </label>
                              );
                            })}
                            {!donorRecipientOptions.length && (
                              <p className="text-xs text-slate-600">No donor emails available.</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-28 overflow-auto pr-1">
                            {volunteerRecipientOptions.map((recipient) => {
                              const checked = (notificationForm.recipientUserIds || []).includes(recipient.userId);
                              return (
                                <label key={recipient.userId} className="flex items-center gap-2 text-xs text-slate-800">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleNotificationRecipientUser(recipient.userId)}
                                  />
                                  <span className="truncate">{recipient.name}{recipient.email ? ` (${recipient.email})` : ''}</span>
                                </label>
                              );
                            })}
                            {!volunteerRecipientOptions.length && (
                              <p className="text-xs text-slate-600">No volunteer recipients available.</p>
                            )}
                          </div>
                        )}
                      </div>

                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(notificationForm.sendEmail)}
                          onChange={(event) => handleNotificationFormField('sendEmail', event.target.checked)}
                        />
                        Send email via NGO notification channel
                      </label>

                      <button
                        type="submit"
                        disabled={notificationSubmitting}
                        className="w-full rounded-lg bg-[#244f81] text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                      >
                        {notificationSubmitting ? 'Sending...' : 'Send Notification'}
                      </button>
                    </form>

                    {lastDeliveryReport ? (
                      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                        <p className="font-semibold">Last Delivery Report</p>
                        <p className="mt-1">Audience: {String(lastDeliveryReport.audience || '').toUpperCase()} • Type: {String(lastDeliveryReport.type || '').toUpperCase()}</p>
                        <p className="mt-1">Audience size: {formatNumber(lastDeliveryReport.audienceRecipients)} • Targeted: {formatNumber(lastDeliveryReport.targetedRecipients)}</p>
                        <p className="mt-1">In-app sent: {formatNumber(lastDeliveryReport.sent)} • Emails sent: {formatNumber(lastDeliveryReport.emailSent)}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="xl:col-span-2 rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">Recent Notifications</h3>
                      <span className="text-xs text-slate-500">My account notifications</span>
                    </div>
                    <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                      {notificationHistory.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">{item.title || 'Notification'}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.message || ''}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                Type: {String(item.type || 'SYSTEM').toUpperCase()} • {item.createdAt ? new Date(item.createdAt).toLocaleString('en-US') : 'Just now'}
                              </p>
                            </div>
                            <span className={`text-[11px] px-2 py-1 rounded-full border ${item.isRead ? 'border-slate-200 text-slate-500' : 'border-blue-200 text-blue-700 bg-blue-50'}`}>
                              {item.isRead ? 'Read' : 'Unread'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {!notificationHistory.length && (
                        <p className="text-sm text-slate-500">No notifications yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : activeMenu === 'donor_users' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Donors who supported your NGO</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(donorRows.length)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Donation Records</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(donationRows.length)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Total Donor Contributions</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatCurrency(donationRows.reduce((sum, item) => sum + numberOr(item?.amount, 0), 0))}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-700">Donors</h3>
                    <span className="text-xs text-slate-500">Read-only list</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="text-left py-2 pr-3 font-semibold">Donor Name</th>
                          <th className="text-left py-2 pr-3 font-semibold">Email</th>
                          <th className="text-left py-2 pr-3 font-semibold">Donations</th>
                          <th className="text-left py-2 pr-3 font-semibold">Total Amount</th>
                          <th className="text-left py-2 font-semibold">Last Donation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donorRows.map((donor, idx) => (
                          <tr key={`${donor.donor_email || donor.donor_name}-${idx}`} className="border-b border-slate-100">
                            <td className="py-2 pr-3 font-semibold text-slate-700">{donor.donor_name || 'Donor'}</td>
                            <td className="py-2 pr-3 text-slate-600">{donor.donor_email || 'N/A'}</td>
                            <td className="py-2 pr-3 text-slate-700">{formatNumber(donor.donations_count)}</td>
                            <td className="py-2 pr-3 text-slate-700">{formatCurrency(donor.total_amount)}</td>
                            <td className="py-2 text-slate-600">
                              {donor.last_donation_date
                                ? new Date(donor.last_donation_date).toLocaleDateString('en-US')
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!donorRows.length && (
                    <p className="text-sm text-slate-500 mt-3">No donors found for this NGO yet.</p>
                  )}
                </div>

                <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-700">Donation History</h3>
                    <span className="text-xs text-slate-500">{donationRows.length} records</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="text-left py-2 pr-3 font-semibold">Date</th>
                          <th className="text-left py-2 pr-3 font-semibold">Donor</th>
                          <th className="text-left py-2 pr-3 font-semibold">Campaign</th>
                          <th className="text-left py-2 pr-3 font-semibold">Type</th>
                          <th className="text-left py-2 pr-3 font-semibold">Amount</th>
                          <th className="text-left py-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donationRows.map((donation) => {
                          const donationId = donation?.id
                            || donation?.donation_id
                            || donation?.transaction_id
                            || `${donation?.date || 'unknown'}-${donation?.amount || 0}-${donation?.donor_email || donation?.donor_name || 'donor'}`;
                          return (
                            <tr key={donationId} className="border-b border-slate-100">
                              <td className="py-2 pr-3 text-slate-600">
                                {donation?.date ? new Date(donation.date).toLocaleDateString('en-US') : '-'}
                              </td>
                              <td className="py-2 pr-3">
                                <p className="font-semibold text-slate-700">{donation?.donor_name || donation?.donorName || 'Anonymous'}</p>
                                <p className="text-xs text-slate-500">{donation?.donor_email || donation?.donorEmail || ''}</p>
                              </td>
                              <td className="py-2 pr-3 text-slate-700">{donation?.campaign || donation?.campaign_name || 'Campaign'}</td>
                              <td className="py-2 pr-3 text-slate-700">{formatDonationTypeLabel(donation?.type || donation?.donation_type)}</td>
                              <td className="py-2 pr-3 text-slate-700">{formatCurrency(donation?.amount || 0)}</td>
                              <td className="py-2">
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${paymentStatusClass(donation?.payment_status || donation?.status)}`}>
                                  {formatPaymentStatusLabel(donation?.payment_status || donation?.status)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {!donationRows.length && (
                    <p className="text-sm text-slate-500 mt-3">No donation history available for this NGO yet.</p>
                  )}
                </div>
              </>
            ) : activeMenu === 'urgent_needs' ? (
              <>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Total Alerts</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(urgentRows.length)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Homepage Active</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{formatNumber(activeUrgentCount)}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <p className="text-sm font-semibold text-slate-500">Currently Editing</p>
                    <p className="mt-1 text-3xl font-bold text-[#284463]">{editingUrgentId ? `#${editingUrgentId}` : 'New'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-1 rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">
                        {editingUrgentId ? 'Edit Alert' : 'Create Alert'}
                      </h3>
                      {editingUrgentId ? (
                        <button
                          type="button"
                          onClick={resetUrgentForm}
                          className="text-xs px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          New
                        </button>
                      ) : null}
                    </div>

                    <form onSubmit={handleUrgentNeedSubmit} className="space-y-3">
                      <input
                        value={urgentForm.title}
                        onChange={(event) => handleUrgentFormField('title', event.target.value)}
                        placeholder="Title (e.g., Food shortage in Zone 3)"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        required
                      />
                      <textarea
                        value={urgentForm.message}
                        onChange={(event) => handleUrgentFormField('message', event.target.value)}
                        placeholder="Urgent message"
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-500 resize-none focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                        required
                      />
                      <div className="grid grid-cols-1 gap-3">
                        <label className="text-xs font-semibold text-slate-500">
                          Start Time
                          <input
                            type="datetime-local"
                            value={urgentForm.startTime}
                            onChange={(event) => handleUrgentFormField('startTime', event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-500">
                          End Time
                          <input
                            type="datetime-local"
                            value={urgentForm.endTime}
                            onChange={(event) => handleUrgentFormField('endTime', event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#244f81] focus:outline-none focus:ring-2 focus:ring-[#244f81]/20"
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={urgentSubmitting}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#244f81] text-white px-3 py-2 text-sm font-semibold disabled:opacity-60"
                      >
                        <FiAlertTriangle className="h-4 w-4" />
                        {urgentSubmitting ? 'Saving...' : editingUrgentId ? 'Update Alert' : 'Create Alert'}
                      </button>
                    </form>
                  </div>

                  <div className="xl:col-span-2 rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-700">My Urgent Alerts</h3>
                      <span className="text-xs text-slate-500">{urgentRows.length} alerts</span>
                    </div>

                    <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
                      {urgentRows.map((item) => (
                        <div key={item.urgent_id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">{item.title || 'Urgent Alert'}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.message || 'No message provided.'}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                Status: {String(item.urgent_status || 'APPROVED').toUpperCase()} •
                                Start: {item.start_time ? new Date(item.start_time).toLocaleString('en-US') : ' Immediate'} •
                                End: {item.end_time ? ` ${new Date(item.end_time).toLocaleString('en-US')}` : ' Not set'}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditingUrgentNeed(item)}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                              >
                                <FiEdit2 className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUrgentNeed(item.urgent_id)}
                                className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {!urgentRows.length && (
                        <p className="text-sm text-slate-500">No urgent alerts yet. Create one to show it on homepage.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-semibold text-slate-500">Total Donations received</p>
                <p className="mt-1 text-4xl font-bold text-[#284463]">{formatCurrency(totalDonations)}</p>
              </div>
              <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-semibold text-slate-500">Active Campaigns</p>
                <p className="mt-1 text-4xl font-bold text-[#284463]">{formatNumber(activeProjects)}</p>
              </div>
              <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-semibold text-slate-500">Pending Pickup Requests</p>
                <p className="mt-1 text-4xl font-bold text-[#284463]">{formatNumber(pendingPickupRequests)}</p>
              </div>
              <div className="rounded-xl border border-[#d9e1eb] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <p className="text-sm font-semibold text-slate-500">Volunteer tasks summary</p>
                <p className="mt-1 text-2xl font-bold text-[#284463]">
                  {formatNumber(volunteerTaskSummary.completed)} Completed
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {formatNumber(volunteerTaskSummary.pending)} Pending • {formatNumber(volunteersCount)} Volunteers
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 rounded-xl border border-[#d9e1eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h3 className="text-xl font-bold text-slate-700">Donation Overview</h3>
                  <FiMoreHorizontal className="w-4 h-4 text-slate-400" />
                </div>
                <div className="h-[255px] px-3 py-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7edf3" />
                      <XAxis dataKey="month" hide />
                      <YAxis
                        stroke="#94a3b8"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: '1px solid #dbe3ec',
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Bar dataKey="donations" fill="#5fa8e8" radius={[6, 6, 0, 0]} />
                      <Line type="monotone" dataKey="trend" stroke="#4f9c5a" strokeWidth={3} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-5 rounded-sm bg-[#4f9c5a]" />
                    Donation Trend
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-5 rounded-sm bg-[#5fa8e8]" />
                    Monthly Donations
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[#d9e1eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-700">Active Projects</h3>
                  <FiMoreHorizontal className="w-4 h-4 text-slate-400" />
                </div>
                <div className="p-4 space-y-4">
                  {projectRows.map((project, index) => (
                    <div key={project.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <FiMapPin className={`w-4 h-4 shrink-0 ${index === 1 ? 'text-amber-500' : index === 2 ? 'text-green-500' : 'text-[#2f7ec8]'}`} />
                          <p className="font-semibold text-slate-700 truncate">{project.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${progressLabelClass(project.status)}`}>
                            {formatStatus(project.status)}
                          </span>
                          <FiChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full rounded-full bg-[#56b35e]" style={{ width: `${project.fundedPercent}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Target: {formatCurrency(project.target)}</span>
                        <span>{project.fundedPercent}% Funded</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#d9e1eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-700">Recent Activity</h3>
                  <FiMoreHorizontal className="w-4 h-4 text-slate-400" />
                </div>
                <div className="p-4 space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <MiniAvatar name={activity.type === 'donation' ? 'Donation' : 'Pickup'} index={index} />
                        <p className="truncate font-semibold text-slate-700">{activity.text}</p>
                      </div>
                      <p className="font-semibold text-xs text-slate-500">
                        {activity.when ? new Date(activity.when).toLocaleDateString('en-US') : 'Just now'}
                      </p>
                    </div>
                  ))}
                  {!recentActivity.length && (
                    <p className="text-sm text-slate-500">No recent activity yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#d9e1eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-700">Top Donors</h3>
                  <FiMoreHorizontal className="w-4 h-4 text-slate-400" />
                </div>
                <div className="p-4 space-y-3">
                  {topDonors.map((donor) => (
                    <div key={donor.donor} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0">
                      <p className="font-semibold text-slate-700">{donor.donor}</p>
                      <p className="font-bold text-slate-800">{formatCurrency(donor.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#d9e1eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-700">Task Progress</h3>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-3 gap-4">
                  {progressRings.map((ring) => (
                    <ProgressRing key={ring.label} value={ring.value} color={ring.color} label={ring.label} />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-1">
              <div className="rounded-xl border border-[#d9e1eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-700">Volunteer Activity</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                        <FiUsers className="h-4 w-4" />
                      </span>
                      <p className="text-slate-600 font-semibold">New Volunteers</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-slate-800">{formatNumber(volunteerActivity.newVolunteers)}</p>
                      <p className="text-xs text-slate-400">This Week</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <FiClock className="h-4 w-4" />
                      </span>
                      <p className="text-slate-600 font-semibold">Hours Logged</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-slate-800">{formatNumber(volunteerActivity.hoursLogged)}</p>
                      <p className="text-xs text-slate-400">Hours</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#d9e1eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-700">Impact Metrics</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <MiniAvatar name="Children Educated" index={0} />
                      <p className="truncate text-slate-600 font-semibold">Children Educated</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{formatNumber(impactMetrics.childrenEducated)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <MiniAvatar name="Families Supported" index={1} />
                      <p className="truncate text-slate-600 font-semibold">Families Supported</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{formatNumber(impactMetrics.familiesSupported)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <MiniAvatar name="Water Wells Built" index={2} />
                      <p className="truncate text-slate-600 font-semibold">Water Wells Built</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">{formatNumber(impactMetrics.waterWellsBuilt)}</p>
                  </div>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default NGOAdminDashboard;
