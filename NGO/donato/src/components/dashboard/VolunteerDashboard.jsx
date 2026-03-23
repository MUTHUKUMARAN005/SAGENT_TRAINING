import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiActivity,
  FiBell,
  FiCheck,
  FiCalendar,
  FiCamera,
  FiGrid,
  FiMapPin,
  FiNavigation,
  FiPackage,
  FiPhone,
  FiSearch,
  FiTruck,
  FiUser,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  format,
  isSameDay,
} from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { fadeInUp, staggerContainer } from '../../animations/variants';
import { api } from '../../utils/api';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const STATUS_LABEL = STATUS_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const STATUS_STYLES = {
  PENDING: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  COMPLETED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
};

const VOLUNTEER_MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard/volunteer', icon: FiGrid },
  { key: 'my-tasks', label: 'My Tasks', path: '/dashboard/volunteer/tasks', icon: FiTruck },
  { key: 'schedule', label: 'Schedule', path: '/dashboard/volunteer/schedule', icon: FiCalendar },
  { key: 'map', label: 'Map', path: '/dashboard/volunteer/map', icon: FiMapPin },
  { key: 'activities', label: 'Activities', path: '/dashboard/volunteer/activities', icon: FiActivity },
  { key: 'notifications', label: 'Notifications', path: '/dashboard/volunteer/notifications', icon: FiBell },
];

const resolveApiData = (payload) =>
  payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : payload;

const normalizeStatus = (value) => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace('-', '_');

  if (!normalized || normalized === 'ASSIGNED') {
    return 'PENDING';
  }

  if (normalized === 'INPROGRESS') {
    return 'IN_PROGRESS';
  }

  if (normalized === 'PENDING' || normalized === 'IN_PROGRESS' || normalized === 'COMPLETED') {
    return normalized;
  }

  return 'PENDING';
};

const formatItemType = (value) =>
  String(value || 'OTHER')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeTask = (raw = {}, index = 0) => ({
  taskId: Number(raw.taskId ?? raw.task_id ?? raw.id ?? index + 1),
  pickupId: Number(raw.pickupId ?? raw.pickup_id ?? 0),
  donorName: String(raw.donorName || raw.donor_name || 'Donor').trim(),
  address: String(raw.address || raw.donorAddress || raw.donor_address || 'Address unavailable').trim(),
  itemType: String(raw.itemType || raw.item_type || raw.donation_type || 'OTHER').trim().toUpperCase(),
  status: normalizeStatus(raw.status || raw.taskStatus || raw.task_status),
  description: String(raw.description || raw.task_description || '').trim(),
  assignedDate: raw.assignedDate || raw.assigned_date || null,
  completedDate: raw.completedDate || raw.completed_date || null,
  pickupDate: raw.pickupDate || raw.pickup_date || null,
  timeSlot: String(raw.timeSlot || raw.time_slot || '').trim(),
  contactPhone: String(raw.contactPhone || raw.contact_phone || '').trim(),
});

