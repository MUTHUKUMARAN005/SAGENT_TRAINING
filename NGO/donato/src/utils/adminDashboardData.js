import {
  MOCK_CAMPAIGNS,
  MOCK_DONATION_HISTORY,
  MOCK_PICKUP_HISTORY,
} from './constants';
import {
  VOLUNTEER_POOL,
  getBulkAssignments,
  getCampaignWorkflowItems,
  reviewCampaignSubmission,
} from './adminAdvancedFeatures';

const ADMIN_DASHBOARD_EVENT = 'kindwave-admin-data-updated';

const STORAGE_KEYS = {
  campaigns: 'kindwave_admin_managed_campaigns_v1',
  donations: 'kindwave_admin_donations_v1',
  users: 'kindwave_admin_users_v1',
  volunteers: 'kindwave_admin_volunteers_v1',
  pickups: 'kindwave_admin_pickups_v1',
  banners: 'kindwave_admin_banners_v1',
};

const money = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toSlug = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;

const readStorage = (key, fallbackValue) => {
  if (typeof window === 'undefined' || !window.localStorage) return fallbackValue;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const writeStorage = (key, value) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const emitUpdate = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ADMIN_DASHBOARD_EVENT));
};

const buildDefaultCampaigns = () => [
  ...MOCK_CAMPAIGNS.map((campaign, index) => ({
    id: `campaign-${campaign.campaign_id}`,
    title: campaign.title,
    ngoName: campaign.ngo_name,
    ngoEmail: `ngo${campaign.ngo_id}@kindwave.org`,
    type: campaign.donation_type,
    city: campaign.city,
    targetAmount: money(campaign.target_amount),
    collectedAmount: money(campaign.collected_amount),
    donorCount: money(campaign.donors_count),
    status: campaign.campaign_status === 'active'
      ? index % 4 === 0
        ? 'paused'
        : 'active'
      : campaign.campaign_status,
    approvalStatus: 'approved',
    startDate: campaign.start_date,
    endDate: campaign.end_date,
    priority: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low',
    beneficiaries: 250 + index * 75,
    createdAt: campaign.start_date,
  })),
  {
    id: 'campaign-health-kits',
    title: 'Nutrition Kits for Senior Citizens',
    ngoName: 'Silver Care Collective',
    ngoEmail: 'support@silvercare.org',
    type: 'food',
    city: 'Pune',
    targetAmount: 350000,
    collectedAmount: 132000,
    donorCount: 84,
    status: 'active',
    approvalStatus: 'approved',
    startDate: '2026-01-20',
    endDate: '2026-06-30',
    priority: 'high',
    beneficiaries: 900,
    createdAt: '2026-01-16',
  },
  {
    id: 'campaign-learning-hubs',
    title: 'Community Learning Hubs',
    ngoName: 'Bright Futures Network',
    ngoEmail: 'admin@brightfutures.org',
    type: 'books',
    city: 'Lucknow',
    targetAmount: 640000,
    collectedAmount: 418000,
    donorCount: 166,
    status: 'active',
    approvalStatus: 'approved',
    startDate: '2025-11-01',
    endDate: '2026-08-31',
    priority: 'medium',
    beneficiaries: 1400,
    createdAt: '2025-10-24',
  },
];

const buildDefaultDonations = () => [
  ...MOCK_DONATION_HISTORY.map((donation, index) => ({
    id: `donation-${donation.id}`,
    donorName: ['Aarohi Shah', 'Rahul Mehta', 'Sneha Iyer', 'Kunal Das', 'Neeraj Singh'][index] || `Donor ${index + 1}`,
    donorEmail: `donor${index + 1}@kindwave.org`,
    campaign: donation.campaign,
    ngoName: donation.ngo_name,
    amount: money(donation.amount),
    quantityLabel: donation.type === 'money' ? '1 contribution' : '1 pickup lot',
    type: donation.type,
    paymentMethod: donation.payment_method,
    paymentStatus: donation.status === 'completed' ? 'paid' : 'pending',
    status: donation.status,
    receiptNumber: donation.receipt_number,
    transactionId: donation.transaction_id,
    donatedAt: donation.date,
  })),
  {
    id: 'donation-6',
    donorName: 'Pooja Nair',
    donorEmail: 'pooja.nair@kindwave.org',
    campaign: 'Community Learning Hubs',
    ngoName: 'Bright Futures Network',
    amount: 18000,
    quantityLabel: '18 book kits',
    type: 'books',
    paymentMethod: 'pickup',
    paymentStatus: 'scheduled',
    status: 'scheduled',
    receiptNumber: 'REC-2026021802',
    transactionId: 'PKP-BOOK-8842',
    donatedAt: '2026-02-18',
  },
  {
    id: 'donation-7',
    donorName: 'Vivek Arora',
    donorEmail: 'vivek.arora@kindwave.org',
    campaign: 'Nutrition Kits for Senior Citizens',
    ngoName: 'Silver Care Collective',
    amount: 26000,
    quantityLabel: '52 meal hampers',
    type: 'food',
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    status: 'completed',
    receiptNumber: 'REC-2026012904',
    transactionId: 'TXN-FOOD-5521',
    donatedAt: '2026-01-29',
  },
  {
    id: 'donation-8',
    donorName: 'Mansi Kulkarni',
    donorEmail: 'mansi.k@kindwave.org',
    campaign: 'Emergency Hygiene Kits for Flood Zones',
    ngoName: 'Rapid Relief India',
    amount: 42000,
    quantityLabel: '150 hygiene kits',
    type: 'other',
    paymentMethod: 'bank',
    paymentStatus: 'processing',
    status: 'processing',
    receiptNumber: 'REC-2026031207',
    transactionId: 'TXN-RELIEF-9132',
    donatedAt: '2026-03-12',
  },
  {
    id: 'donation-9',
    donorName: 'Aditya Rao',
    donorEmail: 'aditya.rao@kindwave.org',
    campaign: 'Solar Light Kits for Rural Students',
    ngoName: 'Sunrise Learning Trust',
    amount: 33000,
    quantityLabel: '110 solar units',
    type: 'other',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    status: 'completed',
    receiptNumber: 'REC-2026031508',
    transactionId: 'TXN-SOLAR-3091',
    donatedAt: '2026-03-15',
  },
];

