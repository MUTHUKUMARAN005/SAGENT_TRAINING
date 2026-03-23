import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiBell,
  FiCalendar,
  FiCheck,
  FiDollarSign,
  FiDownload,
  FiFileText,
  FiHome,
  FiLock,
  FiMapPin,
  FiPackage,
  FiPauseCircle,
  FiPlayCircle,
  FiPlus,
  FiRefreshCw,
  FiSettings,
  FiTarget,
  FiTrash2,
  FiTruck,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import StatCard from './widgets/StatCard';
import { staggerContainer, fadeInUp } from '../../animations/variants';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { subscribeAdminUpdates } from '../../utils/adminAdvancedFeatures';
import { getDashboardPathByRole, normalizeRole, USER_ROLES } from '../../utils/roles';
import {
  assignTaskToVolunteer,
  createAdminVolunteer,
  dismissAdminBanner,
  getAdminDashboardSnapshot,
  publishAdminBanner,
  removeAdminVolunteer,
  reviewAdminCampaignSubmission,
} from '../../utils/adminDashboardData';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDonationValue = (donation = {}) => {
  const type = String(donation.type || '').trim().toLowerCase();
  if (type === 'money') {
    return {
      primary: formatCurrency(donation.amount),
      secondary: donation.quantityLabel || '1 contribution',
    };
  }

  const itemType = String(donation.itemType || '').trim();
  const itemCount = numberOr(donation.itemCount, 0);
  const fallbackLabel = String(donation.quantityLabel || '').trim() || 'In-kind donation';

  return {
    primary: itemType || fallbackLabel,
    secondary: itemCount > 0 ? `Qty: ${itemCount}` : fallbackLabel,
  };
};

const formatDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const progressPercent = (collectedAmount, targetAmount) => {
  const target = Number(targetAmount || 0);
  if (!target) return 0;
  return Math.min(100, Math.round((Number(collectedAmount || 0) / target) * 100));
};

