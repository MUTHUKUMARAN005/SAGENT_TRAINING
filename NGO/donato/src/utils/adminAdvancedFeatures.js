import { MOCK_CAMPAIGNS, MOCK_DONATION_HISTORY } from './constants';

const WORKFLOW_STORAGE_KEY = 'kindwave_campaign_workflow_v1';
const ASSIGNMENTS_STORAGE_KEY = 'kindwave_bulk_assignments_v1';

const DEFAULT_PENDING_SUBMISSIONS = [
  {
    id: 'wf-101',
    title: 'Solar Light Kits for Rural Students',
    category: 'education',
    targetAmount: 450000,
    summary:
      'Provide solar study lamps to students in villages with unreliable electricity.',
    beneficiaries: 1200,
    requestedBy: 'Sunrise Learning Trust',
    requestedByEmail: 'ngo@sunrise-learning.org',
    requestedAt: '2026-03-10T09:00:00.000Z',
    status: 'pending',
    reviewNote: '',
    reviewedBy: '',
    reviewedAt: '',
  },
  {
    id: 'wf-102',
    title: 'Emergency Hygiene Kits for Flood Zones',
    category: 'disaster_relief',
    targetAmount: 800000,
    summary:
      'Rapid distribution of hygiene kits and sanitation supplies to flood-affected families.',
    beneficiaries: 3500,
    requestedBy: 'Rapid Relief India',
    requestedByEmail: 'ops@rapidrelief.org',
    requestedAt: '2026-03-12T07:20:00.000Z',
    status: 'pending',
    reviewNote: '',
    reviewedBy: '',
    reviewedAt: '',
  },
];

export const VOLUNTEER_POOL = [
  { id: 'vol-1', name: 'Aarav Kumar', city: 'Mumbai', skills: ['pickup', 'distribution'] },
  { id: 'vol-2', name: 'Priya Sharma', city: 'Delhi', skills: ['field_audit', 'coordination'] },
  { id: 'vol-3', name: 'Vikram Singh', city: 'Bangalore', skills: ['logistics', 'pickup'] },
  { id: 'vol-4', name: 'Neha Iyer', city: 'Chennai', skills: ['community', 'documentation'] },
  { id: 'vol-5', name: 'Rohan Das', city: 'Kolkata', skills: ['distribution', 'support'] },
  { id: 'vol-6', name: 'Kavya Nair', city: 'Hyderabad', skills: ['coordination', 'verification'] },
];

const safeLocalStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
};

const readJson = (key, fallbackValue) => {
  const storage = safeLocalStorage();
  if (!storage) return fallbackValue;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const writeJson = (key, value) => {
  const storage = safeLocalStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
};

const emitUpdateEvent = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('kindwave-admin-data-updated'));
};

const money = (value) => Number(value || 0);

const seedWorkflowIfNeeded = () => {
  const existing = readJson(WORKFLOW_STORAGE_KEY, null);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  writeJson(WORKFLOW_STORAGE_KEY, DEFAULT_PENDING_SUBMISSIONS);
  return DEFAULT_PENDING_SUBMISSIONS;
};

export const getCampaignWorkflowItems = () => {
  const seeded = seedWorkflowIfNeeded();
  return [...seeded].sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );
};

export const submitCampaignForApproval = (payload) => {
  const workflow = getCampaignWorkflowItems();
  const newItem = {
    id: `wf-${Date.now()}`,
    title: String(payload?.title || '').trim(),
    category: String(payload?.category || 'other').trim(),
    targetAmount: money(payload?.targetAmount),
    summary: String(payload?.summary || '').trim(),
    beneficiaries: Number(payload?.beneficiaries || 0),
    requestedBy: String(payload?.requestedBy || 'NGO').trim(),
    requestedByEmail: String(payload?.requestedByEmail || '').trim(),
    requestedAt: new Date().toISOString(),
    status: 'pending',
    reviewNote: '',
    reviewedBy: '',
    reviewedAt: '',
  };

  const updated = [newItem, ...workflow];
  writeJson(WORKFLOW_STORAGE_KEY, updated);
  emitUpdateEvent();
  return newItem;
};

export const reviewCampaignSubmission = ({ id, action, reviewNote, reviewedBy }) => {
  const workflow = getCampaignWorkflowItems();
  const targetStatus = action === 'approve' ? 'approved' : 'rejected';

  const updated = workflow.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      status: targetStatus,
      reviewedBy: String(reviewedBy || 'Admin').trim(),
      reviewedAt: new Date().toISOString(),
      reviewNote: String(reviewNote || '').trim(),
    };
  });

  writeJson(WORKFLOW_STORAGE_KEY, updated);
  emitUpdateEvent();
  return updated.find((item) => item.id === id);
};

export const getBulkAssignments = () => {
  return readJson(ASSIGNMENTS_STORAGE_KEY, []);
};

export const assignTasksToVolunteers = (payload) => {
  const assignments = getBulkAssignments();
  const selectedVolunteers = VOLUNTEER_POOL.filter((volunteer) =>
    (payload?.volunteerIds || []).includes(volunteer.id)
  );

  if (!selectedVolunteers.length) return null;

  const newAssignments = selectedVolunteers.map((volunteer) => ({
    id: `assign-${Date.now()}-${volunteer.id}`,
    volunteerId: volunteer.id,
    volunteerName: volunteer.name,
    campaignId: String(payload?.campaignId || ''),
    campaignTitle: String(payload?.campaignTitle || 'General Operations').trim(),
    taskTitle: String(payload?.taskTitle || '').trim(),
    priority: String(payload?.priority || 'medium').trim(),
    dueDate: String(payload?.dueDate || '').trim(),
    assignedAt: new Date().toISOString(),
    status: 'assigned',
  }));

  const updated = [...newAssignments, ...assignments];
  writeJson(ASSIGNMENTS_STORAGE_KEY, updated);
  emitUpdateEvent();
  return newAssignments;
};