const buildDefaultUsers = () => [
  {
    id: 'user-admin-1',
    name: 'Platform Admin',
    email: 'admin@kindwave.org',
    role: 'admin',
    status: 'active',
    city: 'Mumbai',
    joinedAt: '2025-01-10',
    lastSeenAt: '2026-03-17T09:10:00.000Z',
    donationsCount: 0,
    totalDonated: 0,
  },
  {
    id: 'user-donor-1',
    name: 'Aarohi Shah',
    email: 'aarohi.shah@kindwave.org',
    phone: '+91 98765 43210',
    address: 'Bandra West, Mumbai',
    role: 'donor',
    status: 'active',
    city: 'Mumbai',
    joinedAt: '2025-09-12',
    lastSeenAt: '2026-03-17T08:25:00.000Z',
    donationsCount: 8,
    totalDonated: 98000,
  },
  {
    id: 'user-donor-2',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@kindwave.org',
    phone: '+91 98111 22334',
    address: 'Dwarka Sector 10, Delhi',
    role: 'donor',
    status: 'blocked',
    city: 'Delhi',
    joinedAt: '2025-07-04',
    lastSeenAt: '2026-03-16T15:40:00.000Z',
    donationsCount: 4,
    totalDonated: 22000,
  },
  {
    id: 'user-donor-3',
    name: 'Pooja Nair',
    email: 'pooja.nair@kindwave.org',
    phone: '+91 99000 77889',
    address: 'Indiranagar, Bangalore',
    role: 'donor',
    status: 'active',
    city: 'Bangalore',
    joinedAt: '2025-11-21',
    lastSeenAt: '2026-03-17T06:55:00.000Z',
    donationsCount: 6,
    totalDonated: 74000,
  },
  {
    id: 'user-vol-1',
    name: 'Aarav Kumar',
    email: 'aarav.kumar@kindwave.org',
    role: 'volunteer',
    status: 'active',
    city: 'Mumbai',
    joinedAt: '2025-06-01',
    lastSeenAt: '2026-03-17T08:40:00.000Z',
    completedTasks: 34,
  },
  {
    id: 'user-vol-2',
    name: 'Priya Sharma',
    email: 'priya.sharma@kindwave.org',
    role: 'volunteer',
    status: 'active',
    city: 'Delhi',
    joinedAt: '2025-05-11',
    lastSeenAt: '2026-03-16T19:00:00.000Z',
    completedTasks: 29,
  },
  {
    id: 'user-vol-3',
    name: 'Neha Iyer',
    email: 'neha.iyer@kindwave.org',
    role: 'volunteer',
    status: 'active',
    city: 'Chennai',
    joinedAt: '2025-08-15',
    lastSeenAt: '2026-03-17T07:15:00.000Z',
    completedTasks: 22,
  },
  {
    id: 'user-ngo-1',
    name: 'Bright Futures Network',
    email: 'admin@brightfutures.org',
    role: 'ngo',
    status: 'active',
    city: 'Lucknow',
    joinedAt: '2025-03-20',
    lastSeenAt: '2026-03-16T17:10:00.000Z',
    activeCampaigns: 3,
  },
];

const buildDefaultVolunteers = () =>
  VOLUNTEER_POOL.map((volunteer, index) => ({
    id: volunteer.id,
    name: volunteer.name,
    email: `${toSlug(volunteer.name)}@kindwave.org`,
    city: volunteer.city,
    skills: volunteer.skills,
    rating: 4.5 + (index % 3) * 0.1,
    completionRate: 84 + index * 2,
    assignedTasks: 6 + index,
    completedTasks: 5 + index,
    nextShift: ['Today • 2:00 PM - 6:00 PM', 'Tomorrow • 9:00 AM - 1:00 PM', 'Today • 10:00 AM - 2:00 PM'][index % 3],
    availability: index % 2 === 0 ? 'available' : 'busy',
    tasks: [
      {
        id: `task-${volunteer.id}-1`,
        title: index % 2 === 0 ? 'Pickup verification' : 'Distribution support',
        campaignTitle: index % 2 === 0 ? 'Food for the Hungry' : 'Community Learning Hubs',
        dueDate: '2026-03-18',
        shift: index % 2 === 0 ? 'Morning' : 'Evening',
        priority: index % 3 === 0 ? 'high' : 'medium',
        status: index % 2 === 0 ? 'assigned' : 'in_progress',
      },
    ],
  }));