const parseDateValue = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const raw = String(value || '').trim();
  if (!raw) return null;

  if (/^\d{13}$/.test(raw)) {
    const parsed = new Date(Number(raw));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{10}$/.test(raw)) {
    const parsed = new Date(Number(raw) * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const yearFirstMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (yearFirstMatch) {
    const [, year, month, day] = yearFirstMatch;
    const parsed = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dayFirstMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    const parsed = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeAdminDonationRecord = (raw = {}) => {
  const type = String(raw.type || raw.donation_type || raw.donationType || 'money').toLowerCase();
  const rawPaymentStatus = String(raw.paymentStatus || raw.payment_status || raw.status || '').toLowerCase();
  const paymentStatus = ['confirmed', 'paid', 'success'].includes(rawPaymentStatus)
    ? 'confirmed'
    : 'pending';
  const itemType = String(raw.itemType || raw.item_type || raw.donationItemType || '').trim();
  const itemCount = numberOr(raw.itemCount ?? raw.item_count ?? raw.quantity, 0);
  const quantityLabel = raw.quantityLabel || (type === 'money'
    ? '1 contribution'
    : itemType
      ? `${itemType}${itemCount > 0 ? ` x ${itemCount}` : ''}`
      : 'In-kind donation');

  return {
    ...raw,
    id: raw.id ?? raw.donation_id ?? raw.donationId,
    donorName: raw.donorName || raw.donor_name || (raw.anonymous ? 'Anonymous' : 'Donor'),
    donorEmail: raw.donorEmail || raw.donor_email || '',
    campaign: raw.campaign || raw.campaignTitle || raw.campaign_name || 'Campaign',
    ngoName: raw.ngoName || raw.ngo_name || '',
    amount: numberOr(raw.amount, 0),
    quantityLabel,
    itemType,
    itemCount,
    type,
    paymentMethod: String(raw.paymentMethod || raw.payment_method || 'upi').toLowerCase(),
    paymentStatus,
    status: String(raw.status || raw.donation_status || raw.donationStatus || paymentStatus).toLowerCase(),
    receiptNumber: raw.receiptNumber || raw.receipt_number || '',
    transactionId: raw.transactionId || raw.transaction_id || '',
    donatedAt: normalizeDateOnly(raw.donatedAt || raw.date || raw.donationDate || raw.donation_date, ''),
  };
};

const numberOr = (value, fallback = 0) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  const raw = String(value ?? '').trim();
  if (!raw) return fallback;

  const cleaned = raw
    .replace(/inr|rs\.?/gi, '')
    .replace(/[₹,\s]/g, '')
    .replace(/\/-$/, '');

  if (!/^[-+]?\d*\.?\d+$/.test(cleaned)) {
    return fallback;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(numberOr(value, 0))));

const resolveRoleLabel = (value, email = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized) return normalized;
  const emailKey = String(email || '').trim().toLowerCase();
  if (emailKey.includes('admin')) return 'admin';
  if (emailKey.includes('ngo')) return 'ngo';
  if (emailKey.includes('volunteer')) return 'volunteer';
  return 'donor';
};

const normalizeCampaignLifecycleStatus = (value, fallback = 'active') => {
  const normalized = String(value || fallback).trim().toLowerCase();
  if (['active', 'paused', 'completed', 'archived', 'rejected'].includes(normalized)) return normalized;
  if (['inactive', 'stopped'].includes(normalized)) return 'paused';
  return fallback;
};

const normalizePickupLifecycleStatus = (value, fallback = 'pending') => {
  const normalized = String(value || fallback).trim().toLowerCase();
  if (normalized === 'approved') return 'approved';
  if (['assigned', 'in_progress'].includes(normalized)) return 'scheduled';
  if (['pending', 'scheduled', 'completed', 'cancelled', 'rejected'].includes(normalized)) return normalized;
  return fallback;
};

const normalizeDonationPaymentState = (value, fallback = 'pending') => {
  const normalized = String(value || fallback).trim().toLowerCase();
  if (['confirmed', 'paid', 'success', 'completed'].includes(normalized)) return 'confirmed';
  if (['failed'].includes(normalized)) return 'failed';
  if (['processing'].includes(normalized)) return 'processing';
  return 'pending';
};

const normalizeDateOnly = (value, fallback = '') => {
  const parsed = parseDateValue(value);
  if (!parsed) return fallback;
  return parsed.toISOString().slice(0, 10);
};

const normalizeAdminCampaignRecord = (raw = {}, index = 0) => {
  const rawId = raw.id ?? raw.campaign_id ?? raw.campaignId ?? index + 1;
  const targetAmount = numberOr(raw.targetAmount ?? raw.target_amount, 0);
  const collectedAmount = numberOr(raw.collectedAmount ?? raw.collected_amount, 0);
  const startDate = normalizeDateOnly(raw.startDate ?? raw.start_date, new Date().toISOString().slice(0, 10));
  const endDate = normalizeDateOnly(raw.endDate ?? raw.end_date, '');
  const campaignId = String(rawId || '').trim() || String(index + 1);
  const normalizedId = campaignId.startsWith('campaign-') ? campaignId : `campaign-${campaignId}`;

  return {
    ...raw,
    id: normalizedId,
    title: String(raw.title || raw.name || `Campaign ${index + 1}`).trim(),
    ngoName: String(raw.ngoName || raw.ngo_name || raw.organization || 'Verified NGO').trim(),
    ngoEmail: String(raw.ngoEmail || raw.ngo_email || '').trim(),
    type: String(raw.type || raw.donation_type || raw.donationType || 'money').trim().toLowerCase(),
    city: String(raw.city || raw.location || 'India').trim(),
    targetAmount,
    collectedAmount,
    donorCount: numberOr(raw.donorCount ?? raw.donors_count ?? raw.donorsCount, 0),
    status: normalizeCampaignLifecycleStatus(raw.status || raw.campaign_status || raw.campaignStatus, 'active'),
    approvalStatus: String(raw.approvalStatus || raw.approval_status || 'approved').trim().toLowerCase(),
    startDate,
    endDate,
    priority: String(raw.priority || 'medium').trim().toLowerCase(),
    beneficiaries: numberOr(raw.beneficiaries, 0),
    createdAt: normalizeDateOnly(raw.createdAt ?? raw.created_at, startDate),
  };
};

const normalizeAdminUserRecord = (raw = {}, index = 0) => {
  const rawId = raw.id ?? raw.user_id ?? raw.userId ?? index + 1;
  const email = String(raw.email || '').trim().toLowerCase();
  const role = resolveRoleLabel(raw.role, email);
  const isActiveFlag = raw.active ?? raw.isActive;
  const statusFromBackend = String(raw.status || '').trim().toLowerCase();
  const status = typeof isActiveFlag === 'boolean'
    ? (isActiveFlag ? 'active' : 'blocked')
    : statusFromBackend === 'blocked'
      ? 'blocked'
      : 'active';
  const joinedAt = normalizeDateOnly(raw.joinedAt ?? raw.createdAt ?? raw.created_at, '');
  const lastSeenAt = String(raw.lastSeenAt || raw.updatedAt || raw.updated_at || raw.createdAt || '').trim();

  return {
    ...raw,
    id: String(rawId || '').startsWith('user-') ? String(rawId) : `user-${rawId}`,
    userId: rawId,
    name: String(raw.name || raw.full_name || raw.fullName || `User ${index + 1}`).trim(),
    email,
    phone: String(raw.phone || '').trim(),
    address: String(raw.address || '').trim(),
    city: String(raw.city || '').trim(),
    role,
    status,
    joinedAt,
    lastSeenAt,
    donationsCount: numberOr(raw.donationsCount ?? raw.donations_count, 0),
    totalDonated: numberOr(raw.totalDonated ?? raw.total_donated, 0),
  };
};

const resolveBackendUserId = (rawId) => {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) {
    return rawId;
  }

  const cleaned = String(rawId || '')
    .trim()
    .replace(/^user-/i, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const resolveBackendCampaignId = (rawId) => {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) {
    return rawId;
  }

  const cleaned = String(rawId || '')
    .trim()
    .replace(/^campaign-/i, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const resolveBackendPickupId = (rawId) => {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) {
    return rawId;
  }

  const cleaned = String(rawId || '')
    .trim()
    .replace(/^pickup-/i, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const resolveBackendVolunteerId = (rawId) => {
  if (typeof rawId === 'number' && Number.isFinite(rawId)) {
    return rawId;
  }

  const cleaned = String(rawId || '')
    .trim()
    .replace(/^vol-/i, '')
    .replace(/^user-/i, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeVolunteerEntityId = (rawId) => {
  const cleaned = String(rawId || '').trim();
  if (!cleaned) return '';
  return /^vol-/i.test(cleaned)
    ? cleaned.replace(/^vol-/i, 'vol-')
    : `vol-${cleaned}`;
};

const buildVolunteerProfileFromUser = (raw = {}, index = 0) => {
  const volunteerEntityId = resolveBackendVolunteerId(raw.volunteerId ?? raw.volunteer_id);
  const rawId = volunteerEntityId ?? raw.user_id ?? raw.userId ?? raw.id ?? index + 1;
  const volunteerId = normalizeVolunteerEntityId(rawId) || `vol-${index + 1}`;
  const skills = Array.isArray(raw.skills)
    ? raw.skills.map((item) => String(item || '').trim()).filter(Boolean)
    : String(raw.skills || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  const completedTasks = Math.max(
    0,
    numberOr(
      raw.completedTasks ??
      raw.completed_tasks ??
      raw.tasksCompleted ??
      raw.tasks_completed ??
      raw.completed_count,
      0
    )
  );
  const totalTasks = Math.max(
    0,
    numberOr(
      raw.totalTasks ??
      raw.total_tasks ??
      raw.taskCount ??
      raw.task_count ??
      raw.tasksCount ??
      raw.tasks_count,
      0
    )
  );
  const pendingTasks = Math.max(
    0,
    numberOr(
      raw.pendingTasks ??
      raw.pending_tasks ??
      raw.assigned ??
      raw.assigned_count,
      0
    )
  );
  const fallbackAssignedTasks = totalTasks > 0 ? totalTasks : completedTasks + pendingTasks;
  const assignedTasks = Math.max(
    0,
    numberOr(raw.assignedTasks ?? raw.assigned_tasks, fallbackAssignedTasks)
  );
  const completionRate = assignedTasks
    ? clampPercent((completedTasks / Math.max(1, assignedTasks)) * 100)
    : clampPercent(raw.completionRate ?? raw.completion_rate);

  return {
    ...raw,
    id: volunteerId,
    volunteerEntityId,
    name: String(raw.name || `Volunteer ${index + 1}`).trim(),
    email: String(raw.email || '').trim().toLowerCase(),
    city: String(raw.city || 'India').trim(),
    skills: skills.length ? skills : ['General support'],
    rating: Math.max(0, numberOr(raw.rating, 4.5)),
    completionRate,
    assignedTasks,
    completedTasks,
    nextShift: String(raw.nextShift || raw.next_shift || 'Not scheduled').trim() || 'Not scheduled',
    availability: String(raw.availability || (assignedTasks > completedTasks ? 'busy' : 'available')).trim().toLowerCase(),
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
  };
};

const buildPickupLocationStatus = (status, hasVolunteer) => {
  if (status === 'completed') return 'Pickup completed at donor location';
  if (status === 'scheduled') {
    return hasVolunteer ? 'Volunteer assigned. Pickup route confirmed.' : 'Awaiting volunteer assignment';
  }
  return hasVolunteer
    ? 'Volunteer assigned. Awaiting scheduled pickup'
    : 'Awaiting volunteer assignment';
};

const normalizeAdminPickupRecord = (raw = {}, index = 0) => {
  const pickupRawId = raw.id ?? raw.pickup_id ?? raw.pickupId ?? index + 1;
  const pickupId = String(pickupRawId || '').trim() || String(index + 1);
  const normalizedId = pickupId.startsWith('pickup-') ? pickupId : `pickup-${pickupId}`;
  const status = normalizePickupLifecycleStatus(raw.status || raw.pickup_status || raw.pickupStatus, 'pending');
  const donorName = String(raw.donorName || raw.donor_name || raw.requestorName || 'Donor').trim();
  const scheduledFor = normalizeDateOnly(raw.scheduledFor || raw.pickup_date || raw.pickupDate, '');
  const requestedAt = normalizeDateOnly(raw.requestedAt || raw.pickup_date || raw.pickupDate, scheduledFor);
  const donorLatitudeRaw = raw.donorLatitude ?? raw.donor_latitude ?? raw.latitude ?? raw.lat ?? null;
  const donorLongitudeRaw = raw.donorLongitude ?? raw.donor_longitude ?? raw.longitude ?? raw.lng ?? null;
  const donorLatitude = Number.isFinite(Number(donorLatitudeRaw)) ? Number(donorLatitudeRaw) : null;
  const donorLongitude = Number.isFinite(Number(donorLongitudeRaw)) ? Number(donorLongitudeRaw) : null;
  const volunteerId = normalizeVolunteerEntityId(raw.volunteerId || raw.volunteer_id);
  const volunteerName = String(raw.volunteerName || raw.volunteer_name || '').trim();
  const items = Array.isArray(raw.items)
    ? raw.items.map((item) => String(item || '').trim()).filter(Boolean)
    : String(raw.items || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    ...raw,
    id: normalizedId,
    donorName,
    requestorName: donorName,
    donorPhone: String(raw.donorPhone || raw.contact_phone || raw.contactPhone || '').trim(),
    address: String(raw.address || raw.donor_address || raw.donorAddress || '').trim(),
    items: items.length ? items : ['items pending'],
    requestedAt,
    scheduledFor,
    date: scheduledFor || requestedAt,
    timeSlot: String(raw.timeSlot || raw.time_slot || '').trim(),
    status,
    volunteerId,
    volunteerName,
    notes: String(raw.notes || '').trim(),
    donorLatitude,
    donorLongitude,
    locationStatus: String(raw.locationStatus || '').trim() || buildPickupLocationStatus(status, Boolean(volunteerId || volunteerName)),
    locationUpdatedAt: String(raw.locationUpdatedAt || raw.updatedAt || raw.updated_at || raw.createdAt || '').trim() || new Date().toISOString(),
  };
};

const buildMonthlyDonationSeries = (donations = []) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
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
    const donationDate = String(donation.donatedAt || donation.date || '').trim();
    if (!donationDate) return;
    const parsed = parseDateValue(donationDate);
    if (!parsed) return;
    const key = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}`;
    const target = months.find((item) => item.key === key);
    if (target) {
      target.donations += numberOr(donation.amount, 0);
    }
  });

  return months;
};

const buildDonationTypeBreakdown = (donations = []) => {
  const palette = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'];
  const totals = donations.reduce((acc, donation) => {
    const key = String(donation.type || 'money').trim().toLowerCase() || 'money';
    acc[key] = (acc[key] || 0) + numberOr(donation.amount, 0);
    return acc;
  }, {});

  return Object.entries(totals).map(([name, value], index) => ({
    name,
    value,
    fill: palette[index % palette.length],
  }));
};

const buildPaymentStatusBreakdown = (donations = []) => {
  const palette = ['#22c55e', '#f59e0b', '#ef4444', '#60a5fa'];
  const totals = donations.reduce((acc, donation) => {
    const key = normalizeDonationPaymentState(donation.paymentStatus || donation.status, 'pending');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(totals).map(([name, value], index) => ({
    name,
    value,
    fill: palette[index % palette.length],
  }));
};

const enrichPickupVolunteerLinks = (pickups = [], volunteers = []) => {
  const byName = volunteers.reduce((acc, volunteer) => {
    const key = String(volunteer.name || '').trim().toLowerCase();
    const volunteerId = normalizeVolunteerEntityId(volunteer.id);
    if (key && volunteerId) acc[key] = volunteerId;
    return acc;
  }, {});

  return pickups.map((pickup) => {
    const volunteerId = normalizeVolunteerEntityId(pickup.volunteerId);
    const volunteerName = String(pickup.volunteerName || '').trim();
    const byVolunteerName = byName[volunteerName.toLowerCase()] || '';
    const resolvedVolunteerId = normalizeVolunteerEntityId(volunteerId || byVolunteerName);
    const resolvedVolunteerName = volunteerName || volunteers.find((volunteer) => normalizeVolunteerEntityId(volunteer.id) === resolvedVolunteerId)?.name || '';
    const normalizedStatus = normalizePickupLifecycleStatus(pickup.status, 'pending');

    return {
      ...pickup,
      status: normalizedStatus,
      volunteerId: resolvedVolunteerId,
      volunteerName: resolvedVolunteerName,
      locationStatus: String(pickup.locationStatus || '').trim() || buildPickupLocationStatus(normalizedStatus, Boolean(resolvedVolunteerId || resolvedVolunteerName)),
    };
  });
};

const buildVolunteerMetricsFromPickups = (volunteers = [], pickups = []) => {
  const grouped = pickups.reduce((acc, pickup) => {
    const volunteerId = normalizeVolunteerEntityId(pickup.volunteerId);
    if (!volunteerId) return acc;
    if (!acc[volunteerId]) acc[volunteerId] = [];
    acc[volunteerId].push(pickup);
    return acc;
  }, {});

  return volunteers.map((volunteer) => {
    const volunteerId = normalizeVolunteerEntityId(volunteer.id);
    const volunteerPickups = grouped[volunteerId] || [];
    const assignedTasks = Math.max(numberOr(volunteer.assignedTasks, 0), volunteerPickups.length);
    const completedTasksFromPickups = volunteerPickups.filter(
      (pickup) => normalizePickupLifecycleStatus(pickup.status, 'pending') === 'completed'
    ).length;
    const completedTasks = Math.max(numberOr(volunteer.completedTasks, 0), completedTasksFromPickups);
    const completionRate = assignedTasks
      ? clampPercent((completedTasks / Math.max(1, assignedTasks)) * 100)
      : clampPercent(volunteer.completionRate);

    const nextScheduledPickup = volunteerPickups
      .filter((pickup) => normalizePickupLifecycleStatus(pickup.status, 'pending') === 'scheduled')
      .sort((left, right) => {
        const leftTime = new Date(left.scheduledFor || '').getTime();
        const rightTime = new Date(right.scheduledFor || '').getTime();
        const safeLeft = Number.isNaN(leftTime) ? Number.MAX_SAFE_INTEGER : leftTime;
        const safeRight = Number.isNaN(rightTime) ? Number.MAX_SAFE_INTEGER : rightTime;
        return safeLeft - safeRight;
      })[0];

    const derivedTasks = volunteerPickups.slice(0, 3).map((pickup) => ({
      id: `task-${volunteer.id}-${pickup.id}`,
      title: `Pickup Request - ${pickup.donorName || 'Donor'}`,
      campaignTitle: 'Pickup Operations',
      dueDate: pickup.scheduledFor || '',
      shift: pickup.timeSlot || 'Pickup Window',
      priority: 'high',
      status:
        normalizePickupLifecycleStatus(pickup.status, 'pending') === 'completed'
          ? 'completed'
          : normalizePickupLifecycleStatus(pickup.status, 'pending') === 'scheduled'
            ? 'in_progress'
            : 'assigned',
    }));

    return {
      ...volunteer,
      assignedTasks,
      completedTasks,
      completionRate,
      availability: assignedTasks > completedTasks ? 'busy' : 'available',
      nextShift: nextScheduledPickup
        ? `${nextScheduledPickup.scheduledFor || 'Today'} • ${nextScheduledPickup.timeSlot || 'Pickup Window'}`
        : volunteer.nextShift || 'Not scheduled',
      tasks: Array.isArray(volunteer.tasks) && volunteer.tasks.length ? volunteer.tasks : derivedTasks,
    };
  });
};

const mergeAdminSnapshotCollections = (snapshot, overrides = {}) => {
  const nextSnapshot = { ...snapshot, ...overrides };
  const campaigns = Array.isArray(nextSnapshot.campaigns) ? nextSnapshot.campaigns : [];
  const donations = Array.isArray(nextSnapshot.donations) ? nextSnapshot.donations : [];
  const users = Array.isArray(nextSnapshot.users) ? nextSnapshot.users : [];
  const fallbackVolunteers = users
    .filter((user) => String(user.role || '').trim().toLowerCase() === 'volunteer')
    .map((user, index) => buildVolunteerProfileFromUser(user, index));
  const volunteersBase = Array.isArray(nextSnapshot.volunteers) && nextSnapshot.volunteers.length
    ? nextSnapshot.volunteers
    : fallbackVolunteers;
  const pickupsBase = Array.isArray(nextSnapshot.pickups) ? nextSnapshot.pickups : [];

  const pickups = enrichPickupVolunteerLinks(pickupsBase, volunteersBase);
  const volunteers = buildVolunteerMetricsFromPickups(volunteersBase, pickups);
  const monthlyDonations = buildMonthlyDonationSeries(donations);
  const donationTypeBreakdown = buildDonationTypeBreakdown(donations);
  const paymentStatusBreakdown = buildPaymentStatusBreakdown(donations);
  const topCampaigns = [...campaigns]
    .sort((left, right) => numberOr(right.collectedAmount, 0) - numberOr(left.collectedAmount, 0))
    .slice(0, 5);
  const workflowPending = Array.isArray(nextSnapshot.workflowItems)
    ? nextSnapshot.workflowItems.filter((item) => String(item.status || '').trim().toLowerCase() === 'pending').length
    : 0;
  const pickupPending = pickups.filter((pickup) =>
    ['pending', 'scheduled', 'assigned', 'in_progress'].includes(
      String(pickup.status || '').trim().toLowerCase()
    )
  ).length;
  const stats = {
    ...(nextSnapshot.stats || {}),
    totalDonations: donations.reduce((sum, donation) => sum + numberOr(donation.amount, 0), 0),
    activeCampaigns: campaigns.filter((campaign) => normalizeCampaignLifecycleStatus(campaign.status, 'active') === 'active').length,
    pendingRequests: workflowPending + pickupPending,
    volunteersCount: volunteers.length,
  };

  return {
    ...nextSnapshot,
    campaigns,
    donations,
    users,
    volunteers,
    pickups,
    stats,
    monthlyDonations,
    donationTypeBreakdown,
    paymentStatusBreakdown,
    topCampaigns,
  };
};

const buildBackendFirstAdminSnapshot = () =>
  mergeAdminSnapshotCollections(getAdminDashboardSnapshot(), {
    campaigns: [],
    donations: [],
    users: [],
    volunteers: [],
    pickups: [],
  });

const severityTone = {
  critical: 'bg-red-500/10 text-red-400 border border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  low: 'bg-green-500/10 text-green-400 border border-green-500/20',
};

const statusTone = {
  active: 'bg-green-500/10 text-green-400 border border-green-500/20',
  approved: 'bg-green-500/10 text-green-400 border border-green-500/20',
  completed: 'bg-green-500/10 text-green-400 border border-green-500/20',
  confirmed: 'bg-green-500/10 text-green-400 border border-green-500/20',
  paid: 'bg-green-500/10 text-green-400 border border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  scheduled: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  assigned: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  paused: 'bg-slate-500/10 text-slate-300 border border-white/10',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
  blocked: 'bg-red-500/10 text-red-400 border border-red-500/20',
  archived: 'bg-slate-500/10 text-slate-300 border border-white/10',
};

const ADMIN_SECTION_DEFAULTS = [
  { key: 'overview', label: 'Dashboard', path: '/dashboard/admin', icon: FiHome, iconKey: 'home' },
  { key: 'campaigns', label: 'Campaigns', path: '/dashboard/admin/campaigns', icon: FiTarget, iconKey: 'target' },
  { key: 'donations', label: 'Donations', path: '/dashboard/admin/donations', icon: FiDollarSign, iconKey: 'dollar-sign' },
  { key: 'pickups', label: 'Pickup Requests', path: '/dashboard/admin/pickups', icon: FiPackage, iconKey: 'package' },
  { key: 'users', label: 'Users', path: '/dashboard/admin/users', icon: FiUsers, iconKey: 'users' },
  { key: 'volunteers', label: 'Volunteers', path: '/dashboard/admin/volunteers', icon: FiTruck, iconKey: 'truck' },
  { key: 'alerts', label: 'Urgent Needs', path: '/dashboard/admin/alerts', icon: FiAlertTriangle, iconKey: 'alert-triangle' },
  { key: 'reports', label: 'Reports & Analytics', path: '/dashboard/admin/reports', icon: FiBarChart2, iconKey: 'bar-chart-2' },
  { key: 'notifications', label: 'Notifications', path: '/dashboard/admin/notifications', icon: FiBell, iconKey: 'bell' },
  { key: 'menu', label: 'Menu Management', path: '/dashboard/admin/menu', icon: FiSettings, iconKey: 'settings' },
];

const ADMIN_SECTION_ICON_BY_KEY = {
  overview: FiHome,
  home: FiHome,
  campaigns: FiTarget,
  target: FiTarget,
  donations: FiDollarSign,
  'dollar-sign': FiDollarSign,
  pickups: FiPackage,
  package: FiPackage,
  users: FiUsers,
  volunteers: FiTruck,
  truck: FiTruck,
  alerts: FiAlertTriangle,
  'alert-triangle': FiAlertTriangle,
  reports: FiBarChart2,
  'bar-chart-2': FiBarChart2,
  notifications: FiBell,
  bell: FiBell,
  menu: FiSettings,
  settings: FiSettings,
};

const resolveAdminSectionIcon = (iconKey, sectionKey) =>
  ADMIN_SECTION_ICON_BY_KEY[String(iconKey || '').trim().toLowerCase()] ||
  ADMIN_SECTION_ICON_BY_KEY[String(sectionKey || '').trim().toLowerCase()] ||
  FiHome;

const normalizeAdminSection = (raw = {}, index = 0) => {
  const key = String(raw.key || raw.menuKey || raw.menu_key || '').trim().toLowerCase();
  const fallbackByKey = ADMIN_SECTION_DEFAULTS.find((section) => section.key === key);
  const fallbackByIndex = ADMIN_SECTION_DEFAULTS[index] || ADMIN_SECTION_DEFAULTS[0];
  const fallback = fallbackByKey || fallbackByIndex;

  const label = String(raw.label || fallback.label || '').trim() || fallback.label;
  const path = String(raw.path || fallback.path || '/dashboard/admin').trim() || '/dashboard/admin';
  const sortOrder = Number(raw.sortOrder ?? raw.sort_order ?? index + 1);
  const icon = resolveAdminSectionIcon(raw.iconKey || raw.icon_key || fallback.iconKey, key || fallback.key);

  return {
    id: Number(raw.id ?? raw.menuId ?? raw.menu_id ?? index + 1),
    key: key || fallback.key,
    label,
    path,
    iconKey: String(raw.iconKey || raw.icon_key || fallback.iconKey || '').trim().toLowerCase(),
    icon,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : index + 1,
    enabled: Boolean(raw.enabled ?? true),
  };
};

const DEFAULT_DONATION_FILTERS = {
  type: 'all',
  paymentStatus: 'all',
  dateFrom: '',
  dateTo: '',
};

const ADMIN_PERMISSION_BY_SECTION = {
  overview: 'admin.overview',
  campaigns: 'admin.campaigns',
  donations: 'admin.donations',
  pickups: 'admin.pickups',
  users: 'admin.users',
  volunteers: 'admin.volunteers',
  alerts: 'admin.alerts',
  reports: 'admin.reports',
  notifications: 'admin.notifications',
  menu: 'admin.menu',
};

const ALWAYS_ENABLED_ADMIN_SECTIONS = new Set(['campaigns']);

const getPermissionCodes = (permissions) => {
  if (!Array.isArray(permissions)) return [];
  return permissions
    .map((permission) => {
      if (typeof permission === 'string') return permission;
      if (permission && typeof permission === 'object') {
        return permission.code || permission.name || permission.key || null;
      }
      return null;
    })
    .filter(Boolean);
};

const canAccessAdminSection = (user, sectionKey) => {
  const role = normalizeRole(user?.role);
  if (role !== USER_ROLES.ADMIN) return false;
  // Admin has full access to all admin sections.
  return true;
};

const ChartTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-white font-semibold">
        {prefix}
        {Number(payload[0].value || 0).toLocaleString('en-IN')}
      </p>
    </div>
  );
};

const StatusBadge = ({ value }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${statusTone[value] || 'bg-white/5 text-slate-300 border border-white/10'}`}
  >
    {String(value || 'unknown').replace(/_/g, ' ')}
  </span>
);

const SectionTitle = ({ title, subtitle, actions = null }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
    <div>
      <h2 className="text-xl font-heading font-bold text-white">{title}</h2>
      <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
    </div>
    {actions}
  </div>
);

const OverviewSection = ({ snapshot, stats }) => {
  const statCards = [
    {
      icon: FiTarget,
      title: 'Active Campaigns',
      value: stats.activeCampaigns,
      color: 'from-primary-500 to-blue-500',
    },
    {
      icon: FiDollarSign,
      title: 'Total Donations',
      value: stats.totalDonations,
      format: 'currency',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: FiPackage,
      title: 'Pickup Requests',
      value: snapshot.pickups.length,
      color: 'from-orange-500 to-amber-500',
    },
    {
      icon: FiUsers,
      title: 'Total Users',
      value: snapshot.users.length,
      color: 'from-purple-500 to-violet-500',
    },
  ];

  const recentDonations = snapshot.donations.slice(0, 4);
  const recentPickups = snapshot.pickups.slice(0, 4);
  const activeBanner = snapshot.banners.find((banner) => banner.status === 'active');

  const volunteerActivity = [
    { week: 'Week 1', assigned: 8, completed: 4 },
    { week: 'Week 2', assigned: 9, completed: 5 },
    { week: 'Week 3', assigned: 13, completed: 7 },
    { week: 'Week 4', assigned: 15, completed: 8 },
  ];

  let donationsAndCampaignsTrend = snapshot.monthlyDonations.map((monthItem) => {
    const [yearValue, monthValue] = String(monthItem.key || '').split('-').map(Number);
    const hasValidMonth = Number.isFinite(yearValue) && Number.isFinite(monthValue);
    const monthEndTime = hasValidMonth
      ? new Date(yearValue, monthValue, 0, 23, 59, 59, 999).getTime()
      : null;

    const activeCampaigns = monthEndTime
      ? snapshot.campaigns.filter((campaign) => {
          const startDate = parseDateValue(campaign.startDate || campaign.createdAt);
          const endDate = parseDateValue(campaign.endDate || '2099-12-31');
          const startTime = startDate?.getTime();
          const endTime = endDate?.getTime();

          if (!Number.isFinite(startTime)) return false;

          const hasEnded = Number.isFinite(endTime) && endTime < monthEndTime;
          const started = startTime <= monthEndTime;
          const isArchived = ['archived', 'rejected'].includes(String(campaign.status || '').toLowerCase());

          return started && !hasEnded && !isArchived;
        }).length
      : snapshot.campaigns.filter((campaign) =>
          String(campaign.status || '').toLowerCase() === 'active'
        ).length;

    return {
      month: monthItem.month,
      totalDonations: Number(monthItem.donations || 0),
      activeCampaigns,
    };
  });

  const hasDonationsAndCampaignsTrendData = donationsAndCampaignsTrend.some(
    (item) => numberOr(item.totalDonations, 0) > 0 || numberOr(item.activeCampaigns, 0) > 0
  );

  if (!hasDonationsAndCampaignsTrendData && donationsAndCampaignsTrend.length > 0) {
    const fallbackTotalDonations = Math.max(0, numberOr(stats.totalDonations, 0));
    const fallbackActiveCampaigns = Math.max(
      0,
      numberOr(
        stats.activeCampaigns,
        snapshot.campaigns.filter((campaign) => String(campaign.status || '').toLowerCase() === 'active').length
      )
    );

    if (fallbackTotalDonations > 0 || fallbackActiveCampaigns > 0) {
      const lastIndex = donationsAndCampaignsTrend.length - 1;
      donationsAndCampaignsTrend = donationsAndCampaignsTrend.map((item, index) =>
        index === lastIndex
          ? {
              ...item,
              totalDonations: fallbackTotalDonations,
              activeCampaigns: fallbackActiveCampaigns,
            }
          : item
      );
    }
  }

  const hasVisibleDonationsAndCampaignsTrendData = donationsAndCampaignsTrend.some(
    (item) => numberOr(item.totalDonations, 0) > 0 || numberOr(item.activeCampaigns, 0) > 0
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 0.05} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle title="Recent Donations" subtitle="Latest completed and pending donation records." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-white/10">
                  <th className="pb-3 pr-3 font-medium">Donor Name</th>
                  <th className="pb-3 pr-3 font-medium">Amount / Item</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDonations.map((donation) => {
                  const donationValue = formatDonationValue(donation);

                  return (
                    <tr key={donation.id} className="border-b border-white/5">
                      <td className="py-3 pr-3 text-slate-200">{donation.donorName}</td>
                      <td className="py-3 pr-3 text-white font-semibold">
                        <p>{donationValue.primary}</p>
                        <p className="text-xs text-slate-500 mt-1 font-normal">{donationValue.secondary}</p>
                      </td>
                      <td className="py-3"><StatusBadge value={donation.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle title="Latest Pickup Requests" subtitle="Track requester status and planned pickup date." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-white/10">
                  <th className="pb-3 pr-3 font-medium">Requestor</th>
                  <th className="pb-3 pr-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPickups.map((pickup) => (
                  <tr key={pickup.id} className="border-b border-white/5">
                    <td className="py-3 pr-3 text-slate-200">{pickup.requestorName}</td>
                    <td className="py-3 pr-3"><StatusBadge value={pickup.status} /></td>
                    <td className="py-3 text-slate-300">{formatDate(pickup.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <motion.section variants={fadeInUp} className="dashboard-card xl:col-span-2">
          <SectionTitle title="Volunteer Activity" subtitle="Assigned vs completed tasks by week." />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={volunteerActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="assigned" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.section>

        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle title="Urgent Needs" subtitle="High-priority requirement currently active." />
          <div className="rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/20 p-4">
            <p className="text-white font-semibold">{activeBanner?.title || 'Winter Blankets'}</p>
            <p className="text-slate-300 text-sm mt-1">{activeBanner?.message || 'Immediate support needed for seasonal relief kits.'}</p>
            <p className="text-orange-300 text-xs mt-2">Severity: {(activeBanner?.severity || 'high').toUpperCase()}</p>
          </div>
        </motion.section>

        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle
            title="Total Donations & Active Campaigns"
            subtitle="Monthly trend comparison for platform performance."
          />
          {hasVisibleDonationsAndCampaignsTrendData ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={donationsAndCampaignsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `₹${Math.round(Number(value || 0) / 1000)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px' }}
                  formatter={(value, name) =>
                    name === 'Total Donations'
                      ? [`₹${Number(value || 0).toLocaleString('en-IN')}`, name]
                      : [Number(value || 0), name]
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="totalDonations" name="Total Donations" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="activeCampaigns" name="Active Campaigns" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center text-center px-6">
              <div>
                <p className="text-sm text-slate-200 font-medium">No donation trend data yet</p>
                <p className="text-xs text-slate-500 mt-1">Bars appear once donation and campaign history is synced.</p>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

const CampaignManagementSection = ({
  snapshot,
  onCreateCampaign,
  onReviewSubmission,
  onUpdateCampaignProgress,
  onUpdateCampaignStatus,
  onUpdateCampaignDetails,
  onDeleteCampaign,
}) => {
  const [form, setForm] = useState({
    title: '',
    ngoName: '',
    ngoEmail: '',
    type: 'money',
    targetAmount: '',
    city: '',
    endDate: '',
    priority: 'medium',
    beneficiaries: '',
  });
  const [notes, setNotes] = useState({});
  const [progressDrafts, setProgressDrafts] = useState({});

  const pendingSubmissions = snapshot.workflowItems.filter((item) => item.status === 'pending');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !Number(form.targetAmount)) {
      toast.error('Enter a campaign title and target amount');
      return;
    }

    onCreateCampaign(form);
    setForm({
      title: '',
      ngoName: '',
      ngoEmail: '',
      type: 'money',
      targetAmount: '',
      city: '',
      endDate: '',
      priority: 'medium',
      beneficiaries: '',
    });
  };

  const handleEditCampaign = (campaign) => {
    const title = window.prompt('Campaign title', campaign.title || '');
    if (title === null) return;

    const targetAmountInput = window.prompt('Target amount', String(campaign.targetAmount || 0));
    if (targetAmountInput === null) return;
    const targetAmount = Number(targetAmountInput);
    if (!Number.isFinite(targetAmount) || targetAmount < 0) {
      toast.error('Enter a valid target amount');
      return;
    }

    const city = window.prompt('City', campaign.city || '');
    if (city === null) return;

    const endDate = window.prompt('End date (YYYY-MM-DD)', campaign.endDate || '');
    if (endDate === null) return;

    onUpdateCampaignDetails(campaign.id, {
      title,
      targetAmount,
      city,
      endDate,
    });
  };

  const handleDeleteCampaign = (campaign) => {
    const shouldDelete = window.confirm(`Delete campaign "${campaign.title}"?`);
    if (!shouldDelete) return;
    onDeleteCampaign(campaign.id);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Campaign Management"
        subtitle="Create campaigns, review NGO submissions, and track live campaign progress."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.form variants={fadeInUp} onSubmit={handleSubmit} className="dashboard-card xl:col-span-1">
          <SectionTitle title="Create Campaign" subtitle="Launch an admin-approved campaign instantly." />
          <div className="space-y-3">
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="input-field" placeholder="Campaign title" />
            <input value={form.ngoName} onChange={(e) => setForm((prev) => ({ ...prev, ngoName: e.target.value }))} className="input-field" placeholder="NGO / Organization" />
            <input value={form.ngoEmail} onChange={(e) => setForm((prev) => ({ ...prev, ngoEmail: e.target.value }))} className="input-field" placeholder="NGO email" />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className="input-field">
                <option value="money">Money</option>
                <option value="food">Food</option>
                <option value="clothes">Clothes</option>
                <option value="books">Books</option>
                <option value="other">Other</option>
              </select>
              <input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} className="input-field" placeholder="City" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="0" value={form.targetAmount} onChange={(e) => setForm((prev) => ({ ...prev, targetAmount: e.target.value }))} className="input-field" placeholder="Target amount" />
              <input type="number" min="0" value={form.beneficiaries} onChange={(e) => setForm((prev) => ({ ...prev, beneficiaries: e.target.value }))} className="input-field" placeholder="Beneficiaries" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} className="input-field" />
              <select value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))} className="input-field">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              <FiPlus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>
        </motion.form>

        <motion.section variants={fadeInUp} className="dashboard-card xl:col-span-2">
          <SectionTitle title="Approve / Reject Donation Drives" subtitle="Review incoming NGO requests and convert approved drives into active campaigns." />
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {pendingSubmissions.map((item) => (
              <div key={item.id} className="glass-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.requestedBy} • {formatCurrency(item.targetAmount)} • {item.beneficiaries} beneficiaries
                    </p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
                <p className="text-sm text-slate-400 mt-3">{item.summary}</p>
                <textarea
                  value={notes[item.id] || ''}
                  onChange={(event) => setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))}
                  className="textarea-field min-h-[72px] mt-3 text-sm"
                  placeholder="Review note (optional)"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => onReviewSubmission(item.id, 'approve', notes[item.id] || '')}
                    className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm hover:bg-green-500/20 transition-colors"
                  >
                    <FiCheck className="inline-block mr-1 -mt-0.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => onReviewSubmission(item.id, 'reject', notes[item.id] || '')}
                    className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                  >
                    <FiX className="inline-block mr-1 -mt-0.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingSubmissions.length === 0 && (
              <div className="text-center py-10 text-sm text-slate-400">
                No pending campaign approvals right now.
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <motion.section variants={fadeInUp} className="dashboard-card">
        <SectionTitle title="Campaign List & Progress" subtitle="Monitor funding progress and control each campaign status." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="pb-3 pr-3 font-medium">Campaign</th>
                <th className="pb-3 pr-3 font-medium">NGO</th>
                <th className="pb-3 pr-3 font-medium">Progress</th>
                <th className="pb-3 pr-3 font-medium">Funding</th>
                <th className="pb-3 pr-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.campaigns.map((campaign) => {
                const percent = progressPercent(campaign.collectedAmount, campaign.targetAmount);
                return (
                  <tr key={campaign.id} className="border-b border-white/5 align-top">
                    <td className="py-4 pr-3">
                      <p className="text-white font-medium">{campaign.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{campaign.type} • {campaign.city}</p>
                    </td>
                    <td className="py-4 pr-3 text-slate-300">{campaign.ngoName}</td>
                    <td className="py-4 pr-3">
                      <div className="w-full max-w-[220px]">
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-blue-400" style={{ width: `${percent}%` }} />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">{percent}% funded</p>
                      </div>
                    </td>
                    <td className="py-4 pr-3">
                      <div className="text-slate-300">{formatCurrency(campaign.collectedAmount)}</div>
                      <div className="text-xs text-slate-500">Target {formatCurrency(campaign.targetAmount)}</div>
                    </td>
                    <td className="py-4 pr-3"><StatusBadge value={campaign.status} /></td>
                    <td className="py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={progressDrafts[campaign.id] ?? campaign.collectedAmount}
                          onChange={(event) => setProgressDrafts((prev) => ({ ...prev, [campaign.id]: event.target.value }))}
                          className="input-field w-36 py-2 text-sm"
                        />
                        <button
                          onClick={() => onUpdateCampaignProgress(campaign.id, progressDrafts[campaign.id] ?? campaign.collectedAmount)}
                          className="px-3 py-2 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs hover:bg-primary-500/20 transition-colors"
                        >
                          Save Progress
                        </button>
                        <button
                          onClick={() => onUpdateCampaignStatus(campaign.id, campaign.status === 'active' ? 'paused' : 'active')}
                          className="px-3 py-2 rounded-lg bg-white/5 text-slate-300 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                        >
                          {campaign.status === 'active' ? <FiPauseCircle className="inline-block mr-1 -mt-0.5" /> : <FiPlayCircle className="inline-block mr-1 -mt-0.5" />}
                          {campaign.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEditCampaign(campaign)}
                          className="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs hover:bg-blue-500/20 transition-colors"
                        >
                          Edit Details
                        </button>
                        <button
                          onClick={() => onUpdateCampaignStatus(campaign.id, 'completed')}
                          className="px-3 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-xs hover:bg-green-500/20 transition-colors"
                        >
                          Mark Complete
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign)}
                          className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs hover:bg-red-500/20 transition-colors"
                        >
                          <FiTrash2 className="inline-block mr-1 -mt-0.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
};

const DonationsManagementSection = ({
  snapshot,
  isLoading,
  errorMessage,
  filters,
  onFiltersChange,
  onResetFilters,
  onOpenReceipt,
  onUpdateDonationPaymentStatus,
  onGenerateDonationReceipt,
}) => {
  const typeFilter = filters?.type || 'all';
  const statusFilter = filters?.paymentStatus || 'all';
  const dateFrom = filters?.dateFrom || '';
  const dateTo = filters?.dateTo || '';

  const resolveDonationDate = (donation) => {
    const raw = String(donation?.donatedAt || '').trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      return raw.slice(0, 10);
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  };

  const toPaymentState = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    return ['confirmed', 'paid'].includes(normalized) ? 'confirmed' : 'pending';
  };

  const visibleDonations = useMemo(
    () =>
      snapshot.donations.filter((donation) => {
        const donationDate = resolveDonationDate(donation);
        const paymentState = toPaymentState(donation.paymentStatus);
        const typeMatch = typeFilter === 'all' || donation.type === typeFilter;
        const statusMatch = statusFilter === 'all' || paymentState === statusFilter;
        const fromMatch = !dateFrom || (donationDate && donationDate >= dateFrom);
        const toMatch = !dateTo || (donationDate && donationDate <= dateTo);
        return typeMatch && statusMatch && fromMatch && toMatch;
      }),
    [snapshot.donations, statusFilter, typeFilter, dateFrom, dateTo]
  );

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Donations Management"
        subtitle="View and manage all donations with payment confirmation and receipt generation."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(event) => onFiltersChange({ type: event.target.value })}
              className="input-field py-2 text-sm min-w-[140px]"
            >
              <option value="all">All Types</option>
              <option value="money">Money</option>
              <option value="food">Food</option>
              <option value="clothes">Clothes</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => onFiltersChange({ paymentStatus: event.target.value })}
              className="input-field py-2 text-sm min-w-[140px]"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => onFiltersChange({ dateFrom: event.target.value })}
              className="input-field py-2 text-sm min-w-[150px]"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => onFiltersChange({ dateTo: event.target.value })}
              className="input-field py-2 text-sm min-w-[150px]"
            />
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-xs hover:bg-white/10 transition-colors"
            >
              Clear
            </button>
          </div>
        }
      />

      {errorMessage ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {errorMessage}. Showing available donation records.
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Visible Donations</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">{visibleDonations.length}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Confirmed Payments</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">
            {visibleDonations.filter((item) => toPaymentState(item.paymentStatus) === 'confirmed').length}
          </p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Receipts Generated</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">
            {visibleDonations.filter((item) => item.type === 'money' && item.receiptNumber).length}
          </p>
        </div>
      </div>

      <motion.section variants={fadeInUp} className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="pb-3 pr-3 font-medium">Donor</th>
                <th className="pb-3 pr-3 font-medium">Campaign</th>
                <th className="pb-3 pr-3 font-medium">Type</th>
                <th className="pb-3 pr-3 font-medium">Amount / Qty</th>
                <th className="pb-3 pr-3 font-medium">Payment</th>
                <th className="pb-3 pr-3 font-medium">Receipt</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading donations...
                  </td>
                </tr>
              ) : visibleDonations.length ? (
                visibleDonations.map((donation) => {
                  const paymentState = toPaymentState(donation.paymentStatus);
                  const isMoneyDonation = donation.type === 'money';
                  const canGenerateReceipt = isMoneyDonation && paymentState === 'confirmed' && !donation.receiptNumber;
                  const donationValue = formatDonationValue(donation);

                  return (
                    <tr key={donation.id} className="border-b border-white/5">
                      <td className="py-4 pr-3">
                        <p className="text-white font-medium">{donation.donorName}</p>
                        <p className="text-xs text-slate-500 mt-1">{donation.donorEmail}</p>
                      </td>
                      <td className="py-4 pr-3">
                        <p className="text-slate-200">{donation.campaign}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatDate(donation.donatedAt)}</p>
                      </td>
                      <td className="py-4 pr-3"><StatusBadge value={donation.type} /></td>
                      <td className="py-4 pr-3">
                        <p className="text-slate-200">{donationValue.primary}</p>
                        <p className="text-xs text-slate-500 mt-1">{donationValue.secondary}</p>
                      </td>
                      <td className="py-4 pr-3">
                        <div className="space-y-2">
                          <StatusBadge value={paymentState} />
                          <select
                            value={paymentState}
                            onChange={(event) => onUpdateDonationPaymentStatus(donation.id, event.target.value)}
                            className="input-field py-2 text-xs min-w-[130px]"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-4 pr-3 text-slate-300">
                        {isMoneyDonation ? donation.receiptNumber || 'Not generated' : 'N/A'}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => onOpenReceipt(donation)}
                            disabled={!isMoneyDonation || !donation.receiptNumber}
                            className="px-3 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs hover:bg-primary-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <FiFileText className="inline-block mr-1 -mt-0.5" />
                            View Receipt
                          </button>
                          <button
                            onClick={() => onGenerateDonationReceipt(donation.id)}
                            disabled={!canGenerateReceipt}
                            className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs hover:bg-green-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Generate Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No donations found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
};

const PickupRequestsSection = ({ snapshot, onAssignPickupVolunteer, onUpdatePickupStatus }) => {
  const assignableVolunteers = useMemo(
    () => snapshot.volunteers,
    [snapshot.volunteers]
  );

  const toPickupStatus = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (['assigned', 'in_progress'].includes(normalized)) return 'scheduled';
    if (['pending', 'approved', 'scheduled', 'completed', 'cancelled', 'rejected'].includes(normalized)) return normalized;
    return 'pending';
  };

  const formatTrackingDateTime = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const buildPickupMapUrl = (pickup) => {
    const lat = Number(pickup?.donorLatitude);
    const lng = Number(pickup?.donorLongitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup?.address || '')}`;
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Pickup Requests"
        subtitle="View all pickup requests, assign volunteers, update status, and track pickup location."
      />

      <motion.section variants={fadeInUp} className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="pb-3 pr-3 font-medium">Donor</th>
                <th className="pb-3 pr-3 font-medium">Items</th>
                <th className="pb-3 pr-3 font-medium">Schedule</th>
                <th className="pb-3 pr-3 font-medium">Volunteer</th>
                <th className="pb-3 pr-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Location Tracking</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.pickups.map((pickup) => {
                const pickupStatus = toPickupStatus(pickup.status);
                const hasVolunteer = Boolean(pickup.volunteerId);
                const donorLatitude = Number(pickup.donorLatitude);
                const donorLongitude = Number(pickup.donorLongitude);
                const coordinatesLabel =
                  Number.isFinite(donorLatitude) && Number.isFinite(donorLongitude)
                    ? `${donorLatitude.toFixed(4)}, ${donorLongitude.toFixed(4)}`
                    : 'Coordinates unavailable';

                return (
                  <tr key={pickup.id} className="border-b border-white/5 align-top">
                    <td className="py-4 pr-3">
                      <p className="text-white font-medium">{pickup.donorName}</p>
                      <p className="text-xs text-slate-500 mt-1">{pickup.address}</p>
                      <p className="text-xs text-slate-500">{pickup.donorPhone}</p>
                    </td>
                    <td className="py-4 pr-3 text-slate-300 capitalize">{pickup.items.join(', ')}</td>
                    <td className="py-4 pr-3">
                      <p className="text-slate-200">{formatDate(pickup.scheduledFor)}</p>
                      <p className="text-xs text-slate-500 mt-1">{pickup.timeSlot}</p>
                    </td>
                    <td className="py-4 pr-3">
                      <select
                        value={pickup.volunteerId || ''}
                        onChange={(event) => onAssignPickupVolunteer(pickup.id, event.target.value)}
                        className="input-field py-2 text-sm min-w-[180px]"
                      >
                        <option value="">Assign volunteer</option>
                        {assignableVolunteers.map((volunteer) => (
                          <option key={volunteer.id} value={volunteer.id}>{volunteer.name}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-2">
                        {pickup.volunteerName || 'Awaiting assignment'}
                      </p>
                    </td>
                    <td className="py-4 pr-3">
                      <div className="space-y-2">
                        <StatusBadge value={pickupStatus} />
                        <select
                          value={pickupStatus}
                          onChange={(event) => onUpdatePickupStatus(pickup.id, event.target.value)}
                          className="input-field py-2 text-sm min-w-[150px]"
                        >
                          <option value="pending">Pending</option>
                          <option value="scheduled" disabled={!hasVolunteer}>Scheduled</option>
                          <option value="completed">Completed</option>
                        </select>
                        {!hasVolunteer && pickupStatus === 'pending' ? (
                          <p className="text-[11px] text-slate-500">Assign a volunteer to schedule this pickup.</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="glass-card p-3 min-w-[250px]">
                        <p className="text-xs text-slate-400">Tracking Notes</p>
                        <p className="text-sm text-white mt-1">{pickup.notes || '—'}</p>
                        <p className="mt-2 text-[11px] text-slate-500">{pickup.locationStatus || 'Awaiting location update'}</p>
                        <p className="text-[11px] text-slate-500">{coordinatesLabel}</p>
                        <p className="text-[11px] text-slate-500">
                          Last update: {formatTrackingDateTime(pickup.locationUpdatedAt)}
                        </p>
                        <a
                          href={buildPickupMapUrl(pickup)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[11px] text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          <FiMapPin className="w-3.5 h-3.5" />
                          Track Location
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
};

const UsersManagementSection = ({
  snapshot,
  onToggleUserStatus,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
  });

  const filteredUsersByRole = useMemo(
    () => roleFilter === 'all' 
      ? snapshot.users 
      : snapshot.users.filter((user) => user.role === roleFilter),
    [snapshot.users, roleFilter]
  );

  const visibleUsers = useMemo(
    () => filteredUsersByRole.filter((user) => statusFilter === 'all' || user.status === statusFilter),
    [filteredUsersByRole, statusFilter]
  );

  const donorDonationHistoryByUserId = useMemo(() => {
    const sortByDateDesc = (left, right) => {
      const leftTime = new Date(left.donatedAt || '').getTime();
      const rightTime = new Date(right.donatedAt || '').getTime();
      const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
      const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
      return safeRight - safeLeft;
    };

    return filteredUsersByRole.reduce((acc, user) => {
      const userEmail = String(user.email || '').trim().toLowerCase();
      const userName = String(user.name || '').trim().toLowerCase();
      acc[user.id] = snapshot.donations
        .filter((donation) => {
          const donorEmail = String(donation.donorEmail || '').trim().toLowerCase();
          const donorName = String(donation.donorName || '').trim().toLowerCase();
          const matchesByEmail = userEmail && donorEmail === userEmail;
          const matchesByName = !userEmail && userName && donorName === userName;
          return matchesByEmail || matchesByName;
        })
        .sort(sortByDateDesc);
      return acc;
    }, {});
  }, [filteredUsersByRole, snapshot.donations]);

  const donorDonationSummary = useMemo(() => {
    const donorEmails = new Set(
      filteredUsersByRole
        .map((user) => String(user.email || '').trim().toLowerCase())
        .filter(Boolean)
    );

    const matchedDonations = snapshot.donations.filter((donation) => {
      const donorEmail = String(donation.donorEmail || '').trim().toLowerCase();
      return donorEmails.has(donorEmail);
    });

    return {
      records: matchedDonations.length,
      amount: matchedDonations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0),
    };
  }, [filteredUsersByRole, snapshot.donations]);

  useEffect(() => {
    if (!visibleUsers.length) {
      setSelectedUserId('');
      setIsEditing(false);
      return;
    }

    if (!visibleUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(visibleUsers[0].id);
      setIsEditing(false);
    }
  }, [visibleUsers, selectedUserId]);

  const selectedUser = visibleUsers.find((user) => user.id === selectedUserId) || null;
  const selectedUserDonationHistory = selectedUser ? donorDonationHistoryByUserId[selectedUser.id] || [] : [];
  const selectedUserTotalDonations = selectedUserDonationHistory.reduce(
    (sum, donation) => sum + Number(donation.amount || 0),
    0
  );

  const openEditForm = (user) => {
    setSelectedUserId(user.id);
    setIsEditing(true);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || '',
      address: user.address || '',
    });
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;

    const name = String(editForm.name || '').trim();
    const email = String(editForm.email || '').trim();
    if (!name || !email) {
      toast.error('Donor name and email are required');
      return;
    }

    const updated = await onUpdateUser(selectedUser.id, {
      name,
      email,
      phone: String(editForm.phone || '').trim(),
      city: String(editForm.city || '').trim(),
      address: String(editForm.address || '').trim(),
    });
    if (updated) {
      setIsEditing(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const shouldDelete = window.confirm(`Delete donor account for "${user.name}"?`);
    if (!shouldDelete) return;
    const deleted = await onDeleteUser(user.id);
    if (deleted && selectedUserId === user.id) {
      setSelectedUserId('');
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Users Management"
        subtitle="Manage all user types: admins, NGOs, donors, volunteers, and visitors."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setStatusFilter('all');
                setSelectedUserId('');
              }}
              className="input-field py-2 text-sm min-w-[140px]"
            >
              <option value="all">All Users</option>
              <option value="admin">Admins</option>
              <option value="ngo">NGOs</option>
              <option value="donor">Donors</option>
              <option value="volunteer">Volunteers</option>
              <option value="visitor">Visitors</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="input-field py-2 text-sm min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">
            {roleFilter === 'all' ? 'Total Users' : `Registered ${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}s`}
          </p>
          <p className="text-2xl font-heading font-bold text-white mt-2">{filteredUsersByRole.length}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Active Users</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">
            {filteredUsersByRole.filter((user) => user.status === 'active').length}
          </p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Blocked Users</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">
            {filteredUsersByRole.filter((user) => user.status === 'blocked').length}
          </p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">
            {roleFilter === 'donor' ? 'Donation Records' : 'Total Records'}
          </p>
          <p className="text-2xl font-heading font-bold text-white mt-2">{donorDonationSummary.records}</p>
          <p className="text-xs text-slate-500 mt-1">{formatCurrency(donorDonationSummary.amount)} total</p>
        </div>
      </div>

      <motion.section variants={fadeInUp} className="dashboard-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="pb-3 pr-3 font-medium">Donor</th>
                <th className="pb-3 pr-3 font-medium">City</th>
                <th className="pb-3 pr-3 font-medium">Joined</th>
                <th className="pb-3 pr-3 font-medium">Donations</th>
                <th className="pb-3 pr-3 font-medium">Total Donated</th>
                <th className="pb-3 pr-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length ? (
                visibleUsers.map((user) => {
                  const userDonationHistory = donorDonationHistoryByUserId[user.id] || [];
                  const userTotalDonated = userDonationHistory.reduce(
                    (sum, donation) => sum + Number(donation.amount || 0),
                    0
                  );
                  const isSelected = selectedUserId === user.id;

                  return (
                    <tr key={user.id} className={`border-b border-white/5 ${isSelected ? 'bg-white/5' : ''}`}>
                      <td className="py-4 pr-3">
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                      </td>
                      <td className="py-4 pr-3 text-slate-300">{user.city || '—'}</td>
                      <td className="py-4 pr-3 text-slate-300">{formatDate(user.joinedAt)}</td>
                      <td className="py-4 pr-3 text-slate-300">{userDonationHistory.length}</td>
                      <td className="py-4 pr-3 text-slate-300">{formatCurrency(userTotalDonated)}</td>
                      <td className="py-4 pr-3"><StatusBadge value={user.status} /></td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setIsEditing(false);
                            }}
                            className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs hover:bg-blue-500/20 transition-colors"
                          >
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditForm(user)}
                            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs hover:bg-white/10 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleUserStatus(user.id)}
                            className={`px-3 py-2 rounded-lg border text-xs transition-colors ${user.status === 'active' ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'}`}
                          >
                            {user.status === 'active' ? 'Block' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No {roleFilter === 'all' ? 'users' : roleFilter + ' accounts'} found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.section variants={fadeInUp} className="dashboard-card xl:col-span-1">
          <SectionTitle title="Donor Profile" subtitle="View details and manage account state." />
          {!selectedUser ? (
            <p className="text-sm text-slate-400">Select a user from the list to view profile details.</p>
          ) : isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input
                value={editForm.name}
                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                className="input-field"
                placeholder="User name"
              />
              <input
                value={editForm.email}
                onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                className="input-field"
                placeholder="Email"
              />
              <input
                value={editForm.phone}
                onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="input-field"
                placeholder="Phone"
              />
              <input
                value={editForm.city}
                onChange={(event) => setEditForm((prev) => ({ ...prev, city: event.target.value }))}
                className="input-field"
                placeholder="City"
              />
              <textarea
                value={editForm.address}
                onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))}
                className="textarea-field min-h-[90px]"
                placeholder="Address"
              />
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary px-4 py-2 text-sm">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-white font-medium mt-1">{selectedUser.name}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-white font-medium mt-1">{selectedUser.email || '—'}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500">Role</p>
                <p className="text-white font-medium mt-1 capitalize">{selectedUser.role || '—'}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-white font-medium mt-1">{selectedUser.phone || '—'}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500">Address</p>
                <p className="text-white font-medium mt-1">{selectedUser.address || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-3">
                  <p className="text-xs text-slate-500">Joined</p>
                  <p className="text-sm text-white mt-1">{formatDate(selectedUser.joinedAt)}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-xs text-slate-500">Last Active</p>
                  <p className="text-sm text-white mt-1">{formatDate(selectedUser.lastSeenAt)}</p>
                </div>
              </div>
              <div className="glass-card p-3">
                <p className="text-xs text-slate-500">Account Status</p>
                <div className="mt-2">
                  <StatusBadge value={selectedUser.status} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEditForm(selectedUser)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-xs hover:bg-white/10 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => onToggleUserStatus(selectedUser.id)}
                  className={`px-3 py-2 rounded-lg border text-xs transition-colors ${selectedUser.status === 'active' ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'}`}
                >
                  {selectedUser.status === 'active' ? 'Block Account' : 'Activate Account'}
                </button>
              </div>
            </div>
          )}
        </motion.section>

        <motion.section variants={fadeInUp} className="dashboard-card xl:col-span-2">
          <SectionTitle 
            title={roleFilter === 'donor' ? 'Donation History' : 'User Details'} 
            subtitle={roleFilter === 'donor' ? 'All donations made by the selected user.' : 'Additional information for the selected user.'} 
          />
          {!selectedUser ? (
            <p className="text-sm text-slate-400">Select a user from the list to view details.</p>
          ) : roleFilter === 'donor' ? (
            <div className="space-y-4">
              <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">Selected Donor</p>
                  <p className="text-base text-white font-medium mt-1">{selectedUser.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Total Donated</p>
                  <p className="text-lg text-white font-semibold mt-1">{formatCurrency(selectedUserTotalDonations)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-white/10">
                      <th className="pb-3 pr-3 font-medium">Date</th>
                      <th className="pb-3 pr-3 font-medium">Campaign</th>
                      <th className="pb-3 pr-3 font-medium">Type</th>
                      <th className="pb-3 pr-3 font-medium">Payment</th>
                      <th className="pb-3 pr-3 font-medium">Receipt</th>
                      <th className="pb-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserDonationHistory.length ? (
                      selectedUserDonationHistory.map((donation) => (
                        <tr key={donation.id} className="border-b border-white/5">
                          <td className="py-3 pr-3 text-slate-300">{formatDate(donation.donatedAt)}</td>
                          <td className="py-3 pr-3 text-slate-200">{donation.campaign || 'General Donation'}</td>
                          <td className="py-3 pr-3"><StatusBadge value={donation.type || 'money'} /></td>
                          <td className="py-3 pr-3"><StatusBadge value={donation.paymentStatus || 'pending'} /></td>
                          <td className="py-3 pr-3 text-slate-300">{donation.receiptNumber || 'Not generated'}</td>
                          <td className="py-3 text-slate-200 font-medium">{formatCurrency(donation.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No donation history available for this user.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500">User ID</p>
                <p className="text-white font-medium mt-1">{selectedUser.id}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500">Role</p>
                <p className="text-white font-medium mt-1 capitalize">{selectedUser.role}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500">Address</p>
                <p className="text-white font-medium mt-1">{selectedUser.address || '—'}</p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500">Last Seen</p>
                <p className="text-white font-medium mt-1">{formatDate(selectedUser.lastSeenAt)}</p>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

const VolunteerManagementSection = ({
  snapshot,
  onAssignTask,
  onAssignPickupVolunteer,
  onCreateVolunteer,
  onRemoveVolunteer,
}) => {
  const [taskForm, setTaskForm] = useState({
    volunteerId: snapshot.volunteers[0]?.id || '',
    taskTitle: '',
    campaignTitle: snapshot.campaigns[0]?.title || 'General Operations',
    dueDate: '',
    shift: 'Morning',
    priority: 'medium',
  });
  const [newVolunteerForm, setNewVolunteerForm] = useState({
    name: '',
    email: '',
    city: '',
    skills: '',
  });
  const [pickupForm, setPickupForm] = useState({
    volunteerId: snapshot.volunteers[0]?.id || '',
    pickupId: snapshot.pickups[0]?.id || '',
  });
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(snapshot.volunteers[0]?.id || '');

  const toPickupStatus = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (['assigned', 'in_progress'].includes(normalized)) return 'scheduled';
    if (['pending', 'approved', 'scheduled', 'completed', 'cancelled', 'rejected'].includes(normalized)) return normalized;
    return 'pending';
  };

  const buildPickupMapUrl = (pickup) => {
    const lat = Number(pickup?.donorLatitude);
    const lng = Number(pickup?.donorLongitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup?.address || '')}`;
  };

  const assignablePickups = useMemo(
    () => snapshot.pickups.filter((pickup) => toPickupStatus(pickup.status) !== 'completed'),
    [snapshot.pickups]
  );

  const assignableVolunteers = useMemo(
    () => snapshot.volunteers,
    [snapshot.volunteers]
  );

  useEffect(() => {
    const defaultVolunteerId = snapshot.volunteers[0]?.id || '';
    const defaultPickupId = assignablePickups[0]?.id || '';

    if (!snapshot.volunteers.some((volunteer) => volunteer.id === taskForm.volunteerId)) {
      setTaskForm((prev) => ({ ...prev, volunteerId: defaultVolunteerId }));
    }

    if (!assignableVolunteers.some((volunteer) => volunteer.id === pickupForm.volunteerId)) {
      const defaultAssignableVolunteerId = assignableVolunteers[0]?.id || '';
      setPickupForm((prev) => ({ ...prev, volunteerId: defaultAssignableVolunteerId }));
    }

    if (!assignablePickups.some((pickup) => pickup.id === pickupForm.pickupId)) {
      setPickupForm((prev) => ({ ...prev, pickupId: defaultPickupId }));
    }

    if (!snapshot.volunteers.some((volunteer) => volunteer.id === selectedVolunteerId)) {
      setSelectedVolunteerId(defaultVolunteerId);
    }
  }, [
    snapshot.volunteers,
    assignableVolunteers,
    assignablePickups,
    taskForm.volunteerId,
    pickupForm.volunteerId,
    pickupForm.pickupId,
    selectedVolunteerId,
  ]);

  const selectedVolunteerSchedule = useMemo(() => {
    const toTime = (value) => {
      const parsed = new Date(String(value || '').trim());
      return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
    };

    return snapshot.pickups
      .filter((pickup) => normalizeVolunteerEntityId(pickup.volunteerId) === normalizeVolunteerEntityId(selectedVolunteerId))
      .slice()
      .sort((left, right) => toTime(left.scheduledFor) - toTime(right.scheduledFor));
  }, [snapshot.pickups, selectedVolunteerId]);

  const handleAssignTask = (event) => {
    event.preventDefault();
    if (!taskForm.volunteerId || !taskForm.taskTitle.trim()) {
      toast.error('Select a volunteer and enter a task title');
      return;
    }
    onAssignTask(taskForm);
    setTaskForm((prev) => ({ ...prev, taskTitle: '', dueDate: '', priority: 'medium' }));
  };

  const handleAddVolunteer = (event) => {
    event.preventDefault();
    const name = String(newVolunteerForm.name || '').trim();
    const email = String(newVolunteerForm.email || '').trim();
    if (!name || !email) {
      toast.error('Enter volunteer name and email');
      return;
    }

    const duplicateEmail = snapshot.volunteers.some(
      (volunteer) => String(volunteer.email || '').trim().toLowerCase() === email.toLowerCase()
    );
    if (duplicateEmail) {
      toast.error('A volunteer with this email already exists');
      return;
    }

    onCreateVolunteer({
      name,
      email,
      city: String(newVolunteerForm.city || '').trim(),
      skills: String(newVolunteerForm.skills || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setNewVolunteerForm({ name: '', email: '', city: '', skills: '' });
  };

  const handleAssignPickup = (event) => {
    event.preventDefault();
    if (!pickupForm.volunteerId || !pickupForm.pickupId) {
      toast.error('Select both pickup request and volunteer');
      return;
    }
    onAssignPickupVolunteer(pickupForm.pickupId, pickupForm.volunteerId);
  };

  const handleRemoveVolunteer = (volunteer) => {
    const shouldRemove = window.confirm(`Remove volunteer "${volunteer.name}" from the system?`);
    if (!shouldRemove) return;
    onRemoveVolunteer(volunteer.id);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Volunteer Management"
        subtitle="Add or remove volunteers, assign pickup tasks, track performance, and monitor schedules with maps."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Total Volunteers</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">{snapshot.volunteers.length}</p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Available</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">
            {snapshot.volunteers.filter((volunteer) => volunteer.availability === 'available').length}
          </p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Busy</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">
            {snapshot.volunteers.filter((volunteer) => volunteer.availability === 'busy').length}
          </p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Assigned Pickups</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">
            {snapshot.pickups.filter((pickup) => String(pickup.volunteerId || '').trim()).length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.form variants={fadeInUp} onSubmit={handleAddVolunteer} className="dashboard-card">
          <SectionTitle title="Add Volunteer" subtitle="Register a new volunteer account for task assignment." />
          <div className="space-y-3">
            <input
              value={newVolunteerForm.name}
              onChange={(event) => setNewVolunteerForm((prev) => ({ ...prev, name: event.target.value }))}
              className="input-field"
              placeholder="Volunteer name"
            />
            <input
              type="email"
              value={newVolunteerForm.email}
              onChange={(event) => setNewVolunteerForm((prev) => ({ ...prev, email: event.target.value }))}
              className="input-field"
              placeholder="Volunteer email"
            />
            <input
              value={newVolunteerForm.city}
              onChange={(event) => setNewVolunteerForm((prev) => ({ ...prev, city: event.target.value }))}
              className="input-field"
              placeholder="City"
            />
            <input
              value={newVolunteerForm.skills}
              onChange={(event) => setNewVolunteerForm((prev) => ({ ...prev, skills: event.target.value }))}
              className="input-field"
              placeholder="Skills (comma separated)"
            />
            <button type="submit" className="btn-primary w-full py-2.5">Add Volunteer</button>
          </div>
        </motion.form>

        <motion.form variants={fadeInUp} onSubmit={handleAssignTask} className="dashboard-card">
          <SectionTitle title="Assign General Task" subtitle="Create schedule tasks and monitor volunteer progress." />
          <div className="space-y-3">
            <select
              value={taskForm.volunteerId}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, volunteerId: event.target.value }))}
              className="input-field"
            >
              <option value="">Select volunteer</option>
              {snapshot.volunteers.map((volunteer) => (
                <option key={volunteer.id} value={volunteer.id}>{volunteer.name}</option>
              ))}
            </select>
            <input
              value={taskForm.taskTitle}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, taskTitle: event.target.value }))}
              className="input-field"
              placeholder="Task title"
            />
            <select
              value={taskForm.campaignTitle}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, campaignTitle: event.target.value }))}
              className="input-field"
            >
              {snapshot.campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.title}>{campaign.title}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                className="input-field"
              />
              <select
                value={taskForm.shift}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, shift: event.target.value }))}
                className="input-field"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
            <select
              value={taskForm.priority}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value }))}
              className="input-field"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button type="submit" className="btn-primary w-full py-2.5">Assign Task</button>
          </div>
        </motion.form>

        <motion.form variants={fadeInUp} onSubmit={handleAssignPickup} className="dashboard-card">
          <SectionTitle title="Assign Pickup Task" subtitle="Assign pickup requests and create volunteer pickup responsibilities." />
          <div className="space-y-3">
            <select
              value={pickupForm.pickupId}
              onChange={(event) => setPickupForm((prev) => ({ ...prev, pickupId: event.target.value }))}
              className="input-field"
            >
              <option value="">Select pickup request</option>
              {assignablePickups.map((pickup) => (
                <option key={pickup.id} value={pickup.id}>
                  {pickup.donorName} • {pickup.scheduledFor || 'No date'}
                </option>
              ))}
            </select>
            <select
              value={pickupForm.volunteerId}
              onChange={(event) => setPickupForm((prev) => ({ ...prev, volunteerId: event.target.value }))}
              className="input-field"
            >
              <option value="">Assign volunteer</option>
              {assignableVolunteers.map((volunteer) => (
                <option key={volunteer.id} value={volunteer.id}>{volunteer.name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!assignablePickups.length || !assignableVolunteers.length}
              className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Pickup
            </button>
            {!assignablePickups.length ? (
              <p className="text-xs text-slate-500">No pending or scheduled pickups to assign.</p>
            ) : null}
          </div>
        </motion.form>
      </div>

      <motion.section variants={fadeInUp} className="dashboard-card">
        <SectionTitle title="Performance Tracking" subtitle="Monitor completion, availability, and assigned workload." />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {snapshot.volunteers.length ? (
            snapshot.volunteers.map((volunteer) => (
              <div key={volunteer.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-medium">{volunteer.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{volunteer.city} • {volunteer.skills.join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={volunteer.availability} />
                    <button
                      type="button"
                      onClick={() => handleRemoveVolunteer(volunteer)}
                      className="px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] hover:bg-red-500/20 transition-colors"
                    >
                      <FiTrash2 className="inline-block mr-1 -mt-0.5" />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Assigned</p>
                    <p className="text-lg font-semibold text-white mt-1">{volunteer.assignedTasks}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Completed</p>
                    <p className="text-lg font-semibold text-white mt-1">{volunteer.completedTasks}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-slate-500">Rating</p>
                    <p className="text-lg font-semibold text-white mt-1">{volunteer.rating.toFixed(1)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Completion Rate</span>
                    <span>{volunteer.completionRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${volunteer.completionRate}%` }} />
                  </div>
                </div>
                <div className="mt-4 text-xs text-slate-400 space-y-1">
                  <p><FiCalendar className="inline-block mr-1 -mt-0.5" /> Next Shift: {volunteer.nextShift}</p>
                  <p><FiActivity className="inline-block mr-1 -mt-0.5" /> Latest Task: {volunteer.tasks[0]?.title || 'No tasks assigned'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-sm text-slate-400">
              No volunteers found. Add a volunteer to start assigning tasks.
            </div>
          )}
        </div>
      </motion.section>

      <motion.section variants={fadeInUp} className="dashboard-card">
        <SectionTitle
          title="Volunteer Schedules & Maps"
          subtitle="View assigned pickup schedules and track locations."
          actions={
            <select
              value={selectedVolunteerId}
              onChange={(event) => setSelectedVolunteerId(event.target.value)}
              className="input-field py-2 text-sm min-w-[220px]"
            >
              <option value="">Select volunteer</option>
              {snapshot.volunteers.map((volunteer) => (
                <option key={volunteer.id} value={volunteer.id}>{volunteer.name}</option>
              ))}
            </select>
          }
        />

        {!selectedVolunteerId ? (
          <p className="text-sm text-slate-400">Select a volunteer to view schedules and pickup map links.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-white/10">
                  <th className="pb-3 pr-3 font-medium">Donor</th>
                  <th className="pb-3 pr-3 font-medium">Items</th>
                  <th className="pb-3 pr-3 font-medium">Schedule</th>
                  <th className="pb-3 pr-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Map</th>
                </tr>
              </thead>
              <tbody>
                {selectedVolunteerSchedule.length ? (
                  selectedVolunteerSchedule.map((pickup) => (
                    <tr key={pickup.id} className="border-b border-white/5">
                      <td className="py-3 pr-3">
                        <p className="text-slate-200">{pickup.donorName}</p>
                        <p className="text-xs text-slate-500 mt-1">{pickup.address}</p>
                      </td>
                      <td className="py-3 pr-3 text-slate-300">{pickup.items?.join(', ') || 'Pickup items'}</td>
                      <td className="py-3 pr-3">
                        <p className="text-slate-200">{formatDate(pickup.scheduledFor)}</p>
                        <p className="text-xs text-slate-500 mt-1">{pickup.timeSlot || 'Time slot pending'}</p>
                      </td>
                      <td className="py-3 pr-3"><StatusBadge value={toPickupStatus(pickup.status)} /></td>
                      <td className="py-3">
                        <a
                          href={buildPickupMapUrl(pickup)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary-500/20 bg-primary-500/10 text-primary-400 text-xs hover:bg-primary-500/20 transition-colors"
                        >
                          <FiMapPin className="w-3.5 h-3.5" />
                          View Map
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No pickup schedule assigned for this volunteer yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </div>
  );
};

const AlertsSection = ({ snapshot, onPublishBanner, onDismissBanner }) => {
  const [form, setForm] = useState({
    title: '',
    message: '',
    category: 'food',
    severity: 'high',
    audience: 'donors',
    expiresAt: '',
  });
  const [editingBannerId, setEditingBannerId] = useState(null);

  const resetForm = () => {
    setForm({
      title: '',
      message: '',
      category: 'food',
      severity: 'high',
      audience: 'donors',
      expiresAt: '',
    });
    setEditingBannerId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Enter both alert title and message');
      return;
    }

    if (editingBannerId) {
      onDismissBanner(editingBannerId);
    }
    onPublishBanner(form);
    resetForm();
  };

  const handleEditBanner = (banner) => {
    setEditingBannerId(banner.id);
    setForm({
      title: banner.title || '',
      message: banner.message || '',
      category: banner.category || 'food',
      severity: banner.severity || 'high',
      audience: banner.audience || 'donors',
      expiresAt: banner.expiresAt || '',
    });
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Urgent Needs"
        subtitle="Create urgent request banners for donors, edit alerts, and delete resolved needs."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.form variants={fadeInUp} onSubmit={handleSubmit} className="dashboard-card xl:col-span-1">
          <SectionTitle
            title={editingBannerId ? 'Edit Alert' : 'Create Alert'}
            subtitle="Publish urgent request banners and highlight donor actions."
          />
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="Alert title"
            />
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              className="textarea-field min-h-[120px]"
              placeholder="Alert message"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="select-field"
            >
              <option value="food">Food</option>
              <option value="clothes">Clothes</option>
              <option value="medicine">Medicine</option>
              <option value="shelter">Shelter</option>
              <option value="funds">Funds</option>
              <option value="other">Other</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.severity}
                onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}
                className="select-field"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={form.audience}
                onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
                className="select-field"
              >
                <option value="donors">Donors</option>
                <option value="all">All Users</option>
                <option value="volunteers">Volunteers</option>
                <option value="ngos">NGOs</option>
              </select>
            </div>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              className="input-field"
            />
            <button type="submit" className="btn-primary w-full py-2.5">
              {editingBannerId ? 'Update Alert' : 'Create Alert'}
            </button>
            {editingBannerId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </motion.form>

        <motion.section variants={fadeInUp} className="dashboard-card xl:col-span-2">
          <SectionTitle
            title="Active Alerts"
            subtitle="Review active urgent notices and manage lifecycle actions."
          />
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {snapshot.banners.map((banner) => (
              <div key={banner.id} className="glass-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-medium">{banner.title}</p>
                    <p className="text-sm text-slate-400 mt-1">{banner.message}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase ${severityTone[banner.severity] || severityTone.medium}`}>
                      {banner.severity}
                    </span>
                    <StatusBadge value={banner.status} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Type: {String(banner.category || 'other').replace(/_/g, ' ')}</span>
                  <span>Audience: {banner.audience}</span>
                  <span>Created {formatDate(banner.createdAt)}</span>
                  <span>Expires {formatDate(banner.expiresAt)}</span>
                  <div className="flex items-center gap-3">
                    {banner.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleEditBanner(banner)}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {banner.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => onDismissBanner(banner.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete Alert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

const NotificationsSection = ({ snapshot, onPublishBanner, onDismissBanner }) => {
  const [form, setForm] = useState({
    title: '',
    message: '',
    notificationType: 'system',
    severity: 'medium',
    audience: 'all',
    deliveryChannel: 'in_app',
    emailSubject: '',
    customEmails: '',
    expiresAt: '',
  });

  const pendingCampaignApprovals = snapshot.workflowItems.filter((item) => item.status === 'pending').length;
  const pendingPickupRequests = snapshot.pickups.filter((item) => ['pending', 'scheduled', 'assigned'].includes(item.status)).length;
  const failedOrProcessingPayments = snapshot.donations.filter((item) => ['failed', 'processing', 'pending'].includes(item.paymentStatus)).length;
  const blockedUsers = snapshot.users.filter((item) => item.status === 'blocked').length;

  const newUsersRegistered = snapshot.users.filter((item) => {
    const rawDate = String(item.joinedAt || '').trim();
    if (!rawDate) return false;
    const joinedAt = new Date(rawDate);
    if (Number.isNaN(joinedAt.getTime())) return false;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return joinedAt.getTime() >= sevenDaysAgo;
  }).length;

  const systemNotifications = [
    {
      id: 'sys-new-user-registered',
      title: 'New user registered',
      detail: `${newUsersRegistered} users joined in the last 7 days`,
      status: newUsersRegistered > 0 ? 'active' : 'completed',
    },
    {
      id: 'sys-pickup-pending',
      title: 'Pickup pending',
      detail: `${pendingPickupRequests} pickup requests need assignment or completion`,
      status: pendingPickupRequests > 0 ? 'pending' : 'completed',
    },
    {
      id: 'sys-campaign-approvals',
      title: 'Campaign approvals pending',
      detail: `${pendingCampaignApprovals} campaign requests waiting for admin review`,
      status: pendingCampaignApprovals > 0 ? 'pending' : 'completed',
    },
    {
      id: 'sys-payment-status',
      title: 'Payment monitoring',
      detail: `${failedOrProcessingPayments} donations in failed/pending/processing state`,
      status: failedOrProcessingPayments > 0 ? 'processing' : 'completed',
    },
    {
      id: 'sys-user-risk',
      title: 'User safety controls',
      detail: `${blockedUsers} accounts currently blocked by admin policy`,
      status: blockedUsers > 0 ? 'blocked' : 'active',
    },
  ];

  const sentNotifications = useMemo(
    () =>
      snapshot.banners.filter((banner) => {
        const origin = String(banner.origin || '').trim().toLowerCase();
        const category = String(banner.category || '').trim().toLowerCase();
        const hasNotificationType = Boolean(String(banner.notificationType || '').trim());
        return origin === 'notifications' || category === 'notification' || hasNotificationType;
      }),
    [snapshot.banners]
  );

  const resetForm = () => {
    setForm({
      title: '',
      message: '',
      notificationType: 'system',
      severity: 'medium',
      audience: 'all',
      deliveryChannel: 'in_app',
      emailSubject: '',
      customEmails: '',
      expiresAt: '',
    });
  };

  const applyTemplate = (template) => {
    setForm((prev) => ({
      ...prev,
      ...template,
      emailSubject: template.emailSubject || template.title || prev.emailSubject,
    }));
  };

  const handleSendNotification = async (event) => {
    event.preventDefault();
    const title = String(form.title || '').trim();
    const message = String(form.message || '').trim();
    if (!title || !message) {
      toast.error('Enter notification title and message');
      return;
    }

    const sendEmail = form.deliveryChannel === 'in_app_email';
    const recipientEmails = String(form.customEmails || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      title,
      message,
      notificationType: form.notificationType,
      type: form.notificationType,
      severity: form.severity,
      audience: form.audience,
      category: 'notification',
      origin: 'notifications',
      expiresAt: form.expiresAt,
      deliveryChannel: form.deliveryChannel,
      sendEmail,
      emailSubject: String(form.emailSubject || title).trim(),
      emailRecipients: recipientEmails,
      emailStatus: sendEmail ? 'queued' : 'not_requested',
    };

    if (sendEmail) {
      const emailResult = await api.sendAdminNotificationEmail(payload);
      if (emailResult.success) {
        payload.emailStatus = 'sent';
      } else {
        payload.emailStatus = 'failed';
        toast.error(emailResult.error || 'Email sending failed. Notification saved in-app.');
      }
    }

    onPublishBanner(payload);
    resetForm();
  };

  const formatChannelLabel = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'in_app_email') return 'In-app + Email';
    return 'In-app';
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Notifications"
        subtitle="Send and manage alerts for donors, volunteers, system alerts, campaign updates, and pickup updates."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.form variants={fadeInUp} onSubmit={handleSendNotification} className="dashboard-card xl:col-span-1">
          <SectionTitle title="Send Alerts" subtitle="Choose audience, update type, and send via in-app or email." />
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyTemplate({ title: 'New user registered', message: 'A new donor account has been registered and is awaiting onboarding workflow checks.', notificationType: 'system', audience: 'all', severity: 'medium' })}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10 transition-colors"
              >
                New user registered
              </button>
              <button
                type="button"
                onClick={() => applyTemplate({ title: 'Pickup pending', message: 'There are pending pickup requests awaiting volunteer assignment.', notificationType: 'pickup', audience: 'volunteers', severity: 'high' })}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10 transition-colors"
              >
                Pickup pending
              </button>
            </div>

            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="Notification title"
            />
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              className="textarea-field min-h-[120px]"
              placeholder="Notification message"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.audience}
                onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
                className="select-field"
              >
                <option value="all">All Users</option>
                <option value="donors">Donors</option>
                <option value="volunteers">Volunteers</option>
                <option value="ngos">NGOs</option>
              </select>
              <select
                value={form.notificationType}
                onChange={(e) => setForm((prev) => ({ ...prev, notificationType: e.target.value }))}
                className="select-field"
              >
                <option value="system">System Alert</option>
                <option value="campaign">Campaign Update</option>
                <option value="pickup">Pickup Update</option>
                <option value="donation">Donor Update</option>
                <option value="task">Volunteer Task Update</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.severity}
                onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}
                className="select-field"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={form.deliveryChannel}
                onChange={(e) => setForm((prev) => ({ ...prev, deliveryChannel: e.target.value }))}
                className="select-field"
              >
                <option value="in_app">In-app only</option>
                <option value="in_app_email">In-app + Email</option>
              </select>
            </div>
            {form.deliveryChannel === 'in_app_email' ? (
              <>
                <input
                  value={form.emailSubject}
                  onChange={(e) => setForm((prev) => ({ ...prev, emailSubject: e.target.value }))}
                  className="input-field"
                  placeholder="Email subject"
                />
                <input
                  value={form.customEmails}
                  onChange={(e) => setForm((prev) => ({ ...prev, customEmails: e.target.value }))}
                  className="input-field"
                  placeholder="Optional recipient emails (comma separated)"
                />
              </>
            ) : null}
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              className="input-field"
            />
            <button type="submit" className="btn-primary w-full py-2.5">
              Send Notification
            </button>
          </div>
        </motion.form>

        <motion.section variants={fadeInUp} className="dashboard-card xl:col-span-2">
          <SectionTitle title="System Notifications" subtitle="Live operational updates for admin action." />
          <div className="space-y-3 mb-6">
            {systemNotifications.map((notification) => (
              <div key={notification.id} className="glass-card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white font-medium">{notification.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{notification.detail}</p>
                </div>
                <StatusBadge value={notification.status} />
              </div>
            ))}
          </div>

          <SectionTitle title="Recent Sent Notifications" subtitle="Manage sent alerts and email delivery status." />
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {sentNotifications.length ? (
              sentNotifications.slice(0, 12).map((banner) => (
                <div key={banner.id} className="glass-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-medium">{banner.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{banner.message}</p>
                    </div>
                    <StatusBadge value={banner.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Type: {banner.notificationType || 'system'}</span>
                    <span>Audience: {banner.audience}</span>
                    <span>Channel: {formatChannelLabel(banner.deliveryChannel)}</span>
                    <span>Email: {banner.sendEmail ? (banner.emailStatus || 'queued') : 'Not sent'}</span>
                    <span>Created {formatDate(banner.createdAt)}</span>
                    {banner.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => onDismissBanner(banner.id)}
                        className="text-red-400 hover:text-red-300 transition-colors ml-auto"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400 py-6 text-center">
                No sent notifications yet.
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

const ReportsSection = ({ snapshot, onExportPdf, onExportCsv }) => {
  const totalAssignedTasks = snapshot.volunteers.reduce(
    (sum, volunteer) => sum + Number(volunteer.assignedTasks || 0),
    0
  );
  const totalCompletedTasks = snapshot.volunteers.reduce(
    (sum, volunteer) => sum + Number(volunteer.completedTasks || 0),
    0
  );
  const pickupStatusCounts = snapshot.pickups.reduce(
    (acc, pickup) => {
      const normalizedStatus = String(pickup.status || '').trim().toLowerCase();
      if (['assigned', 'in_progress'].includes(normalizedStatus)) {
        acc.scheduled += 1;
      } else if (normalizedStatus === 'completed') {
        acc.completed += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    },
    { pending: 0, scheduled: 0, completed: 0 }
  );
  const totalPickups = snapshot.pickups.length;
  const pickupCompletionRate = totalPickups
    ? Math.round((pickupStatusCounts.completed / totalPickups) * 100)
    : 0;

  const donationTypeRows = snapshot.donationTypeBreakdown
    .slice()
    .sort((left, right) => Number(right.value || 0) - Number(left.value || 0));

  const volunteerActivityRows = snapshot.volunteers
    .slice()
    .sort((left, right) => Number(right.completedTasks || 0) - Number(left.completedTasks || 0));

  const volunteerActivityChartData = volunteerActivityRows.slice(0, 6).map((volunteer) => ({
    name: String(volunteer.name || 'Volunteer').split(' ')[0],
    assigned: Number(volunteer.assignedTasks || 0),
    completed: Number(volunteer.completedTasks || 0),
  }));
  const hasVolunteerActivityData = volunteerActivityChartData.some(
    (item) => Number(item.assigned || 0) > 0 || Number(item.completed || 0) > 0
  );

  const campaignPerformanceData = snapshot.topCampaigns.slice(0, 6).map((campaign) => ({
    name:
      String(campaign.title || 'Campaign').length > 18
        ? `${String(campaign.title).slice(0, 18)}…`
        : String(campaign.title || 'Campaign'),
    raised: Number(campaign.collectedAmount || 0),
    target: Number(campaign.targetAmount || 0),
  }));

  const donationTotal = Number(snapshot.stats?.totalDonations || 0);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Reports & Analytics"
        subtitle="Generate financial and operational reports with donation, volunteer, and campaign analytics."
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={onExportPdf} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-colors text-sm">
              <FiDownload className="inline-block mr-1 -mt-0.5" /> Export PDF
            </button>
            <button onClick={onExportCsv} className="px-4 py-2 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm">
              <FiDownload className="inline-block mr-1 -mt-0.5" /> Export Excel (.csv)
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Total Donations</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">
            {formatCurrency(snapshot.stats.totalDonations)}
          </p>
          <p className="text-xs text-slate-500 mt-2">Financial summary across all donations</p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Campaign Performance</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">{snapshot.campaigns.length}</p>
          <p className="text-xs text-slate-500 mt-2">Total campaigns tracked in current reporting data</p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Volunteer Tasks</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">{totalCompletedTasks}/{totalAssignedTasks}</p>
          <p className="text-xs text-slate-500 mt-2">Completed vs assigned volunteer tasks</p>
        </div>
        <div className="dashboard-card">
          <p className="text-sm text-slate-400">Pickup Completion</p>
          <p className="text-2xl font-heading font-bold text-white mt-2">{pickupCompletionRate}%</p>
          <p className="text-xs text-slate-500 mt-2">Operational completion rate for pickup requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.section variants={fadeInUp} className="dashboard-card xl:col-span-2">
          <SectionTitle title="Donation Trend Report" subtitle="Monthly contribution values over the last six months." />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={snapshot.monthlyDonations}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
              <Tooltip content={<ChartTooltip prefix="₹" />} />
              <Bar dataKey="donations" radius={[8, 8, 0, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.section>

        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle title="Donation Mix" subtitle="Distribution by donation category." />
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={snapshot.donationTypeBreakdown} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={3}>
                {snapshot.donationTypeBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip prefix="₹" />} />
            </PieChart>
          </ResponsiveContainer>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle title="Volunteer Activity Report" subtitle="Assigned and completed tasks for top volunteers." />
          {hasVolunteerActivityData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volunteerActivityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  formatter={(value, label) => [Number(value || 0).toLocaleString('en-IN'), label]}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.96)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 12 }}
                  labelStyle={{ color: '#cbd5e1' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                <Bar dataKey="assigned" name="Assigned" radius={[6, 6, 0, 0]} fill="#60a5fa" />
                <Bar dataKey="completed" name="Completed" radius={[6, 6, 0, 0]} fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center text-center px-6">
              <div>
                <p className="text-sm text-slate-200 font-medium">No volunteer task activity yet</p>
                <p className="text-xs text-slate-500 mt-1">Assigned/completed bars appear after task or pickup data is synced.</p>
              </div>
            </div>
          )}
        </motion.section>

        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle title="Campaign Performance Report" subtitle="Raised amount vs target for top-performing campaigns." />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
              <Tooltip
                formatter={(value, label) => [formatCurrency(value), label]}
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.96)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 12 }}
                labelStyle={{ color: '#cbd5e1' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="raised" name="Raised" radius={[6, 6, 0, 0]} fill="#3b82f6" />
              <Bar dataKey="target" name="Target" radius={[6, 6, 0, 0]} fill="#a78bfa" />
            </BarChart>
          </ResponsiveContainer>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle title="Donation Report Table" subtitle="Category-wise contribution amount and share." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-white/10">
                  <th className="pb-3 pr-3 font-medium">Category</th>
                  <th className="pb-3 pr-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {donationTypeRows.map((row) => {
                  const share = donationTotal ? Math.round((Number(row.value || 0) / donationTotal) * 100) : 0;
                  return (
                    <tr key={row.name} className="border-b border-white/5">
                      <td className="py-3 pr-3 text-slate-200 capitalize">{row.name}</td>
                      <td className="py-3 pr-3 text-slate-200">{formatCurrency(row.value)}</td>
                      <td className="py-3 text-slate-300">{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.section>

        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle title="Volunteer Report Table" subtitle="Volunteer utilization and schedule indicators." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-white/10">
                  <th className="pb-3 pr-3 font-medium">Volunteer</th>
                  <th className="pb-3 pr-3 font-medium">Assigned</th>
                  <th className="pb-3 pr-3 font-medium">Completed</th>
                  <th className="pb-3 pr-3 font-medium">Completion</th>
                  <th className="pb-3 font-medium">Next Shift</th>
                </tr>
              </thead>
              <tbody>
                {volunteerActivityRows.map((volunteer) => (
                  <tr key={volunteer.id} className="border-b border-white/5">
                    <td className="py-3 pr-3 text-slate-200">{volunteer.name}</td>
                    <td className="py-3 pr-3 text-slate-300">{volunteer.assignedTasks}</td>
                    <td className="py-3 pr-3 text-slate-300">{volunteer.completedTasks}</td>
                    <td className="py-3 pr-3 text-slate-300">{volunteer.completionRate}%</td>
                    <td className="py-3 text-slate-300">{volunteer.nextShift || 'Not scheduled'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle title="Payment Status" subtitle="Current payment processing breakdown." />
          <div className="space-y-3">
            {snapshot.paymentStatusBreakdown.map((status) => (
              <div key={status.name} className="glass-card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white font-medium capitalize">{status.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{status.value} donation records</p>
                </div>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.fill }} />
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={fadeInUp} className="dashboard-card">
          <SectionTitle title="Pickup Operations" subtitle="Operational status summary for pickup workflow." />
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-xl text-white font-semibold mt-1">{pickupStatusCounts.pending}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-slate-500">Scheduled</p>
              <p className="text-xl text-white font-semibold mt-1">{pickupStatusCounts.scheduled}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xs text-slate-500">Completed</p>
              <p className="text-xl text-white font-semibold mt-1">{pickupStatusCounts.completed}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Operational completion rate: {pickupCompletionRate}% ({pickupStatusCounts.completed} of {totalPickups} pickups)
          </p>
        </motion.section>
      </div>
    </div>
  );
};

const SettingsSection = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
  });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    setProfile({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
    });
  }, [user]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const result = await api.updateProfile(profile);
    if (result.success && result.data) {
      updateUser(result.data);
      toast.success('Profile updated successfully');
      return;
    }

    if (!user?.token && !user?.accessToken) {
      updateUser(profile);
      toast.success('Profile updated locally');
      return;
    }

    toast.error(result.error || 'Unable to update profile');
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error('Enter current and new password');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const result = await api.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
    if (result.success) {
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
      return;
    }
    toast.error(result.error || 'Unable to change password');
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    if (!deletePassword.trim()) {
      toast.error('Enter your password to delete the account');
      return;
    }

    const result = await api.deleteAccount(deletePassword);
    if (result.success) {
      logout();
      toast.success('Account deleted successfully');
      navigate('/');
      return;
    }

    toast.error(result.error || 'Unable to delete account');
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Admin Settings"
        subtitle="Manage your profile, change your password, or permanently delete the account."
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.form variants={fadeInUp} onSubmit={handleSaveProfile} className="dashboard-card space-y-4">
          <SectionTitle title="Profile" subtitle="Update admin identity and contact information." />
          <input value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} className="input-field" placeholder="Name" />
          <input value={user?.email || ''} disabled className="input-field opacity-70 cursor-not-allowed" placeholder="Email" />
          <div className="grid grid-cols-2 gap-3">
            <input value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} className="input-field" placeholder="Phone" />
            <input value={profile.city} onChange={(e) => setProfile((prev) => ({ ...prev, city: e.target.value }))} className="input-field" placeholder="City" />
          </div>
          <textarea value={profile.address} onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))} className="textarea-field min-h-[120px]" placeholder="Address" />
          <button type="submit" className="btn-primary w-full py-2.5">
            <FiUser className="inline-block mr-1 -mt-0.5" /> Save Profile
          </button>
        </motion.form>

        <motion.form variants={fadeInUp} onSubmit={handleChangePassword} className="dashboard-card space-y-4">
          <SectionTitle title="Password" subtitle="Secure the account with a fresh password." />
          <input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))} className="input-field" placeholder="Current password" />
          <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} className="input-field" placeholder="New password" />
          <input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="input-field" placeholder="Confirm new password" />
          <button type="submit" className="btn-primary w-full py-2.5">
            <FiLock className="inline-block mr-1 -mt-0.5" /> Update Password
          </button>
        </motion.form>
      </div>

      <motion.form variants={fadeInUp} onSubmit={handleDeleteAccount} className="dashboard-card border border-red-500/30 space-y-4">
        <SectionTitle title="Account Deletion" subtitle="This action is permanent and removes access to the admin dashboard." />
        <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="input-field" placeholder="Enter password to confirm deletion" />
        <button type="submit" className="w-full py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">
          <FiTrash2 className="inline-block mr-1 -mt-0.5" /> Delete Account
        </button>
      </motion.form>
    </div>
  );
};

const MenuManagementSection = ({ menuItems, isSaving, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  const [createForm, setCreateForm] = useState({
    key: '',
    label: '',
    path: '/dashboard/admin/',
    iconKey: 'settings',
    sortOrder: 1,
    enabled: true,
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    key: '',
    label: '',
    path: '',
    iconKey: '',
    sortOrder: 1,
    enabled: true,
  });

  const buildPayload = (form) => ({
    key: String(form.key || '').trim().toLowerCase(),
    label: String(form.label || '').trim(),
    path: String(form.path || '').trim(),
    iconKey: String(form.iconKey || '').trim().toLowerCase(),
    sortOrder: Math.max(1, Number(form.sortOrder || 1)),
    enabled: Boolean(form.enabled),
  });

  const handleCreate = async (event) => {
    event.preventDefault();
    const payload = buildPayload(createForm);
    if (!payload.key || !payload.label || !payload.path) {
      toast.error('Key, label and path are required');
      return;
    }
    await onCreateMenuItem(payload);
    setCreateForm({
      key: '',
      label: '',
      path: '/dashboard/admin/',
      iconKey: 'settings',
      sortOrder: Math.max(1, menuItems.length + 1),
      enabled: true,
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      key: item.key,
      label: item.label,
      path: item.path,
      iconKey: item.iconKey || 'settings',
      sortOrder: Math.max(1, Number(item.sortOrder || 1)),
      enabled: Boolean(item.enabled),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      key: '',
      label: '',
      path: '',
      iconKey: '',
      sortOrder: 1,
      enabled: true,
    });
  };

  const saveEdit = async () => {
    const payload = buildPayload(editForm);
    if (!payload.key || !payload.label || !payload.path) {
      toast.error('Key, label and path are required');
      return;
    }
    await onUpdateMenuItem(editingId, payload);
    cancelEdit();
  };

  const toggleEnabled = async (item) => {
    await onUpdateMenuItem(item.id, {
      key: item.key,
      label: item.label,
      path: item.path,
      iconKey: item.iconKey || 'settings',
      sortOrder: Math.max(1, Number(item.sortOrder || 1)),
      enabled: !item.enabled,
    });
  };

  return (
    <div className="space-y-6">
      <SectionTitle title="Menu Management" subtitle="CRUD operations for admin sidebar menu in MySQL." />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.form variants={fadeInUp} onSubmit={handleCreate} className="dashboard-card xl:col-span-1 space-y-3">
          <SectionTitle title="Create Menu Item" subtitle="Add a new admin sidebar entry." />
          <input
            value={createForm.key}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, key: event.target.value }))}
            className="input-field"
            placeholder="menu key"
          />
          <input
            value={createForm.label}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, label: event.target.value }))}
            className="input-field"
            placeholder="menu label"
          />
          <input
            value={createForm.path}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, path: event.target.value }))}
            className="input-field"
            placeholder="/dashboard/admin/..."
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={createForm.iconKey}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, iconKey: event.target.value }))}
              className="input-field"
              placeholder="icon key"
            />
            <input
              type="number"
              min="1"
              value={createForm.sortOrder}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
              className="input-field"
              placeholder="sort order"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(createForm.enabled)}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, enabled: event.target.checked }))}
            />
            Enabled
          </label>
          <button type="submit" disabled={isSaving} className="btn-primary w-full py-2.5 disabled:opacity-60">
            {isSaving ? 'Saving...' : 'Create'}
          </button>
        </motion.form>

        <motion.section variants={fadeInUp} className="dashboard-card xl:col-span-2">
          <SectionTitle title="Existing Menu Items" subtitle="Edit, enable/disable and delete menu rows." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-white/10">
                  <th className="pb-3 pr-3 font-medium">Key</th>
                  <th className="pb-3 pr-3 font-medium">Label</th>
                  <th className="pb-3 pr-3 font-medium">Path</th>
                  <th className="pb-3 pr-3 font-medium">Order</th>
                  <th className="pb-3 pr-3 font-medium">Enabled</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="border-b border-white/5 align-top">
                      <td className="py-3 pr-3">
                        {isEditing ? (
                          <input
                            value={editForm.key}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, key: event.target.value }))}
                            className="input-field"
                          />
                        ) : (
                          <span className="text-slate-200">{item.key}</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {isEditing ? (
                          <input
                            value={editForm.label}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, label: event.target.value }))}
                            className="input-field"
                          />
                        ) : (
                          <span className="text-slate-200">{item.label}</span>
                        )}
                      </td>
                      <td className="py-3 pr-3 min-w-[220px]">
                        {isEditing ? (
                          <input
                            value={editForm.path}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, path: event.target.value }))}
                            className="input-field"
                          />
                        ) : (
                          <span className="text-slate-300">{item.path}</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={editForm.sortOrder}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                            className="input-field"
                          />
                        ) : (
                          <span className="text-slate-200">{item.sortOrder}</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {isEditing ? (
                          <label className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={Boolean(editForm.enabled)}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                            />
                            Enabled
                          </label>
                        ) : (
                          <StatusBadge value={item.enabled ? 'active' : 'blocked'} />
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <button type="button" onClick={saveEdit} disabled={isSaving} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60">
                                Save
                              </button>
                              <button type="button" onClick={cancelEdit} className="btn-ghost px-3 py-1.5 text-xs">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button type="button" onClick={() => startEdit(item)} className="btn-secondary px-3 py-1.5 text-xs">
                                Edit
                              </button>
                              <button type="button" onClick={() => toggleEnabled(item)} disabled={isSaving} className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-60">
                                {item.enabled ? 'Disable' : 'Enable'}
                              </button>
                              <button type="button" onClick={() => onDeleteMenuItem(item)} disabled={isSaving} className="px-3 py-1.5 text-xs rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-60">
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const contentRef = useRef(null);
  const donationFiltersRef = useRef(DEFAULT_DONATION_FILTERS);
  const backendMenuSyncRef = useRef(0);
  const [snapshot, setSnapshot] = useState(() => buildBackendFirstAdminSnapshot());
  const [adminSections, setAdminSections] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuSaving, setMenuSaving] = useState(false);
  const [menuError, setMenuError] = useState('');
  const [backendStats, setBackendStats] = useState(null);
  const [donationFilters, setDonationFilters] = useState(DEFAULT_DONATION_FILTERS);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsError, setDonationsError] = useState('');

  const refreshSnapshot = useCallback(() => {
    const localSnapshot = getAdminDashboardSnapshot();
    setSnapshot((previousSnapshot) =>
      mergeAdminSnapshotCollections(localSnapshot, {
        campaigns: previousSnapshot.campaigns,
        donations: previousSnapshot.donations,
        users: previousSnapshot.users,
        volunteers: previousSnapshot.volunteers,
        pickups: previousSnapshot.pickups,
      })
    );
  }, []);

  const loadBackendStats = useCallback(async () => {
    const result = await api.getStats();
    if (result.success && result.data) {
      setBackendStats(result.data);
    }
  }, []);

  const loadAdminMenuSections = useCallback(async () => {
    setMenuLoading(true);
    setMenuError('');

    const result = await api.getAdminMenuItemsAll();
    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      const normalized = result.data
        .map((item, index) => normalizeAdminSection(item, index))
        .sort((left, right) => {
          const leftOrder = Number(left.sortOrder || 0);
          const rightOrder = Number(right.sortOrder || 0);
          if (leftOrder === rightOrder) {
            return String(left.key || '').localeCompare(String(right.key || ''));
          }
          return leftOrder - rightOrder;
        });
      setMenuItems(normalized);
      setAdminSections(normalized.filter((item) => item.enabled));
      setMenuLoading(false);
      return;
    }

    setMenuItems([]);
    setAdminSections([]);
    setMenuError(result.error || 'Admin menu is empty in database.');
    setMenuLoading(false);
  }, []);

  const loadAdminMenuCollections = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - backendMenuSyncRef.current < 15000) {
      return;
    }
    backendMenuSyncRef.current = now;

    const [campaignsResult, usersResult, pickupsResult, volunteersResult] = await Promise.all([
      api.getAdminCampaigns({ page: 0, size: 300 }),
      api.getAdminUsers({ page: 0, size: 500 }),
      api.getAdminPickups({ statuses: ['pending', 'approved', 'scheduled', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected'] }),
      api.getAdminVolunteers({ page: 0, size: 300 }),
    ]);

    setSnapshot((previousSnapshot) => {
      const updates = {};
      let hasSuccessfulUpdate = false;
      let normalizedUsers = null;

      if (campaignsResult.success && Array.isArray(campaignsResult.data)) {
        updates.campaigns = campaignsResult.data.map((item, index) =>
          normalizeAdminCampaignRecord(item, index)
        );
        hasSuccessfulUpdate = true;
      }

      if (usersResult.success && Array.isArray(usersResult.data)) {
        normalizedUsers = usersResult.data.map((item, index) =>
          normalizeAdminUserRecord(item, index)
        );
        updates.users = normalizedUsers;
        hasSuccessfulUpdate = true;
      }

      if (pickupsResult.success && Array.isArray(pickupsResult.data)) {
        updates.pickups = pickupsResult.data.map((item, index) =>
          normalizeAdminPickupRecord(item, index)
        );
        hasSuccessfulUpdate = true;
      }

      if (volunteersResult.success && Array.isArray(volunteersResult.data)) {
        updates.volunteers = volunteersResult.data.map((item, index) =>
          buildVolunteerProfileFromUser(item, index)
        );
        hasSuccessfulUpdate = true;
      } else if (Array.isArray(normalizedUsers)) {
        updates.volunteers = normalizedUsers
          .filter((entry) => String(entry.role || '').trim().toLowerCase() === 'volunteer')
          .map((entry, index) => buildVolunteerProfileFromUser(entry, index));
        hasSuccessfulUpdate = true;
      }

      if (!hasSuccessfulUpdate) {
        return previousSnapshot;
      }

      return mergeAdminSnapshotCollections(previousSnapshot, updates);
    });
  }, []);

  const loadAdminDonations = useCallback(async (filters = donationFiltersRef.current) => {
    setDonationsLoading(true);
    setDonationsError('');
    const result = await api.getAdminDonations({
      ...filters,
      size: 200,
    });

    if (result.success && Array.isArray(result.data)) {
      setSnapshot((prev) =>
        mergeAdminSnapshotCollections(prev, {
          donations: result.data.map((item) => normalizeAdminDonationRecord(item)),
        })
      );
      setDonationsLoading(false);
      return;
    }

    setDonationsError(result.error || 'Unable to load donations');
    setDonationsLoading(false);
  }, []);

  useEffect(() => {
    refreshSnapshot();
    loadBackendStats();
    loadAdminMenuSections();
    loadAdminMenuCollections(true);
    return subscribeAdminUpdates(() => {
      refreshSnapshot();
      loadAdminDonations(donationFiltersRef.current);
    });
  }, [loadAdminDonations, loadAdminMenuCollections, loadAdminMenuSections, loadBackendStats, refreshSnapshot]);

  useEffect(() => {
    donationFiltersRef.current = donationFilters;
    loadAdminDonations(donationFilters);
  }, [donationFilters, loadAdminDonations]);

  const mergedStats = useMemo(
    () => ({
      totalDonations: backendStats?.total_donations ?? snapshot.stats.totalDonations,
      activeCampaigns: backendStats?.active_campaigns ?? snapshot.stats.activeCampaigns,
      pendingRequests: snapshot.stats.pendingRequests,
      volunteersCount: backendStats?.volunteers_active ?? snapshot.stats.volunteersCount,
    }),
    [backendStats, snapshot.stats]
  );

  const visibleSections = useMemo(
    () => adminSections.filter((section) => canAccessAdminSection(user, section.key)),
    [adminSections, user]
  );

  const matchedSection = useMemo(() => {
    return adminSections.find((section) =>
      section.key === 'overview'
        ? location.pathname === section.path
        : location.pathname.startsWith(section.path)
    );
  }, [adminSections, location.pathname]);

  const activeSection = matchedSection?.key || 'overview';

  const currentSection = useMemo(() => {
    if (canAccessAdminSection(user, activeSection)) {
      return activeSection;
    }
    return visibleSections[0]?.key || 'overview';
  }, [activeSection, user, visibleSections]);

  useEffect(() => {
    if (['overview', 'campaigns', 'pickups', 'users', 'volunteers', 'reports'].includes(currentSection)) {
      loadAdminMenuCollections();
    }
  }, [currentSection, loadAdminMenuCollections]);

  useEffect(() => {
    const fallbackPath = visibleSections[0]?.path || getDashboardPathByRole(user?.role);
    if (menuLoading || !visibleSections.length) {
      return;
    }

    if (!canAccessAdminSection(user, activeSection)) {
      navigate(fallbackPath, {
        replace: true,
        state: { from: location, reason: 'role_forbidden' },
      });
    }
  }, [activeSection, location, menuLoading, navigate, user, visibleSections]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const pickupCreated = params.get('pickupCreated') === '1';
    if (!pickupCreated) return;

    const pickupId = String(params.get('pickupId') || '').trim();
    toast.success(pickupId ? `Pickup ${pickupId} is now visible in Pickup Requests.` : 'Pickup request created successfully.');
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const handleReviewSubmission = (id, action, reviewNote) => {
    reviewAdminCampaignSubmission({ id, action, reviewNote, reviewedBy: 'Admin' });
    toast.success(`Campaign ${action === 'approve' ? 'approved' : 'rejected'}`);
    refreshSnapshot();
  };

  const handleCreateCampaign = async (payload) => {
    try {
      const response = await api.createCampaign({
        title: payload?.title,
        description: payload?.description,
        donationType: payload?.type || payload?.donationType,
        targetAmount: payload?.targetAmount,
        startDate: payload?.startDate,
        endDate: payload?.endDate,
        city: payload?.city,
        state: payload?.state,
      });

      if (!response?.success) {
        throw new Error(response?.error || 'Campaign creation failed');
      }

      toast.success('Campaign created successfully');
      await loadAdminMenuCollections(true);
    } catch (error) {
      toast.error(String(error?.message || 'Failed to create campaign'));
    }
  };

  const handleUpdateCampaignProgress = async (campaignId, value) => {
    const campaign = snapshot.campaigns.find((item) => item.id === campaignId);
    const backendCampaignId = resolveBackendCampaignId(campaign?.campaign_id ?? campaign?.id ?? campaignId);
    if (!backendCampaignId) {
      toast.error('Unable to resolve database campaign id');
      return;
    }

    try {
      const response = await api.updateCampaign(backendCampaignId, {
        title: campaign?.title,
        description: campaign?.description,
        donationType: campaign?.type,
        targetAmount: campaign?.targetAmount,
        startDate: campaign?.startDate,
        endDate: campaign?.endDate,
        city: campaign?.city,
        state: campaign?.state,
        collected_amount: value,
      });
      if (!response?.success) {
        throw new Error(response?.error || 'Campaign progress update failed');
      }
      toast.success('Campaign progress updated');
      await loadAdminMenuCollections(true);
    } catch (error) {
      toast.error(String(error?.message || 'Failed to update campaign progress'));
    }
  };

  const handleUpdateCampaignStatus = async (campaignId, status) => {
    const campaign = snapshot.campaigns.find((item) => item.id === campaignId);
    const backendCampaignId = resolveBackendCampaignId(campaign?.campaign_id ?? campaign?.id ?? campaignId);
    if (!backendCampaignId) {
      toast.error('Unable to resolve database campaign id');
      return;
    }

    try {
      const response = await api.updateCampaignStatus(backendCampaignId, String(status || '').toUpperCase());
      if (!response?.success) {
        throw new Error(response?.error || 'Campaign status update failed');
      }
      toast.success(`Campaign marked as ${status}`);
      await loadAdminMenuCollections(true);
    } catch (error) {
      toast.error(String(error?.message || 'Failed to update campaign status'));
    }
  };

  const handleUpdateCampaignDetails = async (campaignId, payload) => {
    const campaign = snapshot.campaigns.find((item) => item.id === campaignId);
    const backendCampaignId = resolveBackendCampaignId(campaign?.campaign_id ?? campaign?.id ?? campaignId);
    if (!backendCampaignId) {
      toast.error('Unable to resolve database campaign id');
      return;
    }

    try {
      const response = await api.updateCampaign(backendCampaignId, {
        title: payload?.title ?? campaign?.title,
        description: payload?.description ?? campaign?.description,
        donationType: payload?.type ?? campaign?.type,
        targetAmount: payload?.targetAmount ?? campaign?.targetAmount,
        startDate: payload?.startDate ?? campaign?.startDate,
        endDate: payload?.endDate ?? campaign?.endDate,
        city: payload?.city ?? campaign?.city,
        state: payload?.state ?? campaign?.state,
      });
      if (!response?.success) {
        throw new Error(response?.error || 'Campaign details update failed');
      }
      toast.success('Campaign details updated');
      await loadAdminMenuCollections(true);
    } catch (error) {
      toast.error(String(error?.message || 'Failed to update campaign details'));
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    const campaign = snapshot.campaigns.find((item) => item.id === campaignId);
    const backendCampaignId = resolveBackendCampaignId(campaign?.campaign_id ?? campaign?.id ?? campaignId);
    if (!backendCampaignId) {
      toast.error('Unable to resolve database campaign id');
      return;
    }

    try {
      const response = await api.deleteCampaign(backendCampaignId);
      if (!response?.success) {
        throw new Error(response?.error || 'Campaign deletion failed');
      }
      toast.success('Campaign deleted');
      await loadAdminMenuCollections(true);
    } catch (error) {
      toast.error(String(error?.message || 'Failed to delete campaign'));
    }
  };

  const handleAssignPickupVolunteer = (pickupId, volunteerId) => {
    (async () => {
      const selectedVolunteer = snapshot.volunteers.find((entry) => entry.id === volunteerId);
      const backendPickupId = resolveBackendPickupId(pickupId);
      const backendVolunteerId = resolveBackendVolunteerId(
        selectedVolunteer?.volunteerEntityId ??
        selectedVolunteer?.volunteer_id ??
        selectedVolunteer?.volunteerId ??
        selectedVolunteer?.userId ??
        selectedVolunteer?.user_id ??
        volunteerId
      );
      if (!backendPickupId) {
        toast.error('Unable to resolve pickup database id');
        return;
      }
      if (!backendVolunteerId) {
        toast.error('Unable to resolve volunteer database id');
        return;
      }

      try {
        await api.assignAdminPickupVolunteer(backendPickupId, backendVolunteerId, 'Assigned by admin dashboard');
        toast.success(volunteerId ? 'Volunteer assigned. Pickup task generated.' : 'Volunteer assignment cleared');
        await loadAdminMenuCollections(true);
      } catch (error) {
        toast.error(String(error?.message || 'Failed to assign volunteer'));
      }
    })();
  };

  const handleUpdatePickupStatus = (pickupId, status) => {
    (async () => {
      const backendPickupId = resolveBackendPickupId(pickupId);
      if (!backendPickupId) {
        toast.error('Unable to resolve pickup database id');
        return;
      }

      try {
        await api.updateAdminPickupStatus(backendPickupId, status);
        toast.success(`Pickup status updated to ${status}`);
        await loadAdminMenuCollections(true);
      } catch (error) {
        toast.error(String(error?.message || 'Failed to update pickup status'));
      }
    })();
  };

  const handleToggleUserStatus = async (userId) => {
    const targetUser = snapshot.users.find((item) => item.id === userId);
    const backendUserId = resolveBackendUserId(targetUser?.userId ?? userId);
    if (!backendUserId) {
      toast.error('Unable to resolve database user id');
      return false;
    }

    const nextStatus = targetUser?.status === 'active' ? 'blocked' : 'active';
    try {
      await api.toggleAdminUserStatus(backendUserId, nextStatus);
      toast.success(nextStatus === 'active' ? 'User activated' : 'User blocked');
      await loadAdminMenuCollections(true);
      return true;
    } catch (error) {
      toast.error(String(error?.message || 'Failed to update user status'));
      return false;
    }
  };

  const handleUpdateUser = async (userId, payload) => {
    const targetUser = snapshot.users.find((item) => item.id === userId);
    const backendUserId = resolveBackendUserId(targetUser?.userId ?? userId);
    if (!backendUserId) {
      toast.error('Unable to resolve database user id');
      return false;
    }

    try {
      await api.updateAdminUserById(backendUserId, payload);
      toast.success('Donor profile updated');
      await loadAdminMenuCollections(true);
      return true;
    } catch (error) {
      toast.error(String(error?.message || 'Failed to update donor profile'));
      return false;
    }
  };

  const handleDeleteUser = async (userId) => {
    const targetUser = snapshot.users.find((item) => item.id === userId);
    const backendUserId = resolveBackendUserId(targetUser?.userId ?? userId);
    if (!backendUserId) {
      toast.error('Unable to resolve database user id');
      return false;
    }

    try {
      await api.deleteAdminUserById(backendUserId);
      toast.success('Donor account deleted');
      await loadAdminMenuCollections(true);
      return true;
    } catch (error) {
      toast.error(String(error?.message || 'Failed to delete donor account'));
      return false;
    }
  };

  const handleAssignTask = (payload) => {
    assignTaskToVolunteer(payload);
    toast.success('Volunteer task assigned');
    refreshSnapshot();
  };

  const handleCreateVolunteer = (payload) => {
    createAdminVolunteer(payload);
    toast.success('Volunteer added');
    refreshSnapshot();
  };

  const handleRemoveVolunteer = (volunteerId) => {
    removeAdminVolunteer(volunteerId);
    toast.success('Volunteer removed');
    refreshSnapshot();
  };

  const handlePublishBanner = (payload) => {
    publishAdminBanner(payload);
    const origin = String(payload?.origin || '').trim().toLowerCase();
    const sendEmail = Boolean(payload?.sendEmail);

    if (origin === 'notifications') {
      const emailTag = sendEmail ? ' via in-app + email' : ' via in-app';
      const emailStatus = String(payload?.emailStatus || '').trim().toLowerCase();
      const statusTag = sendEmail && emailStatus === 'failed' ? ' (email failed)' : '';
      toast.success(`Notification sent${emailTag}${statusTag}`);
    } else {
      toast.success('Alert banner published');
    }
    refreshSnapshot();
  };

  const handleDismissBanner = (bannerId) => {
    dismissAdminBanner(bannerId);
    toast.success('Banner archived');
    refreshSnapshot();
  };

  const handleCreateMenuItem = async (payload) => {
    setMenuSaving(true);
    try {
      await api.createAdminMenuItem(payload);
      toast.success('Menu item created');
      await loadAdminMenuSections();
    } catch (error) {
      toast.error(String(error?.message || 'Failed to create menu item'));
    } finally {
      setMenuSaving(false);
    }
  };

  const handleUpdateMenuItem = async (menuId, payload) => {
    setMenuSaving(true);
    try {
      await api.updateAdminMenuItem(menuId, payload);
      toast.success('Menu item updated');
      await loadAdminMenuSections();
    } catch (error) {
      toast.error(String(error?.message || 'Failed to update menu item'));
    } finally {
      setMenuSaving(false);
    }
  };

  const handleDeleteMenuItem = async (item) => {
    const shouldDelete = window.confirm(`Delete menu item "${item?.label || item?.key || ''}"?`);
    if (!shouldDelete) return;

    setMenuSaving(true);
    try {
      await api.deleteAdminMenuItem(item.id);
      toast.success('Menu item deleted');
      await loadAdminMenuSections();
    } catch (error) {
      toast.error(String(error?.message || 'Failed to delete menu item'));
    } finally {
      setMenuSaving(false);
    }
  };

  const handleOpenReceipt = (donation) => {
    const params = new URLSearchParams({
      amount: String(donation.amount || 0),
      campaign: donation.campaign || '',
      ngo: donation.ngoName || '',
      type: donation.type || 'money',
      method: donation.paymentMethod || 'upi',
      txn: donation.transactionId || '',
      donor: donation.donorName || 'Donor',
      email: donation.donorEmail || '',
    });
    navigate(`/receipt/${donation.receiptNumber}?${params.toString()}`);
  };

  const handleDonationFilterChange = useCallback((updates) => {
    setDonationFilters((previous) => {
      const next = { ...previous, ...updates };
      if (next.dateFrom && next.dateTo && next.dateTo < next.dateFrom) {
        if ('dateFrom' in updates) {
          next.dateTo = next.dateFrom;
        } else if ('dateTo' in updates) {
          next.dateFrom = next.dateTo;
        }
      }
      return next;
    });
  }, []);

  const handleDonationFilterReset = useCallback(() => {
    setDonationFilters(DEFAULT_DONATION_FILTERS);
  }, []);

  const handleUpdateDonationPaymentStatus = async (donationId, paymentStatus) => {
    try {
      const backendResult = await api.updateAdminDonationPaymentStatus(donationId, paymentStatus);
      if (!backendResult?.success || !backendResult?.data) {
        throw new Error(backendResult?.error || 'Payment status update failed');
      }
      toast.success(`Payment marked as ${paymentStatus}`);
      await loadAdminDonations(donationFiltersRef.current);
    } catch (error) {
      toast.error(String(error?.message || 'Failed to update payment status'));
    }
  };

  const handleGenerateDonationReceipt = async (donationId) => {
    try {
      const backendResult = await api.generateAdminDonationReceipt(donationId);
      if (!backendResult?.success || !backendResult?.data) {
        throw new Error(backendResult?.error || 'Receipt generation failed');
      }
      toast.success('Receipt generated for monetary donation');
      await loadAdminDonations(donationFiltersRef.current);
    } catch (error) {
      toast.error(String(error?.message || 'Failed to generate receipt'));
    }
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    let cursorY = 18;

    const ensureSpace = (needed = 7) => {
      if (cursorY + needed > 280) {
        doc.addPage();
        cursorY = 18;
      }
    };

    const writeHeading = (text) => {
      ensureSpace(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(text, 14, cursorY);
      cursorY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    };

    const writeLine = (text, indent = 18) => {
      ensureSpace(7);
      doc.text(String(text), indent, cursorY);
      cursorY += 6;
    };

    const pickupStatusCounts = snapshot.pickups.reduce(
      (acc, pickup) => {
        const status = String(pickup.status || '').trim().toLowerCase();
        if (['assigned', 'in_progress'].includes(status)) {
          acc.scheduled += 1;
        } else if (status === 'completed') {
          acc.completed += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { pending: 0, scheduled: 0, completed: 0 }
    );

    const totalAssignedTasks = snapshot.volunteers.reduce(
      (sum, volunteer) => sum + Number(volunteer.assignedTasks || 0),
      0
    );
    const totalCompletedTasks = snapshot.volunteers.reduce(
      (sum, volunteer) => sum + Number(volunteer.completedTasks || 0),
      0
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('Financial & Operational Report', 14, cursorY);
    cursorY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    writeLine(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14);

    writeHeading('Financial Summary');
    writeLine(`Total Donations: ${formatCurrency(mergedStats.totalDonations)}`);
    writeLine(`Active Campaigns: ${mergedStats.activeCampaigns}`);
    writeLine(`Pending Requests: ${mergedStats.pendingRequests}`);
    writeLine(`Volunteers Count: ${mergedStats.volunteersCount}`);

    writeHeading('Monthly Donation Trend');
    snapshot.monthlyDonations.forEach((item) => {
      writeLine(`• ${item.month}: ${formatCurrency(item.donations)}`);
    });

    writeHeading('Donation Mix');
    snapshot.donationTypeBreakdown
      .slice()
      .sort((left, right) => Number(right.value || 0) - Number(left.value || 0))
      .forEach((row) => {
        writeLine(`• ${String(row.name || '').toUpperCase()}: ${formatCurrency(row.value)}`);
      });

    writeHeading('Campaign Performance');
    snapshot.topCampaigns.slice(0, 8).forEach((campaign) => {
      const fundedPercent = progressPercent(campaign.collectedAmount, campaign.targetAmount);
      writeLine(`• ${campaign.title}: ${formatCurrency(campaign.collectedAmount)} (${fundedPercent}% funded)`);
    });

    writeHeading('Operational Summary');
    writeLine(`Volunteer Tasks Completed: ${totalCompletedTasks}/${totalAssignedTasks}`);
    writeLine(`Pickup Requests Pending: ${pickupStatusCounts.pending}`);
    writeLine(`Pickup Requests Scheduled: ${pickupStatusCounts.scheduled}`);
    writeLine(`Pickup Requests Completed: ${pickupStatusCounts.completed}`);

    writeHeading('Volunteer Activity');
    snapshot.volunteers
      .slice()
      .sort((left, right) => Number(right.completedTasks || 0) - Number(left.completedTasks || 0))
      .slice(0, 8)
      .forEach((volunteer) => {
        writeLine(
          `• ${volunteer.name}: assigned ${volunteer.assignedTasks}, completed ${volunteer.completedTasks}, completion ${volunteer.completionRate}%`
        );
      });

    doc.save(`admin-financial-operational-report-${Date.now()}.pdf`);
    toast.success('PDF report exported');
  };

  const handleExportCsv = () => {
    const pickupStatusCounts = snapshot.pickups.reduce(
      (acc, pickup) => {
        const status = String(pickup.status || '').trim().toLowerCase();
        if (['assigned', 'in_progress'].includes(status)) {
          acc.scheduled += 1;
        } else if (status === 'completed') {
          acc.completed += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      },
      { pending: 0, scheduled: 0, completed: 0 }
    );

    const totalAssignedTasks = snapshot.volunteers.reduce(
      (sum, volunteer) => sum + Number(volunteer.assignedTasks || 0),
      0
    );
    const totalCompletedTasks = snapshot.volunteers.reduce(
      (sum, volunteer) => sum + Number(volunteer.completedTasks || 0),
      0
    );

    const rows = [
      ['Report', 'Financial & Operational Report'],
      ['Generated On', new Date().toLocaleString('en-IN')],
      [],
      ['Financial Summary'],
      ['Metric', 'Value'],
      ['Total Donations', mergedStats.totalDonations],
      ['Active Campaigns', mergedStats.activeCampaigns],
      ['Pending Requests', mergedStats.pendingRequests],
      ['Volunteers Count', mergedStats.volunteersCount],
      ['Volunteer Tasks Completed', `${totalCompletedTasks}/${totalAssignedTasks}`],
      [],
      ['Donation Trend'],
      ['Month', 'Donations'],
      ...snapshot.monthlyDonations.map((item) => [item.month, item.donations]),
      [],
      ['Donation Mix'],
      ['Category', 'Amount'],
      ...snapshot.donationTypeBreakdown.map((item) => [item.name, item.value]),
      [],
      ['Campaign Performance'],
      ['Campaign', 'NGO', 'Raised', 'Target', 'Funding %', 'Status'],
      ...snapshot.topCampaigns.map((campaign) => [
        campaign.title,
        campaign.ngoName,
        campaign.collectedAmount,
        campaign.targetAmount,
        progressPercent(campaign.collectedAmount, campaign.targetAmount),
        campaign.status,
      ]),
      [],
      ['Volunteer Activity'],
      ['Volunteer', 'City', 'Assigned', 'Completed', 'Completion %', 'Next Shift'],
      ...snapshot.volunteers.map((volunteer) => [
        volunteer.name,
        volunteer.city,
        volunteer.assignedTasks,
        volunteer.completedTasks,
        volunteer.completionRate,
        volunteer.nextShift,
      ]),
      [],
      ['Pickup Operations'],
      ['Status', 'Count'],
      ['Pending', pickupStatusCounts.pending],
      ['Scheduled', pickupStatusCounts.scheduled],
      ['Completed', pickupStatusCounts.completed],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-financial-operational-report-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Excel/CSV report exported');
  };

  const scrollToSectionContentOnSmallScreens = () => {
    if (typeof window === 'undefined' || window.innerWidth >= 1024) {
      return;
    }

    window.setTimeout(() => {
      contentRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'campaigns':
        return (
          <CampaignManagementSection
            snapshot={snapshot}
            onCreateCampaign={handleCreateCampaign}
            onReviewSubmission={handleReviewSubmission}
            onUpdateCampaignProgress={handleUpdateCampaignProgress}
            onUpdateCampaignStatus={handleUpdateCampaignStatus}
            onUpdateCampaignDetails={handleUpdateCampaignDetails}
            onDeleteCampaign={handleDeleteCampaign}
          />
        );
      case 'donations':
        return (
          <DonationsManagementSection
            snapshot={snapshot}
            isLoading={donationsLoading}
            errorMessage={donationsError}
            filters={donationFilters}
            onFiltersChange={handleDonationFilterChange}
            onResetFilters={handleDonationFilterReset}
            onOpenReceipt={handleOpenReceipt}
            onUpdateDonationPaymentStatus={handleUpdateDonationPaymentStatus}
            onGenerateDonationReceipt={handleGenerateDonationReceipt}
          />
        );
      case 'pickups':
        return (
          <PickupRequestsSection
            snapshot={snapshot}
            onAssignPickupVolunteer={handleAssignPickupVolunteer}
            onUpdatePickupStatus={handleUpdatePickupStatus}
          />
        );
      case 'users':
        return (
          <UsersManagementSection
            snapshot={snapshot}
            onToggleUserStatus={handleToggleUserStatus}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      case 'volunteers':
        return (
          <VolunteerManagementSection
            snapshot={snapshot}
            onAssignTask={handleAssignTask}
            onAssignPickupVolunteer={handleAssignPickupVolunteer}
            onCreateVolunteer={handleCreateVolunteer}
            onRemoveVolunteer={handleRemoveVolunteer}
          />
        );
      case 'alerts':
        return <AlertsSection snapshot={snapshot} onPublishBanner={handlePublishBanner} onDismissBanner={handleDismissBanner} />;
      case 'reports':
        return <ReportsSection snapshot={snapshot} onExportPdf={handleExportPdf} onExportCsv={handleExportCsv} />;
      case 'notifications':
        return <NotificationsSection snapshot={snapshot} onPublishBanner={handlePublishBanner} onDismissBanner={handleDismissBanner} />;
      case 'menu':
        return (
          <MenuManagementSection
            menuItems={menuItems}
            isSaving={menuSaving}
            onCreateMenuItem={handleCreateMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
          />
        );
      default:
        return <OverviewSection snapshot={snapshot} stats={mergedStats} />;
    }
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={fadeInUp} className="rounded-xl bg-gradient-to-r from-blue-700/80 to-blue-600/80 border border-blue-400/20 px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FiHome className="w-5 h-5 text-white" />
          <h1 className="text-xl font-heading font-bold text-white">Charity Admin Dashboard</h1>
        </div>
        <div className="text-sm text-blue-100 font-medium">Welcome, {user?.name || 'Admin'}</div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-5 items-start">
        <motion.aside variants={fadeInUp} className="dashboard-card lg:sticky lg:top-28">
          <div className="space-y-2">
            {menuLoading && (
              <div className="rounded-lg border border-white/10 bg-white/3 px-3.5 py-3 text-sm text-slate-300">
                Loading menu...
              </div>
            )}

            {!menuLoading && menuError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3">
                <p className="text-sm font-medium text-red-300">Menu not loaded from database</p>
                <p className="mt-1 text-xs text-red-200/90">{menuError}</p>
              </div>
            )}

            {!menuLoading && !menuError && visibleSections.map((section) => {
              const Icon = section.icon;
              return (
                <NavLink
                  key={section.key}
                  to={section.path}
                  end={section.key === 'overview'}
                  onClick={scrollToSectionContentOnSmallScreens}
                  className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3.5 py-3 border transition-colors ${isActive ? 'bg-blue-600/80 border-blue-500/40 text-white' : 'bg-white/3 border-white/10 text-slate-300 hover:bg-white/8'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-base font-medium">{section.label}</span>
                </NavLink>
              );
            })}
          </div>
        </motion.aside>

        <motion.div ref={contentRef} variants={fadeInUp} className="min-w-0">
          {renderSection()}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