const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });

export const getSmartDashboardData = () => {
  const workflow = getCampaignWorkflowItems();
  const assignments = getBulkAssignments();

  const today = new Date();
  const dailyDonations = Array.from({ length: 7 }).map((_, offset) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - offset));
    const base = MOCK_DONATION_HISTORY.reduce((sum, donation) => sum + donation.amount, 0);
    const drift = (offset + 1) * 2300;
    const assignmentBoost = assignments.length * 120;
    return {
      day: day.toLocaleDateString('en-IN', { weekday: 'short' }),
      amount: Math.max(8000, Math.round(base / 7 + drift + assignmentBoost)),
      dateLabel: formatShortDate(day.toISOString()),
    };
  });

  const volunteerPerformance = VOLUNTEER_POOL.map((volunteer) => {
    const assigned = assignments.filter((item) => item.volunteerId === volunteer.id).length;
    const completed = Math.max(0, assigned - (assigned > 1 ? 1 : 0));
    const completionRate = assigned ? Math.round((completed / assigned) * 100) : 0;
    return {
      name: volunteer.name.split(' ')[0],
      assigned,
      completed,
      completionRate,
    };
  });

  const approved = workflow.filter((item) => item.status === 'approved').length;
  const rejected = workflow.filter((item) => item.status === 'rejected').length;
  const pending = workflow.filter((item) => item.status === 'pending').length;
  const reviewed = approved + rejected;
  const successRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;

  const campaignSuccess = [
    { name: 'Approved', value: approved, fill: '#22c55e' },
    { name: 'Rejected', value: rejected, fill: '#ef4444' },
    { name: 'Pending', value: pending, fill: '#f59e0b' },
  ];

  return {
    dailyDonations,
    volunteerPerformance,
    campaignSuccess,
    successRate,
    approved,
    rejected,
    pending,
  };
};

export const getFraudMonitoringAlerts = () => {
  const donationEvents = MOCK_DONATION_HISTORY.map((item, index) => ({
    id: `event-${item.id}`,
    donorRef: `donor-${(index % 3) + 1}`,
    amount: Number(item.amount),
    paymentMethod: item.payment_method,
    transactionId: item.transaction_id,
    timestamp: new Date(`${item.date}T10:${String(10 + index).padStart(2, '0')}:00.000Z`),
  }));

  donationEvents.push(
    {
      id: 'event-extra-1',
      donorRef: 'donor-2',
      amount: 75000,
      paymentMethod: 'upi',
      transactionId: 'TXN-RISK-1',
      timestamp: new Date('2026-03-14T12:20:00.000Z'),
    },
    {
      id: 'event-extra-2',
      donorRef: 'donor-2',
      amount: 75000,
      paymentMethod: 'upi',
      transactionId: 'TXN-RISK-1',
      timestamp: new Date('2026-03-14T12:25:00.000Z'),
    }
  );

  const alerts = [];

  donationEvents.forEach((event) => {
    if (event.amount >= 50000) {
      alerts.push({
        id: `${event.id}-high-amount`,
        severity: 'high',
        title: 'High-value donation flagged',
        message: `Amount ₹${event.amount.toLocaleString('en-IN')} requires manual review.`,
        source: event.transactionId,
        timestamp: event.timestamp.toISOString(),
      });
    }
  });

  const groupedByTxn = donationEvents.reduce((acc, event) => {
    const key = event.transactionId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  Object.entries(groupedByTxn).forEach(([transactionId, group]) => {
    if (group.length > 1) {
      alerts.push({
        id: `dup-${transactionId}`,
        severity: 'critical',
        title: 'Possible duplicate transaction',
        message: `${group.length} events share transaction ID ${transactionId}.`,
        source: transactionId,
        timestamp: group[0].timestamp.toISOString(),
      });
    }
  });

  const groupedByDonor = donationEvents.reduce((acc, event) => {
    if (!acc[event.donorRef]) acc[event.donorRef] = [];
    acc[event.donorRef].push(event);
    return acc;
  }, {});

  Object.values(groupedByDonor).forEach((events) => {
    if (events.length < 3) return;
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0];
    const third = sorted[2];
    const minutes = (third.timestamp - first.timestamp) / (1000 * 60);
    if (minutes <= 30) {
      alerts.push({
        id: `rapid-${sorted[0].donorRef}`,
        severity: 'medium',
        title: 'Rapid repeat donations detected',
        message: `3+ donations from ${sorted[0].donorRef} within ${Math.round(minutes)} minutes.`,
        source: sorted[0].donorRef,
        timestamp: first.timestamp.toISOString(),
      });
    }
  });

  return alerts
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
};

export const subscribeAdminUpdates = (handler) => {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener('kindwave-admin-data-updated', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('kindwave-admin-data-updated', handler);
    window.removeEventListener('storage', handler);
  };
};

export const getCampaignChoicesForAssignment = () => {
  const approvedWorkflowCampaigns = getCampaignWorkflowItems()
    .filter((item) => item.status === 'approved')
    .map((item) => ({
      id: item.id,
      title: item.title,
    }));

  const existingCampaigns = MOCK_CAMPAIGNS.map((campaign) => ({
    id: String(campaign.campaign_id),
    title: campaign.title,
  }));

  return [...approvedWorkflowCampaigns, ...existingCampaigns];
};