const buildDefaultPickups = () => [
  ...MOCK_PICKUP_HISTORY.map((pickup, index) => ({
    id: `pickup-${index + 1}`,
    donorName: index === 0 ? 'Maya Desai' : 'Harsh Vardhan',
    donorPhone: index === 0 ? '+91 9876543210' : '+91 9988776655',
    address: pickup.address,
    items: pickup.items,
    requestedAt: pickup.date,
    scheduledFor: pickup.date,
    timeSlot: pickup.time_slot,
    status: pickup.status === 'scheduled' ? 'scheduled' : pickup.status,
    volunteerId: index === 0 ? 'vol-1' : '',
    volunteerName: pickup.volunteer_name === 'Pending Assignment' ? '' : pickup.volunteer_name,
    notes: index === 0 ? 'Packed in 4 labeled bags' : 'Call before arrival',
    donorLatitude: index === 0 ? 19.1366 : 19.0607,
    donorLongitude: index === 0 ? 72.8268 : 72.8429,
    locationStatus:
      pickup.status === 'completed'
        ? 'Pickup completed at donor location'
        : pickup.status === 'scheduled'
          ? 'Volunteer en route to donor location'
          : 'Awaiting volunteer assignment',
    locationUpdatedAt: index === 0 ? '2026-03-17T09:40:00.000Z' : '2026-03-17T08:10:00.000Z',
  })),
  {
    id: 'pickup-3',
    donorName: 'Anita Sharma',
    donorPhone: '+91 9123456789',
    address: 'Andheri West, Mumbai',
    items: ['food', 'clothes'],
    requestedAt: '2026-03-14',
    scheduledFor: '2026-03-18',
    timeSlot: '11:00 AM - 1:00 PM',
    status: 'scheduled',
    volunteerId: 'vol-1',
    volunteerName: 'Aarav Kumar',
    notes: 'Apartment security gate pass available',
    donorLatitude: 19.1197,
    donorLongitude: 72.8464,
    locationStatus: 'Volunteer assigned. Pickup route confirmed.',
    locationUpdatedAt: '2026-03-17T10:25:00.000Z',
  },
  {
    id: 'pickup-4',
    donorName: 'Ritika Sen',
    donorPhone: '+91 9011223344',
    address: 'Salt Lake, Kolkata',
    items: ['books', 'toys'],
    requestedAt: '2026-03-15',
    scheduledFor: '2026-03-19',
    timeSlot: '2:00 PM - 4:00 PM',
    status: 'pending',
    volunteerId: '',
    volunteerName: '',
    notes: 'Donation kept at reception desk',
    donorLatitude: 22.5867,
    donorLongitude: 88.4172,
    locationStatus: 'Awaiting volunteer assignment',
    locationUpdatedAt: '2026-03-17T07:45:00.000Z',
  },
];

const buildDefaultBanners = () => [
  {
    id: 'banner-1',
    title: 'Urgent: Flood Relief Supplies Needed',
    message: 'High demand for ready-to-eat food packets, blankets, and first-aid kits in Assam relief zones.',
    category: 'food',
    notificationType: '',
    deliveryChannel: 'in_app',
    sendEmail: false,
    emailStatus: 'not_requested',
    emailSubject: '',
    emailRecipients: [],
    origin: 'alerts',
    severity: 'critical',
    audience: 'all',
    status: 'active',
    createdAt: '2026-03-16T09:30:00.000Z',
    expiresAt: '2026-03-25',
  },
  {
    id: 'banner-2',
    title: 'Volunteer Slots Open for Weekend Pickups',
    message: 'Need 12 volunteers across Mumbai and Pune for Saturday donation pickups.',
    category: 'clothes',
    notificationType: '',
    deliveryChannel: 'in_app',
    sendEmail: false,
    emailStatus: 'not_requested',
    emailSubject: '',
    emailRecipients: [],
    origin: 'alerts',
    severity: 'high',
    audience: 'volunteers',
    status: 'active',
    createdAt: '2026-03-15T11:00:00.000Z',
    expiresAt: '2026-03-22',
  },
];

const ensureCollection = (key, factory) => {
  const current = readStorage(key, null);
  if (Array.isArray(current) && current.length) return current;
  const seeded = factory();
  writeStorage(key, seeded);
  return seeded;
};

const getAdminManagedCampaigns = () =>
  ensureCollection(STORAGE_KEYS.campaigns, buildDefaultCampaigns);

const getAdminDonationRecords = () =>
  ensureCollection(STORAGE_KEYS.donations, buildDefaultDonations);

const getAdminUsers = () => ensureCollection(STORAGE_KEYS.users, buildDefaultUsers);

const getAdminVolunteerProfiles = () =>
  ensureCollection(STORAGE_KEYS.volunteers, buildDefaultVolunteers);

const getAdminPickupRequests = () =>
  ensureCollection(STORAGE_KEYS.pickups, buildDefaultPickups);

const getAdminBanners = () => ensureCollection(STORAGE_KEYS.banners, buildDefaultBanners);