const normalizeAwaitingPickup = (raw = {}, index = 0) => ({
  pickupId: Number(raw.pickup_id ?? raw.pickupId ?? raw.id ?? index + 1),
  donorName: String(raw.donor_name || raw.donorName || 'Donor').trim(),
  address: String(raw.donor_address || raw.address || 'Address unavailable').trim(),
  itemType: String(raw.itemType || raw.item_type || 'OTHER').trim().toUpperCase(),
  pickupDate: raw.pickup_date || raw.pickupDate || null,
  timeSlot: String(raw.time_slot || raw.timeSlot || '').trim(),
  contactPhone: String(raw.contact_phone || raw.contactPhone || '').trim(),
  status: String(raw.pickup_status || raw.pickupStatus || raw.status || 'approved').trim().toLowerCase(),
});

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [awaitingPickups, setAwaitingPickups] = useState([]);
  const [volunteerStats, setVolunteerStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [claimingPickupId, setClaimingPickupId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [proofsByDonation, setProofsByDonation] = useState({});
  const [uploadingProofKey, setUploadingProofKey] = useState('');
  const seenTaskIdsRef = useRef(null);
  const proofFileInputsRef = useRef({});

  const buildProofState = useCallback((rows = []) => {
    const hasPickupProof = rows.some((proof) => String(proof?.type || '').trim().toUpperCase() === 'PICKUP');
    const hasDeliveryProof = rows.some((proof) => String(proof?.type || '').trim().toUpperCase() === 'DELIVERY');
    return {
      hasPickupProof,
      hasDeliveryProof,
      readyToComplete: hasPickupProof && hasDeliveryProof,
    };
  }, []);

  const loadProofsForTasks = useCallback(async (rows = []) => {
    const donationIds = Array.from(
      new Set(
        rows
          .map((task) => Number(task?.donationId || 0))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    if (!donationIds.length) {
      setProofsByDonation({});
      return;
    }

    const proofResults = await Promise.allSettled(
      donationIds.map((donationId) => api.getDonationProofs(donationId))
    );

    const nextState = {};
    proofResults.forEach((result, index) => {
      const donationId = donationIds[index];
      if (result.status !== 'fulfilled') {
        nextState[donationId] = { hasPickupProof: false, hasDeliveryProof: false, readyToComplete: false };
        return;
      }

      const payload = result.value;
      const rowsData = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      nextState[donationId] = buildProofState(rowsData);
    });

    setProofsByDonation(nextState);
  }, [buildProofState]);

  const activeSection = useMemo(() => {
    if (location.pathname === '/dashboard/volunteer') return 'dashboard';
    if (location.pathname.startsWith('/dashboard/volunteer/tasks')) return 'my-tasks';
    if (location.pathname.startsWith('/dashboard/volunteer/schedule')) return 'schedule';
    if (location.pathname.startsWith('/dashboard/volunteer/map')) return 'map';
    if (location.pathname.startsWith('/dashboard/volunteer/activities')) return 'activities';
    if (location.pathname.startsWith('/dashboard/volunteer/notifications')) return 'notifications';
    if (location.pathname.startsWith('/dashboard/volunteer/profile')) return 'profile';
    return 'dashboard';
  }, [location.pathname]);

  const getTasksForDate = useCallback(
    (date) =>
      tasks.filter((task) => {
        if (!task.pickupDate) return false;
        return isSameDay(new Date(task.pickupDate), date);
      }),
    [tasks]
  );

  const calculateRouteInfo = useCallback((dayTasks) => {
    if (!dayTasks || dayTasks.length === 0) {
      return { stops: 0, estimatedDuration: 0, estimatedDistance: 0 };
    }
    const stops = dayTasks.length;
    const estimatedDuration = stops * 20;
    const estimatedDistance = stops * 5;
    return { stops, estimatedDuration, estimatedDistance };
  }, []);

  const isMenuActive = useCallback(
    (item) => activeSection === item.key,
    [activeSection]
  );

  const loadDashboardData = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [tasksResult, awaitingPickupsResult, statsResult, notificationsResult, profileResult] = await Promise.allSettled([
        api.getVolunteerTasks(),
        api.getVolunteerAwaitingAssignmentPickups(),
        api.getVolunteerDashboardStats(),
        api.getNotifications(),
        api.getCurrentUser(),
      ]);
      const loadErrors = [];

      if (tasksResult.status === 'fulfilled') {
        const taskResponse = tasksResult.value;
        const taskPayload = resolveApiData(taskResponse);
        const rows = Array.isArray(taskPayload) ? taskPayload.map((item, index) => normalizeTask(item, index)) : [];
        setTasks(rows);
        await loadProofsForTasks(rows);
      } else {
        setTasks([]);
        setProofsByDonation({});
        loadErrors.push(tasksResult.reason?.message || 'Unable to load tasks');
      }

      if (awaitingPickupsResult.status === 'fulfilled') {
        const awaitingResponse = awaitingPickupsResult.value;
        const awaitingPayload = resolveApiData(awaitingResponse);
        const rows = Array.isArray(awaitingPayload)
          ? awaitingPayload.map((item, index) => normalizeAwaitingPickup(item, index))
          : [];
        setAwaitingPickups(rows);
      } else {
        setAwaitingPickups([]);
      }

      if (statsResult.status === 'fulfilled') {
        const statsResponse = statsResult.value;
        const statsPayload = resolveApiData(statsResponse);
        if (statsResponse?.success !== false && statsPayload && typeof statsPayload === 'object') {
          setVolunteerStats(statsPayload);
        }
      } else {
        loadErrors.push(statsResult.reason?.message || 'Unable to load volunteer stats');
      }

      if (notificationsResult.status === 'fulfilled') {
        const notificationsResponse = notificationsResult.value;
        const notificationsPayload = resolveApiData(notificationsResponse);
        setNotifications(Array.isArray(notificationsPayload) ? notificationsPayload : []);
      } else {
        setNotifications([]);
        loadErrors.push(notificationsResult.reason?.message || 'Unable to load notifications');
      }

      if (profileResult.status === 'fulfilled') {
        const profileResponse = profileResult.value;
        const profilePayload = resolveApiData(profileResponse);
        if (profilePayload && typeof profilePayload === 'object') {
          setProfile(profilePayload);
        }
      } else {
        setProfile(user || null);
        loadErrors.push(profileResult.reason?.message || 'Unable to load profile');
      }

      if (loadErrors.length > 0) {
        toast.error(loadErrors[0]);
      }
    } catch (error) {
      toast.error(error?.message || 'Unable to load volunteer dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadProofsForTasks, user]);

  useEffect(() => {
    loadDashboardData({ showLoader: true });
  }, [loadDashboardData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const pickupCreated = params.get('pickupCreated') === '1';
    if (!pickupCreated) return;

    const pickupId = String(params.get('pickupId') || '').trim();
    toast.success(pickupId ? `Pickup ${pickupId} added to assignment queue.` : 'A new pickup request was created.');
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const currentTaskIds = new Set(tasks.map((task) => task.taskId));

    if (seenTaskIdsRef.current === null) {
      seenTaskIdsRef.current = currentTaskIds;
      return;
    }

    const unseenTasks = tasks.filter((task) => !seenTaskIdsRef.current.has(task.taskId));

    if (unseenTasks.length > 0) {
      const now = new Date().toISOString();
      const generated = unseenTasks.map((task) => ({
        id: `new-task-${task.taskId}-${now}`,
        title: 'New task assigned 🔔',
        message: task.description || `Pickup assigned from ${task.donorName}`,
        when: formatDate(now),
        createdAt: now,
        type: 'NEW_TASK',
      }));

      setLiveNotifications((prev) => [...generated, ...prev].slice(0, 30));
      toast.success(`${unseenTasks.length} new task assigned.`);
    }

    seenTaskIdsRef.current = currentTaskIds;
  }, [tasks]);

  const taskPendingCount = tasks.filter((task) => task.status === 'PENDING').length;
  const inProgressCount = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
  const taskCompletedCount = tasks.filter((task) => task.status === 'COMPLETED').length;

  const totalTasks = Number(volunteerStats?.total_tasks ?? tasks.length);
  const pendingCount = Number(volunteerStats?.pending_tasks ?? taskPendingCount + inProgressCount);
  const completedCount = Number(volunteerStats?.tasks_completed ?? taskCompletedCount);

  const visibleTasks = useMemo(() => {
    if (statusFilter === 'ALL') return tasks;
    return tasks.filter((task) => task.status === statusFilter);
  }, [statusFilter, tasks]);

  const hoursLogged = Number(volunteerStats?.hours_volunteered ?? 0);

  const upcomingTasks = useMemo(
    () =>
      tasks
        .slice()
        .sort((left, right) => new Date(left.pickupDate || '').getTime() - new Date(right.pickupDate || '').getTime())
        .slice(0, 3),
    [tasks]
  );

  const recentActivities = useMemo(
    () =>
      tasks
        .slice()
        .sort((left, right) => {
          const leftTime = new Date(left.completedDate || left.assignedDate || left.pickupDate || 0).getTime();
          const rightTime = new Date(right.completedDate || right.assignedDate || right.pickupDate || 0).getTime();
          return rightTime - leftTime;
        })
        .slice(0, 3)
        .map((task) => ({
          id: task.taskId,
          title: task.description || `Pickup from ${task.donorName}`,
          when: formatDate(task.completedDate || task.assignedDate || task.pickupDate),
        })),
    [tasks]
  );

  const reminderNotifications = useMemo(() => {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return tasks
      .filter((task) => task.pickupDate)
      .filter((task) => {
        const pickup = new Date(task.pickupDate);
        return pickup >= now && pickup <= next24Hours && task.status !== 'COMPLETED';
      })
      .slice(0, 8)
      .map((task) => ({
        id: `reminder-${task.taskId}`,
        title: 'Reminder',
        message: `${task.description || `Pickup from ${task.donorName}`} ${task.timeSlot ? `(${task.timeSlot})` : ''}`.trim(),
        when: formatDate(task.pickupDate),
        createdAt: task.pickupDate,
        type: 'REMINDER',
      }));
  }, [tasks]);

  const pickupUpdateNotifications = useMemo(() => {
    return tasks
      .filter((task) => task.status === 'IN_PROGRESS' || task.status === 'COMPLETED')
      .slice(0, 10)
      .map((task) => ({
        id: `pickup-update-${task.taskId}-${task.status}`,
        title: 'Pickup updates',
        message: `${task.description || `Pickup from ${task.donorName}`} is ${STATUS_LABEL[task.status] || task.status}`,
        when: formatDate(task.completedDate || task.pickupDate || task.assignedDate),
        createdAt: task.completedDate || task.pickupDate || task.assignedDate,
        type: 'PICKUP_UPDATE',
      }));
  }, [tasks]);

  const ngoMessageNotifications = useMemo(() => {
    return notifications
      .slice(0, 12)
      .map((entry) => {
        const createdAt = entry.createdAt || entry.created_at || new Date().toISOString();
        return {
          id: `ngo-${entry.id || entry.title || createdAt}`,
          title: 'NGO messages',
          message: entry.message || entry.title || 'Message from NGO team',
          when: formatDate(createdAt),
          createdAt,
          type: 'NGO_MESSAGE',
        };
      });
  }, [notifications]);

  const allNotificationItems = useMemo(() => {
    return [
      ...liveNotifications,
      ...pickupUpdateNotifications,
      ...reminderNotifications,
      ...ngoMessageNotifications,
    ]
      .slice()
      .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
  }, [liveNotifications, pickupUpdateNotifications, reminderNotifications, ngoMessageNotifications]);

  const notificationItems = useMemo(() => allNotificationItems.slice(0, 3), [allNotificationItems]);

  const updateStatus = async (taskId, nextStatus) => {
    const normalizedNext = normalizeStatus(nextStatus);
    const currentTask = tasks.find((task) => task.taskId === taskId);
    if (!currentTask || currentTask.status === normalizedNext) return;

    if (normalizedNext === 'COMPLETED') {
      const donationId = Number(currentTask.donationId || 0);
      const proofState = proofsByDonation[donationId] || { readyToComplete: false };
      if (!proofState.readyToComplete) {
        toast.error('Upload both pickup and delivery proofs before marking task as completed.');
        return;
      }
    }

    setUpdatingTaskId(taskId);
    try {
      await api.updateVolunteerTaskStatus(taskId, normalizedNext);
      setTasks((prev) =>
        prev.map((task) =>
          task.taskId === taskId
            ? {
                ...task,
                status: normalizedNext,
              }
            : task
        )
      );
      toast.success(`Task marked as ${STATUS_LABEL[normalizedNext]}.`);
    } catch (error) {
      toast.error(error?.message || 'Unable to update task status.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const claimPickup = async (pickupId) => {
    if (!pickupId || claimingPickupId) return;

    setClaimingPickupId(pickupId);
    try {
      await api.claimVolunteerPickup(pickupId);
      toast.success('Pickup claimed and added to your tasks.');
      await loadDashboardData({ showLoader: false });
    } catch (error) {
      toast.error(error?.message || 'Unable to claim pickup.');
    } finally {
      setClaimingPickupId(null);
    }
  };

  const openProofPicker = (task, type) => {
    const key = `${task.taskId}:${type}`;
    const input = proofFileInputsRef.current[key];
    if (input) {
      input.click();
    }
  };

  const uploadProofForTask = async (task, type, event) => {
    const selectedFile = event?.target?.files?.[0];
    if (!selectedFile) return;

    const donationId = Number(task?.donationId || 0);
    if (!donationId) {
      toast.error('Donation reference missing for this task.');
      event.target.value = '';
      return;
    }

    const proofType = String(type || '').trim().toUpperCase();
    const uploadKey = `${task.taskId}:${proofType}`;

    setUploadingProofKey(uploadKey);
    try {
      await api.uploadProof({
        donationId,
        type: proofType,
        file: selectedFile,
      });

      const proofsResult = await api.getDonationProofs(donationId);
      const proofRows = Array.isArray(proofsResult?.data)
        ? proofsResult.data
        : Array.isArray(proofsResult)
          ? proofsResult
          : [];

      setProofsByDonation((prev) => ({
        ...prev,
        [donationId]: buildProofState(proofRows),
      }));

      toast.success(`${proofType === 'PICKUP' ? 'Pickup' : 'Delivery'} proof uploaded.`);
    } catch (error) {
      toast.error(error?.message || 'Unable to upload proof.');
    } finally {
      setUploadingProofKey('');
      event.target.value = '';
    }
  };

  const renderMainSection = () => {
    if (activeSection === 'my-tasks') {
      return (
        <motion.div variants={fadeInUp} className="rounded-xl border border-[#d7dfeb] bg-white p-4 md:p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-[#1f4572]">Assigned Pickup Tasks</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {['ALL', ...STATUS_OPTIONS.map((status) => status.value)].map((option) => {
                const isActive = statusFilter === option;
                const label = option === 'ALL' ? 'All' : STATUS_LABEL[option];
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatusFilter(option)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      isActive
                        ? 'bg-[#1f73cb]/10 text-[#1f73cb] border-[#1f73cb]/25'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500">
              Loading your assigned pickup requests...
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 px-5 text-center">
              <p className="text-base font-semibold text-slate-600">No pickup requests found</p>
              <p className="text-sm text-slate-500 mt-1">Tasks assigned to you will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleTasks.map((task) => (
                <div key={task.taskId} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                  {(() => {
                    const donationId = Number(task.donationId || 0);
                    const proofState = proofsByDonation[donationId] || {
                      hasPickupProof: false,
                      hasDeliveryProof: false,
                      readyToComplete: false,
                    };
                    const pickupUploadKey = `${task.taskId}:PICKUP`;
                    const deliveryUploadKey = `${task.taskId}:DELIVERY`;

                    return (
                      <>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm text-slate-500">Task #{task.taskId}</p>
                      <p className="text-base font-semibold text-slate-800">
                        {task.description || `Pickup request from ${task.donorName}`}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs border ${
                        STATUS_STYLES[task.status] || STATUS_STYLES.PENDING
                      }`}
                    >
                      {STATUS_LABEL[task.status] || STATUS_LABEL.PENDING}
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                      <p className="text-xs font-semibold text-slate-700">Proof Upload (Required before completion)</p>
                      {proofState.readyToComplete ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border bg-emerald-100 text-emerald-700 border-emerald-200">
                          <FiCheck className="w-3 h-3" /> Ready to complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border bg-amber-100 text-amber-700 border-amber-200">
                          Pending proofs
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        ref={(node) => {
                          proofFileInputsRef.current[pickupUploadKey] = node;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => uploadProofForTask(task, 'PICKUP', event)}
                      />
                      <button
                        type="button"
                        onClick={() => openProofPicker(task, 'PICKUP')}
                        disabled={uploadingProofKey === pickupUploadKey}
                        className={`px-3 py-1.5 rounded-md text-xs border ${proofState.hasPickupProof
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <FiCamera className="w-3 h-3" />
                          {uploadingProofKey === pickupUploadKey ? 'Uploading...' : proofState.hasPickupProof ? 'Pickup Proof Uploaded' : 'Upload Pickup Proof'}
                        </span>
                      </button>

                      <input
                        ref={(node) => {
                          proofFileInputsRef.current[deliveryUploadKey] = node;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => uploadProofForTask(task, 'DELIVERY', event)}
                      />
                      <button
                        type="button"
                        onClick={() => openProofPicker(task, 'DELIVERY')}
                        disabled={uploadingProofKey === deliveryUploadKey}
                        className={`px-3 py-1.5 rounded-md text-xs border ${proofState.hasDeliveryProof
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <FiCamera className="w-3 h-3" />
                          {uploadingProofKey === deliveryUploadKey ? 'Uploading...' : proofState.hasDeliveryProof ? 'Delivery Proof Uploaded' : 'Upload Delivery Proof'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2 text-slate-700">
                      <FiUser className="mt-0.5 text-[#1f73cb] shrink-0" />
                      <div>
                        <p className="text-slate-500 text-xs">Donor Name</p>
                        <p>{task.donorName || 'Donor'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-slate-700">
                      <FiPackage className="mt-0.5 text-[#1f73cb] shrink-0" />
                      <div>
                        <p className="text-slate-500 text-xs">Item Type</p>
                        <p>{formatItemType(task.itemType)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-slate-700">
                      <FiMapPin className="mt-0.5 text-[#1f73cb] shrink-0" />
                      <div>
                        <p className="text-slate-500 text-xs">Address</p>
                        <p>{task.address || 'Address unavailable'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-slate-700">
                      <FiPhone className="mt-0.5 text-[#1f73cb] shrink-0" />
                      <div>
                        <p className="text-slate-500 text-xs">Contact</p>
                        <p>{task.contactPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-200">
                    <div className="text-xs text-slate-500">
                      Pickup window: {formatDate(task.pickupDate)}
                      {task.timeSlot ? ` • ${task.timeSlot}` : ''}
                    </div>

                    <div className="flex items-center gap-2">
                      <label htmlFor={`status-${task.taskId}`} className="text-xs text-slate-500">
                        Update status
                      </label>
                      <select
                        id={`status-${task.taskId}`}
                        value={task.status}
                        onChange={(event) => updateStatus(task.taskId, event.target.value)}
                        disabled={updatingTaskId === task.taskId}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f73cb]/40 disabled:opacity-60"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <h3 className="text-base font-semibold text-slate-800">Awaiting Assignment (NGO Queue)</h3>
              <span className="px-2 py-1 rounded-full text-xs border bg-blue-100 text-blue-700 border-blue-200">
                {awaitingPickups.length} upcoming
              </span>
            </div>

            {awaitingPickups.length === 0 ? (
              <p className="text-sm text-slate-600">No upcoming unassigned pickups from your NGO.</p>
            ) : (
              <div className="space-y-2">
                {awaitingPickups.slice(0, 8).map((pickup) => (
                  <div key={`awaiting-${pickup.pickupId}`} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Pickup #{pickup.pickupId}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{pickup.donorName} • {formatItemType(pickup.itemType)}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] border bg-amber-100 text-amber-700 border-amber-200">
                        Awaiting NGO assignment
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{pickup.address}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(pickup.pickupDate)}
                      {pickup.timeSlot ? ` • ${pickup.timeSlot}` : ''}
                      {pickup.contactPhone ? ` • ${pickup.contactPhone}` : ''}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => claimPickup(pickup.pickupId)}
                        disabled={claimingPickupId === pickup.pickupId}
                        className="px-3 py-1.5 rounded-md bg-[#1f73cb] text-white text-xs hover:bg-[#165ca8] disabled:opacity-60"
                      >
                        {claimingPickupId === pickup.pickupId ? 'Claiming...' : 'Claim Pickup'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'schedule') {
      const tasksForToday = getTasksForDate(new Date());
      const todayRoute = calculateRouteInfo(tasksForToday);
      const scheduledTasks = tasks
        .filter((task) => task.pickupDate)
        .slice()
        .sort((a, b) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime())
        .slice(0, 6);

      return (
        <motion.div variants={fadeInUp} className="rounded-xl border border-[#d7dfeb] bg-white p-4 md:p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-[#1f4572]">Schedule & Calendar</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <FiNavigation className="w-4 h-4 text-blue-700" />
                <h3 className="text-sm font-semibold text-blue-900">Route Planning</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div className="bg-white rounded p-2">
                  <p className="text-base font-bold text-blue-700">{todayRoute.stops}</p>
                  <p className="text-[10px] text-slate-600">Stops</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-base font-bold text-blue-700">{todayRoute.estimatedDuration}</p>
                  <p className="text-[10px] text-slate-600">Minutes</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-base font-bold text-blue-700">~{todayRoute.estimatedDistance}</p>
                  <p className="text-[10px] text-slate-600">km</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/map')}
                className="w-full px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Open Map
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Upcoming Tasks</h3>
              <div className="space-y-2">
                {scheduledTasks.length === 0 ? (
                  <p className="text-xs text-slate-500">No upcoming tasks.</p>
                ) : (
                  scheduledTasks.map((task) => (
                    <div key={task.taskId} className="rounded border border-slate-200 p-2 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-800">{task.description || `Pickup from ${task.donorName}`}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {formatDate(task.pickupDate)}
                        {task.timeSlot ? ` • ${task.timeSlot}` : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'map') {
      const todayMapTasks = getTasksForDate(new Date());
      const activeRouteTasks = tasks.filter((task) => task.status !== 'COMPLETED');
      const routeToday = calculateRouteInfo(todayMapTasks);
      const routeActive = calculateRouteInfo(activeRouteTasks);
      const donorLocations = tasks
        .filter((task) => task.address && task.address !== 'Address unavailable')
        .slice()
        .sort((a, b) => new Date(a.pickupDate || 0).getTime() - new Date(b.pickupDate || 0).getTime())
        .slice(0, 8);

      return (
        <motion.div variants={fadeInUp} className="rounded-xl border border-[#d7dfeb] bg-white p-4 md:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-[#1f4572]">Map / Navigation</h2>
            <span className="px-2.5 py-1 rounded-full text-xs border bg-slate-100 text-slate-700 border-slate-200">View Only</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Donor Locations</p>
              <p className="text-2xl font-bold text-[#1f4572]">{donorLocations.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Distance Tracking (Today)</p>
              <p className="text-2xl font-bold text-[#1f4572]">~{routeToday.estimatedDistance} km</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Distance Tracking (Active)</p>
              <p className="text-2xl font-bold text-[#1f4572]">~{routeActive.estimatedDistance} km</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Donor Location List</h3>
            <div className="space-y-2">
              {donorLocations.length === 0 ? (
                <p className="text-xs text-slate-500">No donor locations available right now.</p>
              ) : (
                donorLocations.map((task) => {
                  const encodedAddress = encodeURIComponent(task.address);
                  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

                  return (
                    <div key={task.taskId} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{task.donorName}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">📍 {task.address}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {formatDate(task.pickupDate)}
                            {task.timeSlot ? ` • ${task.timeSlot}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={mapsSearchUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded border border-slate-300 text-[11px] text-slate-700 hover:bg-slate-100"
                          >
                            View
                          </a>
                          <a
                            href={mapsDirectionsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-[#1f73cb] text-white text-[11px] hover:bg-[#165ca8]"
                          >
                            Navigate
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/map')}
            className="px-4 py-2 rounded-lg bg-[#1f73cb] text-white text-sm hover:bg-[#165ca8] transition-colors"
          >
            Open Live Map
          </button>
        </motion.div>
      );
    }

    if (activeSection === 'activities') {
      const completedTasks = tasks
        .filter((task) => task.status === 'COMPLETED')
        .slice()
        .sort((a, b) => {
          const aTime = new Date(a.completedDate || a.pickupDate || 0).getTime();
          const bTime = new Date(b.completedDate || b.pickupDate || 0).getTime();
          return bTime - aTime;
        });

      const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

      return (
        <motion.div variants={fadeInUp} className="rounded-xl border border-[#d7dfeb] bg-white p-4 md:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-[#1f4572]">Activities / History</h2>
            <span className="px-2.5 py-1 rounded-full text-xs border bg-slate-100 text-slate-700 border-slate-200">View Only</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Hours Logged</p>
              <p className="text-2xl font-bold text-[#1f4572]">{hoursLogged}h</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Completed Tasks</p>
              <p className="text-2xl font-bold text-[#1f4572]">{completedTasks.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Completion Rate</p>
              <p className="text-2xl font-bold text-[#1f4572]">{completionRate}%</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Contribution Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <p className="text-[11px] text-slate-500">Total Assigned</p>
                <p className="text-base font-bold text-slate-800">{totalTasks}</p>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <p className="text-[11px] text-slate-500">Completed</p>
                <p className="text-base font-bold text-slate-800">{completedCount}</p>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <p className="text-[11px] text-slate-500">In Progress</p>
                <p className="text-base font-bold text-slate-800">{inProgressCount}</p>
              </div>
              <div className="rounded border border-slate-200 bg-slate-50 p-2">
                <p className="text-[11px] text-slate-500">Pending</p>
                <p className="text-base font-bold text-slate-800">{pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Completed Tasks History</h3>
            <div className="space-y-2">
              {completedTasks.length === 0 ? (
                <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  No completed tasks yet.
                </div>
              ) : (
                completedTasks.slice(0, 10).map((task) => (
                  <div key={task.taskId} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-slate-800">{task.description || `Pickup from ${task.donorName}`}</p>
                      <span className="text-[11px] text-slate-500">{formatDate(task.completedDate || task.pickupDate)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">Donor: {task.donorName}</p>
                    <p className="text-[11px] text-slate-600">Item: {formatItemType(task.itemType)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'notifications') {
      const newTaskAlerts = allNotificationItems.filter((item) => item.type === 'NEW_TASK');
      const pickupAlerts = allNotificationItems.filter((item) => item.type === 'PICKUP_UPDATE');
      const reminderAlerts = allNotificationItems.filter((item) => item.type === 'REMINDER');
      const ngoAlerts = allNotificationItems.filter((item) => item.type === 'NGO_MESSAGE');

      return (
        <motion.div variants={fadeInUp} className="rounded-xl border border-[#d7dfeb] bg-white p-4 md:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-[#1f4572]">Notifications</h2>
            <span className="px-2.5 py-1 rounded-full text-xs border bg-emerald-50 text-emerald-700 border-emerald-200">View + Receive</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">New Task Assigned</p>
              <p className="text-xl font-bold text-[#1f4572]">{newTaskAlerts.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Pickup Updates</p>
              <p className="text-xl font-bold text-[#1f4572]">{pickupAlerts.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Reminders</p>
              <p className="text-xl font-bold text-[#1f4572]">{reminderAlerts.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">NGO Messages</p>
              <p className="text-xl font-bold text-[#1f4572]">{ngoAlerts.length}</p>
            </div>
          </div>

          <div className="space-y-3">
            {allNotificationItems.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">No notifications found.</div>
            ) : (
              allNotificationItems.slice(0, 20).map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  {item.message ? <p className="text-sm text-slate-700 mt-1">{item.message}</p> : null}
                  <p className="text-xs text-slate-500 mt-1">{item.when}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      );
    }

    if (activeSection === 'profile') {
      return (
        <motion.div variants={fadeInUp} className="rounded-xl border border-[#d7dfeb] bg-white p-4 md:p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1f4572] mb-4">Profile</h2>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
            <p><span className="text-slate-500">Name:</span> <span className="text-slate-800 font-medium">{profile?.name || user?.name || 'Volunteer'}</span></p>
            <p><span className="text-slate-500">Email:</span> <span className="text-slate-800">{profile?.email || user?.email || '-'}</span></p>
            <p><span className="text-slate-500">Role:</span> <span className="text-slate-800 capitalize">{profile?.role || user?.role || 'volunteer'}</span></p>
            <p><span className="text-slate-500">Status:</span> <span className="text-slate-800 capitalize">{String(volunteerStats?.status || 'unknown').toLowerCase()}</span></p>
            <p><span className="text-slate-500">Joined:</span> <span className="text-slate-800">{formatDate(volunteerStats?.joined_date)}</span></p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="mt-4 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm hover:bg-slate-100 transition-colors"
          >
            Open Settings
          </button>
        </motion.div>
      );
    }

    return (
      <div className="space-y-4">
        <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gradient-to-r from-[#57a3f3] to-[#4a90e8] text-white p-4 shadow-sm">
            <p className="text-3xl font-bold">{hoursLogged}h</p>
            <p className="text-sm text-blue-100">Hours Logged</p>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-[#2f86e6] to-[#1f73cb] text-white p-4 shadow-sm">
            <p className="text-3xl font-bold">{totalTasks}</p>
            <p className="text-sm text-blue-100">Tasks Assigned</p>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-[#2f86e6] to-[#1f73cb] text-white p-4 shadow-sm">
            <p className="text-3xl font-bold">{completedCount}</p>
            <p className="text-sm text-blue-100">Completed Tasks</p>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-[#2f86e6] to-[#1f73cb] text-white p-4 shadow-sm">
            <p className="text-3xl font-bold">{upcomingTasks.length}</p>
            <p className="text-sm text-blue-100">Upcoming Events</p>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#d7dfeb] bg-white p-4 shadow-sm">
            <h3 className="text-xl font-bold text-[#1f4572] mb-3">Upcoming Tasks</h3>
            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <div className="text-sm text-slate-600">No upcoming tasks.</div>
              ) : (
                upcomingTasks.map((task) => (
                  <div key={task.taskId} className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 last:border-b-0">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{task.description || `Pickup from ${task.donorName}`}</p>
                      <p className="text-xs text-slate-500">{task.address}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${STATUS_STYLES[task.status]}`}>
                      {STATUS_LABEL[task.status]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#d7dfeb] bg-white p-4 shadow-sm">
            <h3 className="text-xl font-bold text-[#1f4572] mb-3">Recent Activities</h3>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="text-sm text-slate-600">No recent activity.</div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 last:border-b-0">
                    <p className="text-sm text-slate-700">{activity.title}</p>
                    <span className="text-sm text-slate-500">{activity.when}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#d7dfeb] bg-white p-4 shadow-sm">
            <h3 className="text-xl font-bold text-[#1f4572] mb-3">Impact Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-3xl font-bold text-[#1f73cb]">{totalTasks}</p>
                <p className="text-xs text-slate-500">Total Tasks</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#1f73cb]">{hoursLogged}</p>
                <p className="text-xs text-slate-500">Hours Volunteered</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-[#1f73cb]">{completedCount}</p>
                <p className="text-xs text-slate-500">People Helped</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#d7dfeb] bg-white p-4 shadow-sm">
            <h3 className="text-xl font-bold text-[#1f4572] mb-3">Notifications</h3>
            <div className="space-y-3">
              {notificationItems.length === 0 ? (
                <div className="text-sm text-slate-600">No notifications found.</div>
              ) : (
                notificationItems.map((item) => (
                  <div key={item.id} className="text-sm text-slate-700 border-b border-slate-200 pb-2 last:border-b-0">
                    {item.title}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="rounded-2xl bg-gradient-to-br from-[#1a66c1] to-[#0f57ac] p-3 shadow-2xl">
      <div className="overflow-hidden rounded-xl border border-blue-500/30 bg-[#dfe7f2]">
        <div className="grid grid-cols-1 xl:grid-cols-[205px_minmax(0,1fr)]">
          <motion.aside variants={fadeInUp} className="bg-gradient-to-b from-[#1c66be] to-[#0d5ab3] text-white min-h-full flex flex-col">
            <div className="px-4 py-5 border-b border-white/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/90 text-[#1c66be] flex items-center justify-center font-black text-lg">↻</div>
                <div>
                  <p className="text-xl font-bold leading-none">Volunteer</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-1.5">
              {VOLUNTEER_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isMenuActive(item);
                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                      active ? 'bg-[#4d92db] text-white border-l-2 border-white' : 'text-blue-50 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[19px] md:text-sm font-medium">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </motion.aside>

          <div className="min-w-0">
            <div className="h-[58px] bg-[#f7f9fc] border-b border-[#d0d9e6] px-5 flex items-center justify-between">
              <h1 className="text-[34px] md:text-[30px] font-black text-[#1c5aa0]">Dashboard</h1>
              <div className="flex items-center gap-4 text-[#7b8fa9]">
                <button type="button" onClick={() => loadDashboardData({ showLoader: false })} className="hover:text-[#1f73cb] transition-colors" aria-label="Refresh data">
                  <FiSearch className={`w-5 h-5 ${refreshing ? 'animate-pulse' : ''}`} />
                </button>
                <FiBell className="w-5 h-5" />
                <FiUser className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 md:p-5">
              {renderMainSection()}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VolunteerDashboard;