const saveCollection = (key, value) => {
  writeStorage(key, value);
  emitUpdate();
  return value;
};

const buildMonthSeries = (donations) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date('2026-03-17T00:00:00.000Z');

  const months = Array.from({ length: 6 }).map((_, index) => {
    const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
    const key = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}`;
    return {
      key,
      month: monthNames[current.getUTCMonth()],
      donations: 0,
    };
  });

  donations.forEach((donation) => {
    const date = new Date(`${donation.donatedAt}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const target = months.find((item) => item.key === key);
    if (target) {
      target.donations += money(donation.amount);
    }
  });

  return months;
};

const buildReceiptNumber = () => {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = String(Date.now()).slice(-6);
  return `REC-${stamp}-${suffix}`;
};

const normalizePickupLifecycleStatus = (value, fallback = 'pending') => {
  const normalized = String(value || fallback).trim().toLowerCase();
  if (['assigned', 'in_progress'].includes(normalized)) return 'scheduled';
  if (['pending', 'scheduled', 'completed'].includes(normalized)) return normalized;
  return fallback;
};

const pickupTaskIdFromPickup = (pickupId) => `task-pickup-${pickupId}`;

const createPickupVolunteerTask = (pickup = {}) => ({
  id: pickupTaskIdFromPickup(pickup.id),
  title: `Pickup Request - ${pickup.donorName || 'Donor'}`,
  campaignTitle: 'Pickup Operations',
  dueDate: String(pickup.scheduledFor || '').trim(),
  shift: String(pickup.timeSlot || 'Pickup Window').trim(),
  priority: 'high',
  status: 'assigned',
  pickupId: pickup.id,
  location: pickup.address || '',
});

const getAdminDashboardSnapshot = () => {
  const campaigns = getAdminManagedCampaigns();
  const donations = getAdminDonationRecords();
  const users = getAdminUsers();
  const volunteers = getAdminVolunteerProfiles();
  const pickups = getAdminPickupRequests();
  const banners = getAdminBanners();
  const workflowItems = getCampaignWorkflowItems();
  const assignments = getBulkAssignments();

  const totalDonations = donations.reduce((sum, item) => sum + money(item.amount), 0);
  const activeCampaigns = campaigns.filter((item) => item.status === 'active').length;
  const pendingRequests =
    workflowItems.filter((item) => item.status === 'pending').length +
    pickups.filter((item) => ['pending', 'scheduled', 'assigned'].includes(item.status)).length;
  const volunteersCount = users.filter((item) => item.role === 'volunteer' && item.status === 'active').length;

  const donationTypeBreakdown = Object.entries(
    donations.reduce((acc, donation) => {
      acc[donation.type] = (acc[donation.type] || 0) + money(donation.amount);
      return acc;
    }, {})
  ).map(([name, value], index) => ({
    name,
    value,
    fill: ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'][index % 5],
  }));

  const paymentStatusBreakdown = Object.entries(
    donations.reduce((acc, donation) => {
      acc[donation.paymentStatus] = (acc[donation.paymentStatus] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value], index) => ({
    name,
    value,
    fill: ['#22c55e', '#f59e0b', '#ef4444', '#60a5fa'][index % 4],
  }));

  const topCampaigns = [...campaigns]
    .sort((a, b) => money(b.collectedAmount) - money(a.collectedAmount))
    .slice(0, 5);

  return {
    campaigns,
    donations,
    users,
    volunteers: volunteers.map((volunteer) => {
      const assignmentBoost = assignments.filter((item) => item.volunteerId === volunteer.id).length;
      return {
        ...volunteer,
        assignedTasks: volunteer.assignedTasks + assignmentBoost,
      };
    }),
    pickups,
    banners,
    workflowItems,
    assignments,
    stats: {
      totalDonations,
      activeCampaigns,
      pendingRequests,
      volunteersCount,
    },
    monthlyDonations: buildMonthSeries(donations),
    donationTypeBreakdown,
    paymentStatusBreakdown,
    topCampaigns,
  };
};

const createAdminCampaign = (payload = {}) => {
  const campaigns = getAdminManagedCampaigns();
  const nextCampaign = {
    id: `campaign-${toSlug(payload.title || payload.ngoName || Date.now())}-${Date.now()}`,
    title: String(payload.title || '').trim(),
    ngoName: String(payload.ngoName || '').trim() || 'Admin Created',
    ngoEmail: String(payload.ngoEmail || '').trim(),
    type: String(payload.type || 'money').trim().toLowerCase(),
    city: String(payload.city || '').trim() || 'India',
    targetAmount: money(payload.targetAmount),
    collectedAmount: money(payload.collectedAmount),
    donorCount: 0,
    status: String(payload.status || 'active').trim().toLowerCase(),
    approvalStatus: 'approved',
    startDate: String(payload.startDate || new Date().toISOString().slice(0, 10)),
    endDate: String(payload.endDate || ''),
    priority: String(payload.priority || 'medium').trim().toLowerCase(),
    beneficiaries: money(payload.beneficiaries),
    createdAt: new Date().toISOString().slice(0, 10),
  };

  return saveCollection(STORAGE_KEYS.campaigns, [nextCampaign, ...campaigns]);
};

const updateAdminDonationPaymentStatus = (donationId, paymentStatus = 'pending') => {
  const normalizedStatus = String(paymentStatus || 'pending').trim().toLowerCase() === 'confirmed'
    ? 'confirmed'
    : 'pending';

  const donations = getAdminDonationRecords().map((donation) => {
    if (donation.id !== donationId) return donation;

    const nextReceiptNumber =
      normalizedStatus === 'confirmed' && donation.type === 'money'
        ? donation.receiptNumber || buildReceiptNumber()
        : donation.receiptNumber;

    return {
      ...donation,
      paymentStatus: normalizedStatus,
      status: normalizedStatus === 'confirmed' ? 'completed' : 'pending',
      receiptNumber: nextReceiptNumber,
    };
  });

  return saveCollection(STORAGE_KEYS.donations, donations);
};

const generateAdminDonationReceipt = (donationId) => {
  const donations = getAdminDonationRecords().map((donation) => {
    if (donation.id !== donationId) return donation;

    if (donation.type !== 'money') {
      return donation;
    }

    return {
      ...donation,
      paymentStatus: 'confirmed',
      status: 'completed',
      receiptNumber: donation.receiptNumber || buildReceiptNumber(),
    };
  });

  return saveCollection(STORAGE_KEYS.donations, donations);
};

const updateAdminCampaignStatus = (campaignId, status) => {
  const campaigns = getAdminManagedCampaigns().map((campaign) =>
    campaign.id === campaignId
      ? { ...campaign, status: String(status || 'active').trim().toLowerCase() }
      : campaign
  );

  return saveCollection(STORAGE_KEYS.campaigns, campaigns);
};

const updateAdminCampaignProgress = (campaignId, collectedAmount) => {
  const campaigns = getAdminManagedCampaigns().map((campaign) => {
    if (campaign.id !== campaignId) return campaign;
    return {
      ...campaign,
      collectedAmount: Math.max(0, money(collectedAmount, campaign.collectedAmount)),
      status:
        money(collectedAmount, campaign.collectedAmount) >= money(campaign.targetAmount)
          ? 'completed'
          : campaign.status,
    };
  });

  return saveCollection(STORAGE_KEYS.campaigns, campaigns);
};

const updateAdminCampaignDetails = (campaignId, payload = {}) => {
  const campaigns = getAdminManagedCampaigns().map((campaign) => {
    if (campaign.id !== campaignId) return campaign;

    const nextTitle = String(payload.title ?? campaign.title).trim();
    const nextCity = String(payload.city ?? campaign.city).trim();
    const nextEndDate = String(payload.endDate ?? campaign.endDate).trim();
    const nextType = String(payload.type ?? campaign.type).trim().toLowerCase();
    const nextPriority = String(payload.priority ?? campaign.priority).trim().toLowerCase();

    return {
      ...campaign,
      title: nextTitle || campaign.title,
      city: nextCity || campaign.city,
      endDate: nextEndDate || campaign.endDate,
      type: nextType || campaign.type,
      priority: nextPriority || campaign.priority,
      targetAmount: Math.max(0, money(payload.targetAmount, campaign.targetAmount)),
      status: String(payload.status || campaign.status || 'active').trim().toLowerCase(),
    };
  });

  return saveCollection(STORAGE_KEYS.campaigns, campaigns);
};

const deleteAdminCampaign = (campaignId) => {
  const campaigns = getAdminManagedCampaigns().filter((campaign) => campaign.id !== campaignId);
  return saveCollection(STORAGE_KEYS.campaigns, campaigns);
};

const reviewAdminCampaignSubmission = ({ id, action, reviewNote, reviewedBy }) => {
  const workflowItems = getCampaignWorkflowItems();
  const current = workflowItems.find((item) => item.id === id);
  const updated = reviewCampaignSubmission({ id, action, reviewNote, reviewedBy });

  if (updated && action === 'approve' && current) {
    const campaigns = getAdminManagedCampaigns();
    const exists = campaigns.some((campaign) => campaign.title === current.title && campaign.ngoName === current.requestedBy);

    if (!exists) {
      const synced = {
        id: `campaign-workflow-${toSlug(current.title)}`,
        title: current.title,
        ngoName: current.requestedBy,
        ngoEmail: current.requestedByEmail,
        type: current.category === 'disaster_relief' ? 'other' : current.category,
        city: 'India',
        targetAmount: money(current.targetAmount),
        collectedAmount: 0,
        donorCount: 0,
        status: 'active',
        approvalStatus: 'approved',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        priority: 'high',
        beneficiaries: money(current.beneficiaries),
        createdAt: new Date().toISOString().slice(0, 10),
      };
      saveCollection(STORAGE_KEYS.campaigns, [synced, ...campaigns]);
      return updated;
    }
  }

  emitUpdate();
  return updated;
};

const assignVolunteerToPickup = (pickupId, volunteerId) => {
  const currentPickups = getAdminPickupRequests();
  const currentPickup = currentPickups.find((pickup) => pickup.id === pickupId);
  if (!currentPickup) return currentPickups;

  const volunteers = getAdminVolunteerProfiles();
  const requestedVolunteerId = String(volunteerId || '').trim();
  const assignedVolunteer = volunteers.find((item) => item.id === requestedVolunteerId);
  const effectiveVolunteerId = assignedVolunteer ? requestedVolunteerId : '';
  const previousVolunteerId = String(currentPickup.volunteerId || '').trim();

  const pickups = currentPickups.map((pickup) =>
    pickup.id === pickupId
      ? {
          ...pickup,
          volunteerId: effectiveVolunteerId,
          volunteerName: assignedVolunteer?.name || '',
          status: effectiveVolunteerId ? 'scheduled' : 'pending',
          locationStatus: effectiveVolunteerId
            ? 'Volunteer assigned. Pickup task generated.'
            : 'Awaiting volunteer assignment',
          locationUpdatedAt: new Date().toISOString(),
        }
      : pickup
  );

  const updatedPickup = pickups.find((pickup) => pickup.id === pickupId);
  const pickupTaskId = pickupTaskIdFromPickup(pickupId);

  const updatedVolunteers = volunteers.map((volunteer) => {
    const tasks = Array.isArray(volunteer.tasks) ? [...volunteer.tasks] : [];
    const taskIndex = tasks.findIndex(
      (task) =>
        String(task.id || '') === pickupTaskId ||
        String(task.pickupId || '') === String(pickupId)
    );

    const isPreviousOwner =
      previousVolunteerId &&
      volunteer.id === previousVolunteerId &&
      previousVolunteerId !== effectiveVolunteerId;

    const isNextOwner = effectiveVolunteerId && volunteer.id === effectiveVolunteerId;

    if (isPreviousOwner && taskIndex >= 0) {
      tasks.splice(taskIndex, 1);
      return {
        ...volunteer,
        tasks,
        assignedTasks: Math.max(
          0,
          tasks.filter((task) => String(task.status || '').toLowerCase() !== 'completed').length
        ),
      };
    }

    if (isNextOwner && updatedPickup) {
      const nextTask = createPickupVolunteerTask(updatedPickup);
      const nextTaskIndex = tasks.findIndex(
        (task) =>
          String(task.id || '') === pickupTaskId ||
          String(task.pickupId || '') === String(pickupId)
      );

      if (nextTaskIndex >= 0) {
        tasks[nextTaskIndex] = { ...tasks[nextTaskIndex], ...nextTask };
      } else {
        tasks.unshift(nextTask);
      }

      return {
        ...volunteer,
        tasks,
        assignedTasks: Math.max(
          0,
          tasks.filter((task) => String(task.status || '').toLowerCase() !== 'completed').length
        ),
        nextShift: `${updatedPickup.scheduledFor || 'Today'} • ${updatedPickup.timeSlot || 'Pickup Window'}`,
        availability: 'busy',
      };
    }

    return volunteer;
  });

  saveCollection(STORAGE_KEYS.volunteers, updatedVolunteers);
  return saveCollection(STORAGE_KEYS.pickups, pickups);
};

const updatePickupRequestStatus = (pickupId, status) => {
  const currentPickups = getAdminPickupRequests();
  const currentPickup = currentPickups.find((pickup) => pickup.id === pickupId);
  if (!currentPickup) return currentPickups;

  const volunteers = getAdminVolunteerProfiles();
  const requestedStatus = normalizePickupLifecycleStatus(
    status,
    normalizePickupLifecycleStatus(currentPickup.status)
  );
  const hasVolunteer = Boolean(String(currentPickup.volunteerId || '').trim());
  const nextStatus = requestedStatus === 'scheduled' && !hasVolunteer ? 'pending' : requestedStatus;

  const pickups = currentPickups.map((pickup) =>
    pickup.id === pickupId
      ? {
          ...pickup,
          status: nextStatus,
          locationStatus:
            nextStatus === 'completed'
              ? 'Pickup completed at donor location'
              : nextStatus === 'scheduled'
                ? 'Volunteer en route to donor location'
                : hasVolunteer
                  ? 'Volunteer assigned. Awaiting scheduled pickup'
                  : 'Awaiting volunteer assignment',
          locationUpdatedAt: new Date().toISOString(),
        }
      : pickup
  );

  const updatedPickup = pickups.find((pickup) => pickup.id === pickupId);
  const pickupTaskId = pickupTaskIdFromPickup(pickupId);

  const updatedVolunteers = volunteers.map((volunteer) => {
    if (volunteer.id !== currentPickup.volunteerId) return volunteer;

    const tasks = Array.isArray(volunteer.tasks) ? [...volunteer.tasks] : [];
    const taskIndex = tasks.findIndex(
      (task) =>
        String(task.id || '') === pickupTaskId ||
        String(task.pickupId || '') === String(pickupId)
    );

    if (taskIndex >= 0) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...createPickupVolunteerTask(updatedPickup),
        status:
          nextStatus === 'completed'
            ? 'completed'
            : nextStatus === 'scheduled'
              ? 'in_progress'
              : 'assigned',
      };
    } else if (nextStatus !== 'pending' && updatedPickup) {
      tasks.unshift({
        ...createPickupVolunteerTask(updatedPickup),
        status: nextStatus === 'completed' ? 'completed' : 'in_progress',
      });
    }

    return {
      ...volunteer,
      tasks,
      assignedTasks: Math.max(
        0,
        tasks.filter((task) => String(task.status || '').toLowerCase() !== 'completed').length
      ),
    };
  });

  saveCollection(STORAGE_KEYS.volunteers, updatedVolunteers);
  return saveCollection(STORAGE_KEYS.pickups, pickups);
};

const toggleAdminUserStatus = (userId) => {
  const users = getAdminUsers().map((user) =>
    user.id === userId
      ? { ...user, status: user.status === 'active' ? 'blocked' : 'active' }
      : user
  );

  return saveCollection(STORAGE_KEYS.users, users);
};

const updateAdminUser = (userId, payload = {}) => {
  const users = getAdminUsers();
  const currentUser = users.find((user) => user.id === userId);
  if (!currentUser) return users;

  const hasField = (key) => Object.prototype.hasOwnProperty.call(payload, key);

  const nextName = hasField('name')
    ? String(payload.name || '').trim() || currentUser.name
    : currentUser.name;
  const nextEmail = hasField('email')
    ? String(payload.email || '').trim() || currentUser.email
    : currentUser.email;
  const nextPhone = hasField('phone')
    ? String(payload.phone || '').trim()
    : String(currentUser.phone || '');
  const nextCity = hasField('city')
    ? String(payload.city || '').trim()
    : String(currentUser.city || '');
  const nextAddress = hasField('address')
    ? String(payload.address || '').trim()
    : String(currentUser.address || '');

  const updatedUser = {
    ...currentUser,
    name: nextName,
    email: nextEmail,
    phone: nextPhone,
    city: nextCity,
    address: nextAddress,
  };

  const nextUsers = users.map((user) => (user.id === userId ? updatedUser : user));
  saveCollection(STORAGE_KEYS.users, nextUsers);

  const donorIdentityChanged =
    currentUser.role === 'donor' &&
    (updatedUser.name !== currentUser.name || updatedUser.email !== currentUser.email);

  if (donorIdentityChanged) {
    const currentEmailKey = String(currentUser.email || '').trim().toLowerCase();
    const currentNameKey = String(currentUser.name || '').trim().toLowerCase();
    const donations = getAdminDonationRecords().map((donation) => {
      const donationEmailKey = String(donation.donorEmail || '').trim().toLowerCase();
      const donationNameKey = String(donation.donorName || '').trim().toLowerCase();
      const matchesByEmail = currentEmailKey && donationEmailKey === currentEmailKey;
      const matchesByName = !currentEmailKey && currentNameKey && donationNameKey === currentNameKey;
      if (!matchesByEmail && !matchesByName) return donation;
      return {
        ...donation,
        donorName: updatedUser.name,
        donorEmail: updatedUser.email,
      };
    });
    saveCollection(STORAGE_KEYS.donations, donations);
  }

  return nextUsers;
};

const deleteAdminUser = (userId) => {
  const users = getAdminUsers();
  const targetUser = users.find((user) => user.id === userId);
  if (!targetUser || targetUser.role === 'admin') return users;

  const nextUsers = users.filter((user) => user.id !== userId);
  return saveCollection(STORAGE_KEYS.users, nextUsers);
};

const createAdminVolunteer = (payload = {}) => {
  const volunteers = getAdminVolunteerProfiles();
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  if (!name || !email) return volunteers;

  const duplicateVolunteer = volunteers.some(
    (volunteer) => String(volunteer.email || '').trim().toLowerCase() === email
  );
  if (duplicateVolunteer) return volunteers;

  const skills = (Array.isArray(payload.skills) ? payload.skills : String(payload.skills || 'General support').split(','))
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  const volunteerId = `vol-${toSlug(name)}-${Date.now()}`;
  const nextVolunteer = {
    id: volunteerId,
    name,
    email,
    city: String(payload.city || 'India').trim() || 'India',
    skills: skills.length ? skills : ['General support'],
    rating: 4.5,
    completionRate: 0,
    assignedTasks: 0,
    completedTasks: 0,
    nextShift: 'Not scheduled',
    availability: 'available',
    tasks: [],
  };

  const updatedVolunteers = saveCollection(STORAGE_KEYS.volunteers, [nextVolunteer, ...volunteers]);

  const users = getAdminUsers();
  const nextVolunteerUser = {
    id: `user-${volunteerId}`,
    name,
    email,
    role: 'volunteer',
    status: 'active',
    city: nextVolunteer.city,
    joinedAt: new Date().toISOString().slice(0, 10),
    lastSeenAt: new Date().toISOString(),
    completedTasks: 0,
  };
  saveCollection(STORAGE_KEYS.users, [nextVolunteerUser, ...users]);

  return updatedVolunteers;
};

const removeAdminVolunteer = (volunteerId) => {
  const volunteers = getAdminVolunteerProfiles();
  const targetVolunteer = volunteers.find((volunteer) => volunteer.id === volunteerId);
  if (!targetVolunteer) return volunteers;

  const updatedVolunteers = saveCollection(
    STORAGE_KEYS.volunteers,
    volunteers.filter((volunteer) => volunteer.id !== volunteerId)
  );

  const targetEmail = String(targetVolunteer.email || '').trim().toLowerCase();
  const users = getAdminUsers().filter((user) => {
    if (String(user.role || '').trim().toLowerCase() !== 'volunteer') return true;
    const sameId = user.id === `user-${volunteerId}`;
    const sameEmail = targetEmail && String(user.email || '').trim().toLowerCase() === targetEmail;
    return !sameId && !sameEmail;
  });
  saveCollection(STORAGE_KEYS.users, users);

  const pickups = getAdminPickupRequests().map((pickup) => {
    if (String(pickup.volunteerId || '').trim() !== volunteerId) return pickup;

    const pickupStatus = String(pickup.status || '').trim().toLowerCase();
    if (pickupStatus === 'completed') {
      return { ...pickup, volunteerId: '' };
    }

    return {
      ...pickup,
      volunteerId: '',
      volunteerName: '',
      status: 'pending',
      locationStatus: 'Awaiting volunteer assignment',
      locationUpdatedAt: new Date().toISOString(),
    };
  });
  saveCollection(STORAGE_KEYS.pickups, pickups);

  return updatedVolunteers;
};

const assignTaskToVolunteer = (payload = {}) => {
  const volunteers = getAdminVolunteerProfiles().map((volunteer) => {
    if (volunteer.id !== payload.volunteerId) return volunteer;

    const newTask = {
      id: `task-${volunteer.id}-${Date.now()}`,
      title: String(payload.taskTitle || '').trim(),
      campaignTitle: String(payload.campaignTitle || 'General Operations').trim(),
      dueDate: String(payload.dueDate || '').trim(),
      shift: String(payload.shift || 'Morning').trim(),
      priority: String(payload.priority || 'medium').trim().toLowerCase(),
      status: 'assigned',
    };

    return {
      ...volunteer,
      assignedTasks: volunteer.assignedTasks + 1,
      tasks: [newTask, ...volunteer.tasks],
      nextShift: `${newTask.dueDate || 'Today'} • ${newTask.shift}`,
      availability: 'busy',
    };
  });

  return saveCollection(STORAGE_KEYS.volunteers, volunteers);
};

const publishAdminBanner = (payload = {}) => {
  const banners = getAdminBanners();
  const sendEmail = Boolean(payload.sendEmail);
  const recipients = Array.isArray(payload.emailRecipients)
    ? payload.emailRecipients.map((item) => String(item || '').trim()).filter(Boolean)
    : String(payload.emailRecipients || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const nextBanner = {
    id: `banner-${Date.now()}`,
    title: String(payload.title || '').trim(),
    message: String(payload.message || '').trim(),
    category: String(payload.category || 'food').trim().toLowerCase(),
    notificationType: String(payload.notificationType || payload.type || '').trim().toLowerCase(),
    deliveryChannel: String(payload.deliveryChannel || (sendEmail ? 'in_app_email' : 'in_app')).trim().toLowerCase(),
    sendEmail,
    emailStatus: String(payload.emailStatus || (sendEmail ? 'queued' : 'not_requested')).trim().toLowerCase(),
    emailSubject: String(payload.emailSubject || payload.title || '').trim(),
    emailRecipients: recipients,
    origin: String(payload.origin || (String(payload.category || '').trim().toLowerCase() === 'notification' ? 'notifications' : 'alerts')).trim().toLowerCase(),
    severity: String(payload.severity || 'medium').trim().toLowerCase(),
    audience: String(payload.audience || 'all').trim().toLowerCase(),
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: String(payload.expiresAt || '').trim(),
  };

  return saveCollection(STORAGE_KEYS.banners, [nextBanner, ...banners]);
};

const dismissAdminBanner = (bannerId) => {
  const banners = getAdminBanners().map((banner) =>
    banner.id === bannerId ? { ...banner, status: 'archived' } : banner
  );

  return saveCollection(STORAGE_KEYS.banners, banners);
};

const adminDashboardData = {
  getAdminDashboardSnapshot,
  createAdminCampaign,
  updateAdminDonationPaymentStatus,
  generateAdminDonationReceipt,
  updateAdminCampaignDetails,
  deleteAdminCampaign,
  updateAdminCampaignStatus,
  updateAdminCampaignProgress,
  reviewAdminCampaignSubmission,
  assignVolunteerToPickup,
  updatePickupRequestStatus,
  toggleAdminUserStatus,
  updateAdminUser,
  deleteAdminUser,
  createAdminVolunteer,
  removeAdminVolunteer,
  assignTaskToVolunteer,
  publishAdminBanner,
  dismissAdminBanner,
};

export { ADMIN_DASHBOARD_EVENT };
export {
  getAdminManagedCampaigns,
  getAdminDonationRecords,
  getAdminUsers,
  getAdminVolunteerProfiles,
  getAdminPickupRequests,
  getAdminBanners,
  getAdminDashboardSnapshot,
  createAdminCampaign,
  updateAdminDonationPaymentStatus,
  generateAdminDonationReceipt,
  updateAdminCampaignDetails,
  deleteAdminCampaign,
  updateAdminCampaignStatus,
  updateAdminCampaignProgress,
  reviewAdminCampaignSubmission,
  assignVolunteerToPickup,
  updatePickupRequestStatus,
  toggleAdminUserStatus,
  updateAdminUser,
  deleteAdminUser,
  createAdminVolunteer,
  removeAdminVolunteer,
  assignTaskToVolunteer,
  publishAdminBanner,
  dismissAdminBanner,
};
export default adminDashboardData;

