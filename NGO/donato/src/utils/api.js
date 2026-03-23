const DEFAULT_API_BASE_URL = 'http://localhost:8080/api';
const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, '');
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);
const STRICT_REAL_API_MODE = String(import.meta.env.VITE_STRICT_REAL_API_MODE || 'true')
  .toLowerCase()
  .trim() === 'true';
const ENABLE_API_FALLBACK = !STRICT_REAL_API_MODE && String(import.meta.env.VITE_ENABLE_API_FALLBACK || 'false')
  .toLowerCase()
  .trim() === 'true';

const resolveRoleFromEmail = (email = '') =>
  email.includes('admin')
    ? 'admin'
    : email.includes('ngo')
      ? 'ngo'
      : email.includes('volunteer')
        ? 'volunteer'
        : 'donor';

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeEmailInput = (value = '') => String(value).trim().toLowerCase();

const sanitizeAuthToken = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  // Accept values stored as "Bearer <jwt>" and normalize to raw JWT.
  return raw.replace(/^Bearer\s+/i, '').trim();
};

const extractTokenFromUserShape = (userLike = {}) => {
  if (!userLike || typeof userLike !== 'object') return '';

  const directToken = sanitizeAuthToken(
    userLike.token ||
    userLike.accessToken ||
    userLike.jwt ||
    userLike.jwtToken ||
    userLike.authToken ||
    ''
  );
  if (directToken) return directToken;

  const nestedDataToken = sanitizeAuthToken(
    userLike?.data?.token ||
    userLike?.data?.accessToken ||
    userLike?.data?.jwt ||
    userLike?.data?.jwtToken ||
    ''
  );
  if (nestedDataToken) return nestedDataToken;

  const nestedUserToken = sanitizeAuthToken(
    userLike?.user?.token ||
    userLike?.user?.accessToken ||
    userLike?.user?.jwt ||
    userLike?.user?.jwtToken ||
    ''
  );
  return nestedUserToken;
};

const getStoredAuthToken = () => {
  if (typeof window === 'undefined') return '';

  const storageReaders = [
    () => localStorage.getItem('kindwave_user'),
    () => sessionStorage.getItem('kindwave_user'),
  ];

  for (const read of storageReaders) {
    try {
      const stored = read();
      if (!stored) continue;
      const parsed = JSON.parse(stored);
      const token = extractTokenFromUserShape(parsed);
      if (token) return token;
    } catch (_error) {
      // Ignore malformed persisted user and continue trying other sources.
    }
  }

  return '';
};

const normalizePhoneInput = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.campaigns)) return value.campaigns;
  if (Array.isArray(value?.donations)) return value.donations;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const extractPayload = (payload) => {
  if (payload && typeof payload === 'object') {
    if ('data' in payload) return payload.data;
    if ('result' in payload) return payload.result;
  }
  return payload;
};

const buildApiUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
};

const getErrorMessage = (payload, status) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }
  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim().toLowerCase() === 'validation failed') {
      const detailSource = payload.data && typeof payload.data === 'object'
        ? payload.data
        : payload.errors && typeof payload.errors === 'object'
          ? payload.errors
          : null;

      if (detailSource) {
        const details = Object.entries(detailSource)
          .map(([field, message]) => `${field}: ${String(message || '').trim()}`)
          .filter((line) => line && !line.endsWith(':'))
          .slice(0, 3)
          .join('; ');
        if (details) {
          return `Validation failed - ${details}`;
        }
      }
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }
  }
  return `Request failed (${status})`;
};

const request = async (path, options = {}) => {
  const { method = 'GET', body, headers = {}, auth = false } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const token = auth ? getStoredAuthToken() : '';

    const hasBody = body !== undefined;
    const isFormDataBody = typeof FormData !== 'undefined' && body instanceof FormData;
    const isStringBody = typeof body === 'string';

    let requestBody;
    if (!hasBody) {
      requestBody = undefined;
    } else if (isFormDataBody) {
      requestBody = body;
    } else if (isStringBody) {
      const trimmedBody = String(body).trim();
      if (!trimmedBody) {
        throw new Error('Request body cannot be an empty JSON string.');
      }

      // String bodies must already be valid JSON. Parse once to fail fast on invalid syntax.
      try {
        const parsed = JSON.parse(trimmedBody);
        requestBody = JSON.stringify(parsed);
      } catch (_error) {
        throw new Error('Invalid JSON body string. Pass an object instead of a raw string.');
      }
    } else {
      requestBody = JSON.stringify(body);
    }

    const finalHeaders = {
      Accept: 'application/json',
      ...(hasBody && !isFormDataBody ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    // Debug logging for pickup requests
    if (path.includes('/pickups') && method === 'POST') {
      console.log('[API DEBUG] Pickup Request Details:');
      console.log('  URL:', buildApiUrl(path));
      console.log('  Method:', method);
      console.log('  Headers:', finalHeaders);
      console.log('  Body (parsed):', body);
      console.log('  Body (stringified):', requestBody);
    }

    const response = await fetch(buildApiUrl(path), {
      method,
      headers: finalHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    if (!response.ok) {
      throw new Error(getErrorMessage(payload, response.status));
    }

    if (payload && typeof payload === 'object' && payload.success === false) {
      throw new Error(getErrorMessage(payload, response.status));
    }

    return extractPayload(payload);
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeCampaign = (raw = {}, index = 0) => {
  const id = parseNumber(raw.campaign_id ?? raw.campaignId ?? raw.id, index + 1);
  const targetAmount = parseNumber(
    raw.target_amount ?? raw.targetAmount ?? raw.goal_amount ?? raw.goalAmount,
    0
  );
  const collectedAmount = parseNumber(
    raw.collected_amount ?? raw.collectedAmount ?? raw.raised_amount ?? raw.raisedAmount,
    0
  );
  const startDate = raw.start_date ?? raw.startDate ?? new Date().toISOString().slice(0, 10);
  const endDate =
    raw.end_date ??
    raw.endDate ??
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const campaignStatus = raw.campaign_status || raw.campaignStatus || raw.status || 'active';
  const campaignStatusStr = String(campaignStatus || '').trim().toLowerCase();

  return {
    ...raw,
    campaign_id: id,
    title: raw.title || raw.name || `Campaign ${id}`,
    description: raw.description || raw.summary || 'Campaign details coming soon.',
    donation_type: (raw.donation_type || raw.donationType || 'money').toLowerCase(),
    target_amount: targetAmount,
    collected_amount: collectedAmount,
    start_date: startDate,
    end_date: endDate,
    campaign_status: campaignStatusStr,
    ngo_name: raw.ngo_name || raw.ngoName || raw.organization || 'Verified NGO',
    ngo_id: parseNumber(raw.ngo_id ?? raw.ngoId, 0),
    image:
      resolveImageUrl(
        raw.image ||
        raw.image_url ||
        raw.imageUrl ||
        null
      ),
    donors_count: parseNumber(raw.donors_count ?? raw.donorsCount ?? raw.totalDonors, 0),
    city: raw.city || raw.location || 'India',
    state: raw.state || '',
    latitude: raw.latitude ?? raw.lat ?? raw.campaign_lat ?? null,
    longitude: raw.longitude ?? raw.lng ?? raw.campaign_lng ?? null,
    campaign_lat: raw.campaign_lat ?? raw.campaignLat ?? raw.latitude ?? raw.lat ?? null,
    campaign_lng: raw.campaign_lng ?? raw.campaignLng ?? raw.longitude ?? raw.lng ?? null,
    ngo_address: raw.ngo_address || raw.ngoAddress || raw.address || '',
    ngo_lat: raw.ngo_lat ?? raw.ngoLat ?? raw.ngoLatitude ?? null,
    ngo_lng: raw.ngo_lng ?? raw.ngoLng ?? raw.ngoLongitude ?? null,
  };
};

const normalizeCampaignList = (raw) => toArray(raw).map((item, idx) => normalizeCampaign(item, idx));

const normalizeDonation = (raw = {}, index = 0) => {
  const donationStatus = raw.donation_status || raw.donationStatus || raw.status || 'completed';
  const donationStatusStr = String(donationStatus || '').trim().toLowerCase();
  const paymentStatus = raw.payment_status || raw.paymentStatus || 'pending';
  const paymentStatusStr = String(paymentStatus || '').trim().toLowerCase();
  const donationType = raw.type || raw.donation_type || raw.donationType || 'money';
  const donationTypeStr = String(donationType || '').trim().toLowerCase();
  const paymentMethod = raw.payment_method || raw.paymentMethod || 'upi';
  const paymentMethodStr = String(paymentMethod || '').trim().toLowerCase();
  const itemType = String(raw.itemType || raw.item_type || raw.donationItemType || '').trim();
  const itemCount = parseNumber(raw.itemCount ?? raw.item_count ?? raw.quantity, 0);

  return {
  ...raw,
  id: parseNumber(raw.id ?? raw.donation_id ?? raw.donationId, index + 1),
  donation_id: raw.donation_id || raw.donationId || `DON-${10000 + index}`,
  donor_name: raw.donor_name || raw.donorName || '',
  donor_email: raw.donor_email || raw.donorEmail || '',
  donorName: raw.donorName || raw.donor_name || '',
  donorEmail: raw.donorEmail || raw.donor_email || '',
  campaign: raw.campaign || raw.campaign_name || raw.campaignName || raw.campaignTitle || 'Campaign',
  campaign_id: parseNumber(raw.campaign_id ?? raw.campaignId, 0),
  ngo_name: raw.ngo_name || raw.ngoName || '',
  amount: parseNumber(raw.amount, 0),
  date: raw.date || raw.donation_date || raw.donationDate || raw.created_at || raw.createdAt || new Date().toISOString().slice(0, 10),
  status: donationStatusStr,
  payment_status: paymentStatusStr,
  type: donationTypeStr,
  itemType,
  item_type: itemType,
  itemCount,
  item_count: itemCount,
  payment_method: paymentMethodStr,
  receipt_number: raw.receipt_number || raw.receiptNumber || '',
  transaction_id: raw.transaction_id || raw.transactionId || '',
  };
};

const normalizeReceipt = (raw = {}, index = 0) => ({
  id: parseNumber(raw.receipt_id ?? raw.receiptId, index + 1),
  receipt_number: raw.receipt_number || raw.receiptNumber || '',
  amount: parseNumber(raw.amount, 0),
  campaign: raw.campaign || raw.campaign_title || raw.campaignTitle || 'Campaign',
  ngo_name: raw.ngo_name || raw.ngoName || '',
  donation_type: (raw.donation_type || raw.donationType || 'money').toLowerCase(),
  payment_method: (raw.payment_method || raw.paymentMethod || '').toLowerCase(),
  transaction_id: raw.transaction_id || raw.transactionId || '',
  issued_date: raw.issued_date || raw.issuedDate || raw.date || new Date().toISOString(),
  verification_url: raw.verification_url || raw.verificationUrl || '',
  pdf_url: raw.pdf_url || raw.pdfUrl || '',
});

const normalizeNotification = (raw = {}, index = 0) => ({
  id: parseNumber(raw.id ?? raw.notification_id ?? raw.notificationId, index + 1),
  title: raw.title || 'Notification',
  message: raw.message || '',
  type: String(raw.type || 'system').toLowerCase(),
  isRead: Boolean(raw.isRead ?? raw.read ?? false),
  createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  referenceId: parseNumber(raw.referenceId ?? raw.reference_id, 0),
});

const normalizeUrgentNeed = (raw = {}, index = 0) => ({
  urgent_id: parseNumber(raw.urgentId ?? raw.urgent_id ?? raw.id, index + 1),
  title: String(raw.title || '').trim(),
  message: String(raw.message || '').trim(),
  start_time: raw.startTime || raw.start_time || null,
  end_time: raw.endTime || raw.end_time || null,
  created_at: raw.createdAt || raw.created_at || null,
  urgent_status: String(raw.urgentStatus || raw.urgent_status || 'APPROVED').trim().toUpperCase(),
  ngo_user_id: parseNumber(raw.ngoUserId ?? raw.ngo_user_id, 0),
  ngo_name: String(raw.ngoName || raw.ngo_name || '').trim(),
  ngo_email: String(raw.ngoEmail || raw.ngo_email || '').trim(),
});

const normalizePickup = (raw = {}, index = 0) => {
  const status = raw.pickupStatus || raw.pickup_status || 'pending';
  const statusStr = String(status || '').trim().toLowerCase();
  return {
  pickup_id: parseNumber(raw.pickup_id ?? raw.pickupId, index + 1),
  donation_id: parseNumber(raw.donation_id ?? raw.donationId, 0),
  donor_id: parseNumber(raw.donor_id ?? raw.donorId, 0),
  donor_name: raw.donor_name || raw.donorName || '',
  donor_address: raw.donor_address || raw.donorAddress || '',
  pickup_date: raw.pickup_date || raw.pickupDate || '',
  time_slot: raw.time_slot || raw.timeSlot || '',
  pickup_status: statusStr,
  contact_phone: raw.contact_phone || raw.contactPhone || '',
  notes: raw.notes || '',
  volunteer_name: raw.volunteer_name || raw.volunteerName || '',
  latitude: raw.latitude ?? raw.lat ?? raw.donor_latitude ?? raw.donorLatitude ?? null,
  longitude: raw.longitude ?? raw.lng ?? raw.donor_longitude ?? raw.donorLongitude ?? null,
  donor_latitude: raw.donor_latitude ?? raw.donorLatitude ?? raw.latitude ?? raw.lat ?? null,
  donor_longitude: raw.donor_longitude ?? raw.donorLongitude ?? raw.longitude ?? raw.lng ?? null,
  volunteer_latitude: raw.volunteer_latitude ?? raw.volunteerLatitude ?? raw.volunteer_lat ?? raw.volunteerLat ?? null,
  volunteer_longitude: raw.volunteer_longitude ?? raw.volunteerLongitude ?? raw.volunteer_lng ?? raw.volunteerLng ?? null,
  reminder_sent: Boolean(raw.reminder_sent ?? raw.reminderSent ?? false),
  items: Array.isArray(raw.items) ? raw.items : [],
  };
};

const normalizeVolunteerTask = (raw = {}, index = 0) => {
  const rawStatus = String(raw.status || raw.taskStatus || 'ASSIGNED').trim().toUpperCase();
  const normalizedStatus = rawStatus === 'ASSIGNED' ? 'PENDING' : rawStatus;
  const rawItemType = raw.itemType || raw.item_type || raw.donation_type || raw.type || 'OTHER';

  return {
    taskId: parseNumber(raw.taskId ?? raw.task_id ?? raw.id, index + 1),
    pickupId: parseNumber(raw.pickupId ?? raw.pickup_id, 0),
    donationId: parseNumber(raw.donationId ?? raw.donation_id, 0),
    description: String(raw.description || raw.task_description || `Pickup task #${index + 1}`).trim(),
    status: normalizedStatus,
    otpVerified: Boolean(raw.otpVerified ?? raw.otp_verified ?? false),
    assignedDate: raw.assignedDate || raw.assigned_date || raw.createdAt || raw.created_at || null,
    completedDate: raw.completedDate || raw.completed_date || null,
    donorName: String(raw.donorName || raw.donor_name || raw.requestorName || 'Donor').trim(),
    address: String(raw.address || raw.donorAddress || raw.donor_address || 'Address unavailable').trim(),
    itemType: String(rawItemType).trim().toUpperCase(),
    pickupDate: raw.pickupDate || raw.pickup_date || null,
    timeSlot: String(raw.timeSlot || raw.time_slot || '').trim(),
    contactPhone: String(raw.contactPhone || raw.contact_phone || '').trim(),
  };
};

const normalizeNGO = (raw = {}, index = 0) => ({
  id: parseNumber(raw.ngoId ?? raw.ngo_id ?? raw.id, index + 1),
  ngo_id: parseNumber(raw.ngoId ?? raw.ngo_id ?? raw.id, index + 1),
  name: raw.ngoName || raw.ngo_name || raw.name || `NGO ${index + 1}`,
  city: raw.city || '',
  state: raw.state || '',
  email: raw.email || '',
  phone: raw.phone || '',
  description: raw.description || '',
  address: raw.address || '',
  verified: Boolean(raw.verified ?? false),
  lat: raw.latitude ?? raw.lat ?? null,
  lng: raw.longitude ?? raw.lng ?? null,
  activeCampaigns: parseNumber(raw.activeCampaigns ?? raw.active_campaigns, 0),
  image: resolveImageUrl(raw.logo || raw.image || raw.image_url || raw.imageUrl || null),
  category: String(raw.category || '').trim().toLowerCase() || null,
  rating: parseNumber(raw.rating, 4.5),
  totalDonations: parseNumber(raw.totalDonations ?? raw.total_donations, 0),
});

const normalizeCampaignUpdate = (raw = {}, index = 0) => ({
  id: parseNumber(raw.id ?? raw.update_id ?? raw.updateId, index + 1),
  campaign_id: parseNumber(raw.campaign_id ?? raw.campaignId, 0),
  ngo_name: raw.ngo_name || raw.ngoName || 'NGO Team',
  message: raw.message || raw.text || 'Campaign progress update posted.',
  impact_count: parseNumber(raw.impact_count ?? raw.impactCount, 0),
  impact_label: raw.impact_label || raw.impactLabel || '',
  image_url: raw.image_url || raw.imageUrl || '',
  is_pinned: Boolean(raw.is_pinned ?? raw.isPinned ?? false),
  pinned_at: raw.pinned_at || raw.pinnedAt || null,
  posted_at: raw.posted_at || raw.postedAt || raw.created_at || raw.createdAt || new Date().toISOString(),
  posted_by: raw.posted_by || raw.postedBy || raw.author || 'NGO Team',
});

const normalizeVolunteerLeader = (raw = {}, index = 0) => ({
  id: parseNumber(raw.id ?? raw.volunteer_id ?? raw.volunteerId, index + 1),
  name: raw.name || raw.volunteer_name || raw.volunteerName || `Volunteer ${index + 1}`,
  pickups: parseNumber(raw.pickups ?? raw.completed_pickups ?? raw.completedPickups, 0),
  city: raw.city || '',
  avatar: raw.avatar || raw.image || '',
  badge: raw.badge || (index === 0 ? 'Gold' : index === 1 ? 'Silver' : index === 2 ? 'Bronze' : 'Rising Star'),
});

const normalizeStats = (raw = {}) => ({
  total_donations: parseNumber(raw.total_donations ?? raw.totalDonations, 0),
  active_campaigns: parseNumber(raw.active_campaigns ?? raw.activeCampaigns, 0),
  ngos_registered: parseNumber(raw.ngos_registered ?? raw.ngosRegistered, 0),
  total_users: parseNumber(raw.total_users ?? raw.totalUsers, 0),
  children_educated: parseNumber(raw.children_educated ?? raw.childrenEducated, 0),
  meals_served: parseNumber(raw.meals_served ?? raw.mealsServed, 0),
  projects_completed: parseNumber(raw.projects_completed ?? raw.projectsCompleted, 0),
  volunteers_active: parseNumber(raw.volunteers_active ?? raw.volunteersActive, 0),
});

const normalizeAdminMenuItem = (raw = {}, index = 0) => {
  const key = String(raw.key || raw.menuKey || raw.menu_key || '').trim().toLowerCase();
  return {
    id: parseNumber(raw.id ?? raw.menuId ?? raw.menu_id, index + 1),
    key,
    label: String(raw.label || key || `Section ${index + 1}`).trim(),
    path: String(raw.path || '/dashboard/admin').trim(),
    iconKey: String(raw.iconKey || raw.icon_key || '').trim().toLowerCase(),
    sortOrder: parseNumber(raw.sortOrder ?? raw.sort_order, index + 1),
    enabled: Boolean(raw.enabled ?? true),
  };
};

const normalizeUser = (raw = {}, fallback = {}) => {
  const email = String(raw.email || fallback.email || '').toLowerCase();
  const emailVerified = Boolean(raw.emailVerified ?? fallback.emailVerified ?? true);
  const resolvedToken = sanitizeAuthToken(
    raw.token || raw.accessToken || raw.jwt || raw.jwtToken || fallback.token || fallback.accessToken
  );

  return {
    ...raw,
    user_id: raw.user_id || raw.userId || raw.id || fallback.user_id || Date.now(),
    name: raw.name || raw.full_name || raw.fullName || fallback.name || 'User',
    email,
    role: (raw.role || fallback.role || resolveRoleFromEmail(email)).toLowerCase(),
    phone: raw.phone || fallback.phone || '',
    address: raw.address || fallback.address || '',
    city: raw.city || fallback.city || '',
    latitude: raw.latitude ?? raw.lat ?? fallback.latitude ?? null,
    longitude: raw.longitude ?? raw.lng ?? fallback.longitude ?? null,
    avatar: raw.avatar || raw.picture || fallback.avatar || '',
    provider: raw.provider || fallback.provider || 'local',
    token: resolvedToken,
    accessToken: raw.accessToken || resolvedToken,
    emailVerified,
    phoneVerified: Boolean(raw.phoneVerified ?? fallback.phoneVerified ?? false),
    verificationRequired: Boolean(raw.verificationRequired ?? fallback.verificationRequired ?? !emailVerified),
    emailUpdatesEnabled: Boolean(raw.emailUpdatesEnabled ?? fallback.emailUpdatesEnabled ?? true),
    smsNotificationsEnabled: Boolean(raw.smsNotificationsEnabled ?? fallback.smsNotificationsEnabled ?? true),
    campaignAlertsEnabled: Boolean(raw.campaignAlertsEnabled ?? fallback.campaignAlertsEnabled ?? true),
    weeklyDigestEnabled: Boolean(raw.weeklyDigestEnabled ?? fallback.weeklyDigestEnabled ?? false),
    pickupRemindersEnabled: Boolean(raw.pickupRemindersEnabled ?? fallback.pickupRemindersEnabled ?? true),
  };
};

// Resolve a raw image value from the backend into a fully-qualified URL.
// Relative paths (e.g. "campaigns/uuid.jpg") are served by the backend at /api/files/<path>.
const FALLBACK_IMAGE = 'https://picsum.photos/seed/kindwave-fallback/1200/800';

const resolveImageUrl = (raw) => {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return FALLBACK_IMAGE;
  const trimmed = raw.trim();

  // Already absolute URL.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Normalize path separators and strip query/hash for path checks.
  const normalized = trimmed.replace(/\\/g, '/');
  const [pathOnly] = normalized.split(/[?#]/);
  const cleanedPath = pathOnly.replace(/^\/+/, '');

  // Common backend returns full endpoint path (/api/files/... or /files/...).
  if (/^api\/files\//i.test(cleanedPath)) {
    return `${API_BASE_URL}/${cleanedPath.replace(/^api\//i, '')}`;
  }
  if (/^files\//i.test(cleanedPath)) {
    return `${API_BASE_URL}/${cleanedPath}`;
  }

  // Raw uploads path from DB/storage.
  if (/^uploads\//i.test(cleanedPath)) {
    return `${API_BASE_URL}/files/${cleanedPath.replace(/^uploads\//i, '')}`;
  }

  // Fallback: treat as stored relative file key under /files.
  return `${API_BASE_URL}/files/${cleanedPath}`;
};

const withFallback = async (runner, fallbackFactory, label, options = {}) => {
  const { throwOnError = false, fallbackValue = null, allowFallback = true } = options;

  const shapeSuccessResult = (data) => {
    if (Array.isArray(data)) {
      // Keep array semantics for callers expecting raw arrays, but expose wrapper fields too.
      data.success = true;
      data.data = data;
      return data;
    }

    if (data && typeof data === 'object') {
      return {
        ...data,
        success: true,
        data,
      };
    }

    return { success: true, data };
  };

  try {
    const data = await runner();
    return shapeSuccessResult(data);
  } catch (error) {
    if (ENABLE_API_FALLBACK && allowFallback) {
      console.warn(`[api] ${label} backend call failed. Falling back to local data.`, error);
      const fallbackData = fallbackFactory(error);
      const shapedFallback = shapeSuccessResult(fallbackData);
      if (shapedFallback && typeof shapedFallback === 'object') {
        shapedFallback.fallback = true;
      }
      return shapedFallback;
    }

    const message = String(error?.message || `${label} failed`);
    console.warn(`[api] ${label} backend call failed. Fallback disabled.`, message);

    if (throwOnError) {
      throw error;
    }

    return { success: false, data: fallbackValue, error: message };
  }
};

export const api = {
  getCampaigns: async () =>
    withFallback(
      async () => normalizeCampaignList(await request('/campaigns')),
      () => [],
      'getCampaigns',
      { fallbackValue: [] }
    ),

  getCampaignById: async (id) =>
    withFallback(
      async () => {
        const rawCampaign = await request(`/campaigns/${id}`);
        return normalizeCampaign(rawCampaign);
      },
      () => null,
      'getCampaignById',
      { fallbackValue: null }
    ),

  makeDonation: async (donationData) =>
    withFallback(
      async () => {
        // Map frontend snake_case / lowercase values → backend camelCase enum values
        const PAYMENT_METHOD_MAP = {
          upi: 'UPI',
          card: 'CARD',
        };
        const rawPaymentMethod = String(
          donationData.payment_method ?? donationData.paymentMethod ?? 'upi'
        ).toLowerCase();
        const rawDonationType = String(
          donationData.donation_type ?? donationData.donationType ?? 'money'
        ).toUpperCase();

        const payload = {
          campaignId:    donationData.campaign_id   ?? donationData.campaignId,
          donationType:  rawDonationType,
          amount:        donationData.amount,
          paymentMethod: PAYMENT_METHOD_MAP[rawPaymentMethod] || 'UPI',
          transactionId: donationData.transaction_id ?? donationData.transactionId ?? '',
          message:       donationData.message       ?? '',
          anonymous:     donationData.anonymous     ?? false,
          panNumber:     donationData.pan_number    ?? donationData.panNumber ?? null,
        };

        const created = await request('/donations', {
          method: 'POST',
          auth: true,
          body: payload,
        });
        return normalizeDonation(created);
      },
      () => ({
        donation_id: Math.floor(Math.random() * 10000),
        receipt_number: `REC-${Date.now()}`,
        ...donationData,
      }),
      'makeDonation',
      { throwOnError: true }
    ),

  getStats: async () =>
    withFallback(
      async () => normalizeStats(await request('/dashboard/stats', { auth: true })),
      () => null,
      'getStats',
      { fallbackValue: null }
    ),

  getAdminMenuItems: async () =>
    withFallback(
      async () =>
        toArray(await request('/dashboard/admin/menu', { auth: true }))
          .map((item, idx) => normalizeAdminMenuItem(item, idx))
          .filter((item) => item.key && item.path),
      () => [],
      'getAdminMenuItems',
      { fallbackValue: [], allowFallback: false }
    ),

  getAdminMenuItemsAll: async () =>
    withFallback(
      async () =>
        toArray(await request('/dashboard/admin/menu/all', { auth: true }))
          .map((item, idx) => normalizeAdminMenuItem(item, idx))
          .filter((item) => item.key && item.path),
      () => [],
      'getAdminMenuItemsAll',
      { fallbackValue: [], allowFallback: false }
    ),

  createAdminMenuItem: async (payload = {}) =>
    withFallback(
      async () =>
        normalizeAdminMenuItem(await request('/dashboard/admin/menu', {
          method: 'POST',
          auth: true,
          body: {
            key: String(payload?.key || '').trim(),
            label: String(payload?.label || '').trim(),
            path: String(payload?.path || '').trim(),
            iconKey: String(payload?.iconKey || payload?.icon_key || '').trim(),
            sortOrder: parseNumber(payload?.sortOrder ?? payload?.sort_order, 1),
            enabled: Boolean(payload?.enabled ?? true),
          },
        })),
      () => null,
      'createAdminMenuItem',
      { throwOnError: true, allowFallback: false }
    ),

  updateAdminMenuItem: async (menuId, payload = {}) =>
    withFallback(
      async () =>
        normalizeAdminMenuItem(await request(`/dashboard/admin/menu/${menuId}`, {
          method: 'PUT',
          auth: true,
          body: {
            key: String(payload?.key || '').trim(),
            label: String(payload?.label || '').trim(),
            path: String(payload?.path || '').trim(),
            iconKey: String(payload?.iconKey || payload?.icon_key || '').trim(),
            sortOrder: parseNumber(payload?.sortOrder ?? payload?.sort_order, 1),
            enabled: Boolean(payload?.enabled ?? true),
          },
        })),
      () => null,
      'updateAdminMenuItem',
      { throwOnError: true, allowFallback: false }
    ),

  deleteAdminMenuItem: async (menuId) =>
    withFallback(
      async () =>
        await request(`/dashboard/admin/menu/${menuId}`, {
          method: 'DELETE',
          auth: true,
        }),
      () => null,
      'deleteAdminMenuItem',
      { throwOnError: true, allowFallback: false }
    ),

  getDonationHistory: async () =>
    withFallback(
      async () => {
        const raw = await request('/donations/my', { auth: true });
        return toArray(raw).map((item, idx) => normalizeDonation(item, idx));
      },
      () => [],
      'getDonationHistory',
      { fallbackValue: [] }
    ),

  createDonation: async (payload = {}) =>
    withFallback(
      async () => normalizeDonation(await request('/donations', {
        method: 'POST',
        auth: true,
        body: {
          campaignId: parseNumber(payload.campaignId ?? payload.campaign_id, 0),
          donationType: String((payload.donationType ?? payload.donation_type) || 'PHYSICAL').toUpperCase(),
          amount: parseNumber(payload.amount, 0),
          itemType: String((payload.itemType ?? payload.item_type) || 'OTHER').trim(),
          itemCount: parseNumber(payload.itemCount ?? payload.item_count, 0),
        },
      })),
      () => null,
      'createDonation',
      { throwOnError: true }
    ),

  getNGODonations: async (filters = {}) =>
    withFallback(
      async () => {
        const page = Number(filters?.page ?? 0);
        const size = Number(filters?.size ?? 50);
        const raw = await request(
          `/donations/ngo/my?page=${Number.isFinite(page) ? Math.max(0, page) : 0}&size=${Number.isFinite(size) ? Math.min(Math.max(size, 1), 200) : 50}`,
          { auth: true }
        );
        return toArray(raw).map((item, idx) => normalizeDonation(item, idx));
      },
      () => [],
      'getNGODonations',
      { throwOnError: true, fallbackValue: [] }
    ),

  getActiveUrgentNeeds: async () =>
    withFallback(
      async () => {
        const raw = await request('/urgent-needs/active');
        return toArray(raw).map((item, idx) => normalizeUrgentNeed(item, idx));
      },
      () => [],
      'getActiveUrgentNeeds',
      { fallbackValue: [] }
    ),

  getMyUrgentNeeds: async () =>
    withFallback(
      async () => {
        const raw = await request('/urgent-needs/my', { auth: true });
        return toArray(raw).map((item, idx) => normalizeUrgentNeed(item, idx));
      },
      () => [],
      'getMyUrgentNeeds',
      { throwOnError: true, fallbackValue: [] }
    ),

  createUrgentNeed: async (payload = {}) =>
    withFallback(
      async () => normalizeUrgentNeed(await request('/urgent-needs', {
        method: 'POST',
        auth: true,
        body: {
          title: String(payload?.title || '').trim(),
          message: String(payload?.message || '').trim(),
          startTime: payload?.startTime || payload?.start_time || null,
          endTime: payload?.endTime || payload?.end_time || null,
        },
      })),
      () => null,
      'createUrgentNeed',
      { throwOnError: true }
    ),

  updateUrgentNeed: async (urgentId, payload = {}) =>
    withFallback(
      async () => normalizeUrgentNeed(await request(`/urgent-needs/${urgentId}`, {
        method: 'PUT',
        auth: true,
        body: {
          title: String(payload?.title || '').trim(),
          message: String(payload?.message || '').trim(),
          startTime: payload?.startTime || payload?.start_time || null,
          endTime: payload?.endTime || payload?.end_time || null,
        },
      })),
      () => null,
      'updateUrgentNeed',
      { throwOnError: true }
    ),

  deleteUrgentNeed: async (urgentId) =>
    withFallback(
      async () => request(`/urgent-needs/${urgentId}`, {
        method: 'DELETE',
        auth: true,
      }),
      () => ({ deleted: true }),
      'deleteUrgentNeed',
      { throwOnError: true }
    ),

  getAdminCampaigns: async (filters = {}) =>
    withFallback(
      async () => {
        const params = new URLSearchParams();
        const page = Number(filters?.page ?? 0);
        const size = Number(filters?.size ?? 200);
        const status = String(filters?.status || '').trim();
        const search = String(filters?.search || '').trim();
        const sort = String(filters?.sort || '').trim();

        params.set('page', String(Number.isFinite(page) ? Math.max(0, page) : 0));
        params.set('size', String(Number.isFinite(size) ? Math.min(Math.max(size, 1), 300) : 200));
        if (status) params.set('status', status.toUpperCase());
        if (search) params.set('search', search);
        if (sort) params.set('sort', sort);

        const raw = await request(`/campaigns?${params.toString()}`, { auth: true });
        return toArray(raw).map((item, idx) => normalizeCampaign(item, idx));
      },
      () => [],
      'getAdminCampaigns',
      { fallbackValue: [], allowFallback: false }
    ),

  getAdminUsers: async (filters = {}) =>
    withFallback(
      async () => {
        const params = new URLSearchParams();
        const page = Number(filters?.page ?? 0);
        const size = Number(filters?.size ?? 300);
        const role = String(filters?.role || '').trim();

        params.set('page', String(Number.isFinite(page) ? Math.max(0, page) : 0));
        params.set('size', String(Number.isFinite(size) ? Math.min(Math.max(size, 1), 500) : 300));
        if (role) params.set('role', role.toUpperCase());

        const raw = await request(`/users?${params.toString()}`, { auth: true });
        return toArray(raw).map((item) => normalizeUser(item, item));
      },
      () => [],
      'getAdminUsers',
      { fallbackValue: [], allowFallback: false }
    ),

  updateAdminUserById: async (userId, payload = {}) =>
    withFallback(
      async () =>
        normalizeUser(await request(`/users/${userId}`, {
          method: 'PUT',
          auth: true,
          body: {
            name: payload?.name,
            email: payload?.email,
            phone: payload?.phone,
            address: payload?.address,
            city: payload?.city,
            active: payload?.active,
            status: payload?.status,
          },
        })),
      () => null,
      'updateAdminUserById',
      { throwOnError: true, allowFallback: false }
    ),

  toggleAdminUserStatus: async (userId, statusOrActive) =>
    withFallback(
      async () => {
        const payload =
          typeof statusOrActive === 'boolean'
            ? { active: statusOrActive }
            : { status: String(statusOrActive || '').trim().toLowerCase() };

        return normalizeUser(await request(`/users/${userId}/status`, {
          method: 'PUT',
          auth: true,
          body: payload,
        }));
      },
      () => null,
      'toggleAdminUserStatus',
      { throwOnError: true, allowFallback: false }
    ),

  deleteAdminUserById: async (userId) =>
    withFallback(
      async () =>
        await request(`/users/${userId}`, {
          method: 'DELETE',
          auth: true,
        }),
      () => null,
      'deleteAdminUserById',
      { throwOnError: true, allowFallback: false }
    ),

  getAdminVolunteers: async (filters = {}) =>
    withFallback(
      async () => {
        const params = new URLSearchParams();
        const page = Number(filters?.page ?? 0);
        const size = Number(filters?.size ?? 200);
        params.set('page', String(Number.isFinite(page) ? Math.max(0, page) : 0));
        params.set('size', String(Number.isFinite(size) ? Math.min(Math.max(size, 1), 500) : 200));
        params.set('role', 'VOLUNTEER');

        const raw = await request(`/users?${params.toString()}`, { auth: true });
        return toArray(raw).map((item) => normalizeUser(item, { ...item, role: 'volunteer' }));
      },
      () => [],
      'getAdminVolunteers',
      { fallbackValue: [], allowFallback: false }
    ),

  getAdminPickups: async (options = {}) =>
    withFallback(
      async () => {
        const requestedStatuses = Array.isArray(options?.statuses) && options.statuses.length
          ? options.statuses
          : ['pending', 'approved', 'scheduled', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected'];

        const normalizedStatuses = Array.from(
          new Set(
            requestedStatuses
              .map((status) => String(status || '').trim().toUpperCase())
              .filter(Boolean)
          )
        );

        if (!normalizedStatuses.length) return [];

        const responses = await Promise.allSettled(
          normalizedStatuses.map((status) =>
            request(`/pickups/status/${encodeURIComponent(status)}`, { auth: true })
          )
        );

        const seen = new Set();
        const merged = [];

        responses.forEach((chunk) => {
          if (chunk.status !== 'fulfilled') return;
          toArray(chunk.value).forEach((item) => {
            const normalized = normalizePickup(item, merged.length);
            const dedupeKey = String(
              normalized.pickup_id ||
              normalized.donation_id ||
              `${normalized.donor_name || 'donor'}-${normalized.pickup_date || ''}`
            ).trim();

            if (!dedupeKey || seen.has(dedupeKey)) return;
            seen.add(dedupeKey);
            merged.push(normalized);
          });
        });

        return merged.sort((left, right) => {
          const leftTime = new Date(left.pickup_date || '').getTime();
          const rightTime = new Date(right.pickup_date || '').getTime();
          const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
          const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
          return safeRight - safeLeft;
        });
      },
      () => [],
      'getAdminPickups',
      { fallbackValue: [], allowFallback: false }
    ),

  getAdminDonations: async (filters = {}) =>
    withFallback(
      async () => {
        const params = new URLSearchParams();
        const type = String(filters?.type || '').trim().toUpperCase();
        const paymentStatus = String(filters?.paymentStatus || '').trim().toLowerCase();
        const dateFrom = String(filters?.dateFrom || '').trim();
        const dateTo = String(filters?.dateTo || '').trim();
        const page = Number(filters?.page ?? 0);
        const size = Number(filters?.size ?? 200);

        if (type && type !== 'ALL') params.set('donationType', type);
        if (paymentStatus && paymentStatus !== 'all') params.set('paymentStatus', paymentStatus);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        params.set('page', String(Number.isFinite(page) ? Math.max(0, page) : 0));
        params.set('size', String(Number.isFinite(size) ? Math.min(Math.max(size, 1), 200) : 200));

        const endpoint = `/admin/donations?${params.toString()}`;
        let raw = null;
        let lastError = null;
        const candidates = [
          endpoint,
          `/donations/admin?${params.toString()}`,
        ];

        for (const candidate of candidates) {
          try {
            raw = await request(candidate, { auth: true });
            if (raw) break;
          } catch (error) {
            lastError = error;
          }
        }

        if (!raw) {
          throw lastError || new Error('Unable to load admin donations');
        }

        return toArray(raw).map((item, idx) => normalizeDonation(item, idx));
      },
      () => [],
      'getAdminDonations',
      { fallbackValue: [], allowFallback: false }
    ),

  updateAdminDonationPaymentStatus: async (donationId, paymentStatus) =>
    withFallback(
      async () =>
        normalizeDonation(await request(`/admin/donations/${donationId}/payment-status`, {
          method: 'PUT',
          auth: true,
          body: { paymentStatus: String(paymentStatus || '').trim().toLowerCase() },
        })),
      () => null,
      'updateAdminDonationPaymentStatus',
      { fallbackValue: null }
    ),

  generateAdminDonationReceipt: async (donationId) =>
    withFallback(
      async () =>
        normalizeDonation(await request(`/admin/donations/${donationId}/receipt`, {
          method: 'POST',
          auth: true,
        })),
      () => null,
      'generateAdminDonationReceipt',
      { fallbackValue: null }
    ),

  login: async (email, password) =>
    withFallback(
      async () => {
        const normalizedEmail = normalizeEmailInput(email);
        const user = await request('/auth/login', {
          method: 'POST',
          body: {
            email: normalizedEmail,
            password,
          },
        });
        return normalizeUser(user, { email: normalizedEmail });
      },
      () => null,
      'login',
      { throwOnError: true, allowFallback: false }
    ),

  loginWithGoogle: async (googleProfile) =>
    withFallback(
      async () => {
        const user = await request('/auth/google', {
          method: 'POST',
          body: { profile: googleProfile },
        });
        return normalizeUser(user, {
          email: googleProfile?.email,
          name: googleProfile?.name,
          avatar: googleProfile?.picture,
          provider: 'google',
        });
      },
      () => null,
      'loginWithGoogle',
      { throwOnError: true, allowFallback: false }
    ),

  register: async (userData) =>
    withFallback(
      async () => {
        const role = String(userData?.role || 'donor').toUpperCase();
        const normalizedEmail = normalizeEmailInput(userData?.email);
        const normalizedPhone = normalizePhoneInput(userData?.phone);
        const user = await request('/auth/register', {
          method: 'POST',
          body: {
                ...userData,
                email: normalizedEmail,
                phone: normalizedPhone || null,
                role,
                latitude: userData?.latitude ?? null,
                longitude: userData?.longitude ?? null,
          },
        });
        return normalizeUser(user, { ...userData, email: normalizedEmail, phone: normalizedPhone });
      },
      () => null,
      'register',
      { throwOnError: true, allowFallback: false }
    ),

  verifyEmailToken: async (token) =>
    withFallback(
      async () => {
        const message = await request(`/auth/verify-email?token=${encodeURIComponent(String(token || '').trim())}`);
        return {
          verified: true,
          message: typeof message === 'string' ? message : 'Email verified successfully.',
        };
      },
      () => ({ verified: false, message: 'Email verification is unavailable in offline mode.' }),
      'verifyEmailToken',
      { throwOnError: true, allowFallback: false }
    ),

  resendVerification: async (email) =>
    withFallback(
      async () => {
        const normalizedEmail = normalizeEmailInput(email);
        const message = await request('/auth/resend-verification', {
          method: 'POST',
          body: { email: normalizedEmail },
        });
        return {
          email: normalizedEmail,
          message: typeof message === 'string' ? message : 'Verification email sent.',
        };
      },
      () => ({ email: normalizeEmailInput(email), message: 'Verification resend is unavailable in offline mode.' }),
      'resendVerification',
      { throwOnError: true, allowFallback: false }
    ),

  sendEmailVerificationOtp: async (email) =>
    withFallback(
      async () => {
        const normalizedEmail = normalizeEmailInput(email);
        const message = await request('/auth/email/send-otp', {
          method: 'POST',
          body: { email: normalizedEmail },
        });
        return {
          email: normalizedEmail,
          message: typeof message === 'string' ? message : 'Verification OTP sent to your email.',
        };
      },
      () => ({ email: normalizeEmailInput(email), message: 'Email OTP is unavailable in offline mode.' }),
      'sendEmailVerificationOtp',
      { throwOnError: true, allowFallback: false }
    ),

  verifyEmailOtp: async (email, otp) =>
    withFallback(
      async () => {
        const normalizedEmail = normalizeEmailInput(email);
        const message = await request('/auth/email/verify-otp', {
          method: 'POST',
          body: { email: normalizedEmail, otp: String(otp || '').trim() },
        });
        return {
          email: normalizedEmail,
          verified: true,
          message: typeof message === 'string' ? message : 'Email verified successfully.',
        };
      },
      () => ({ email: normalizeEmailInput(email), verified: false, message: 'Email OTP verification is unavailable in offline mode.' }),
      'verifyEmailOtp',
      { throwOnError: true, allowFallback: false }
    ),

  forgotPassword: async (email) =>
    withFallback(
      async () => {
        const normalizedEmail = normalizeEmailInput(email);
        const message = await request('/auth/forgot-password', {
          method: 'POST',
          body: { email: normalizedEmail },
        });
        return {
          email: normalizedEmail,
          message: typeof message === 'string' ? message : 'Password reset OTP sent to your email.',
        };
      },
      () => ({
        email: normalizeEmailInput(email),
        message: 'Password reset is unavailable in offline mode.',
      }),
      'forgotPassword',
      { throwOnError: true, allowFallback: false }
    ),

  verifyForgotPasswordOtp: async (email, otp) =>
    withFallback(
      async () => {
        const normalizedEmail = normalizeEmailInput(email);
        const message = await request('/auth/forgot-password/verify-otp', {
          method: 'POST',
          body: { email: normalizedEmail, otp: String(otp || '').trim() },
        });
        return {
          email: normalizedEmail,
          verified: true,
          message: typeof message === 'string' ? message : 'OTP verified successfully.',
        };
      },
      () => ({
        email: normalizeEmailInput(email),
        verified: false,
        message: 'OTP verification is unavailable in offline mode.',
      }),
      'verifyForgotPasswordOtp',
      { throwOnError: true, allowFallback: false }
    ),

  resetPassword: async (email, newPassword) =>
    withFallback(
      async () => {
        const normalizedEmail = normalizeEmailInput(email);
        const message = await request('/auth/reset-password', {
          method: 'POST',
          body: { email: normalizedEmail, newPassword },
        });
        return {
          email: normalizedEmail,
          message: typeof message === 'string' ? message : 'Password reset successfully.',
        };
      },
      () => ({
        email: normalizeEmailInput(email),
        message: 'Password reset is unavailable in offline mode.',
      }),
      'resetPassword',
      { throwOnError: true, allowFallback: false }
    ),

  sendPhoneVerificationOtp: async (phone) =>
    withFallback(
      async () => {
        const normalizedPhone = normalizePhoneInput(phone);
        const message = await request('/auth/phone/send-otp', {
          method: 'POST',
          body: { phone: String(normalizedPhone || '').trim() },
        });
        return {
          phone: normalizedPhone,
          message: typeof message === 'string' ? message : 'OTP sent to your phone.',
        };
      },
      () => ({ phone, message: 'Phone OTP is unavailable in offline mode.' }),
      'sendPhoneVerificationOtp',
      { throwOnError: true, allowFallback: false }
    ),

  verifyPhoneOtp: async (phone, otp) =>
    withFallback(
      async () => {
        const normalizedPhone = normalizePhoneInput(phone);
        const message = await request('/auth/phone/verify-otp', {
          method: 'POST',
          body: {
            phone: String(normalizedPhone || '').trim(),
            otp: String(otp || '').trim(),
          },
        });
        return {
          phone: normalizedPhone,
          verified: true,
          message: typeof message === 'string' ? message : 'Phone verified successfully.',
        };
      },
      () => ({ phone, verified: false, message: 'Phone verification is unavailable in offline mode.' }),
      'verifyPhoneOtp',
      { throwOnError: true, allowFallback: false }
    ),

  getDeliveryStatus: async () =>
    withFallback(
      async () => await request('/auth/delivery-status', { auth: true }),
      () => null,
      'getDeliveryStatus',
      { throwOnError: true, allowFallback: false }
    ),

  getCurrentUser: async () =>
    withFallback(
      async () => normalizeUser(await request('/users/me', { auth: true })),
      () => null,
      'getCurrentUser',
      { throwOnError: true, allowFallback: false }
    ),

  updateProfile: async (payload) =>
    withFallback(
      async () => normalizeUser(await request('/users/me', {
        method: 'PUT',
        auth: true,
        body: {
          name: payload?.name,
          phone: payload?.phone,
          address: payload?.address,
          city: payload?.city,
          latitude: payload?.latitude ?? null,
          longitude: payload?.longitude ?? null,
          emailUpdatesEnabled: payload?.emailUpdatesEnabled,
          smsNotificationsEnabled: payload?.smsNotificationsEnabled,
          campaignAlertsEnabled: payload?.campaignAlertsEnabled,
          weeklyDigestEnabled: payload?.weeklyDigestEnabled,
          pickupRemindersEnabled: payload?.pickupRemindersEnabled,
        },
      })),
      () => null,
      'updateProfile',
      { throwOnError: true, allowFallback: false }
    ),

  changePassword: async (oldPassword, newPassword) =>
    withFallback(
      async () => request('/users/me/password', {
        method: 'PUT',
        auth: true,
        body: {
          oldPassword: String(oldPassword || ''),
          newPassword: String(newPassword || ''),
        },
      }),
      () => null,
      'changePassword',
      { throwOnError: true, allowFallback: false }
    ),

  deleteAccount: async (password) =>
    withFallback(
      async () => request('/users/me', {
        method: 'DELETE',
        auth: true,
        body: { password: String(password || '') },
      }),
      () => null,
      'deleteAccount',
      { throwOnError: true, allowFallback: false }
    ),

  getNotifications: async () =>
    withFallback(
      async () => toArray(await request('/notifications', { auth: true }))
        .map((item, idx) => normalizeNotification(item, idx)),
      () => [],
      'getNotifications',
      { throwOnError: true, fallbackValue: [] }
    ),

  markNotificationRead: async (id) =>
    withFallback(
      async () => request(`/notifications/${id}/read`, {
        method: 'PUT',
        auth: true,
      }),
      () => null,
      'markNotificationRead',
      { throwOnError: true }
    ),

  markAllNotificationsRead: async () =>
    withFallback(
      async () => request('/notifications/read-all', {
        method: 'PUT',
        auth: true,
      }),
      () => null,
      'markAllNotificationsRead',
      { throwOnError: true }
    ),

  sendNGONotification: async (payload = {}) =>
    withFallback(
      async () => request('/notifications/ngo/send', {
        method: 'POST',
        auth: true,
        body: {
          title: String(payload?.title || '').trim(),
          message: String(payload?.message || '').trim(),
          audience: String(payload?.audience || 'DONORS').trim().toUpperCase(),
          notificationType: String(payload?.notificationType || 'GENERAL').trim().toUpperCase(),
          templateKey: String(payload?.templateKey || '').trim(),
          campaignId: payload?.campaignId ?? null,
          pickupId: payload?.pickupId ?? null,
          sendEmail: Boolean(payload?.sendEmail),
          recipientUserIds: Array.isArray(payload?.recipientUserIds)
            ? payload.recipientUserIds.map((id) => parseNumber(id, 0)).filter((id) => id > 0)
            : [],
          recipientEmails: Array.isArray(payload?.recipientEmails)
            ? payload.recipientEmails.map((email) => String(email || '').trim().toLowerCase()).filter(Boolean)
            : [],
        },
      }),
      () => null,
      'sendNGONotification',
      { throwOnError: true }
    ),

  sendAdminNotificationEmail: async (payload = {}) =>
    withFallback(
      async () => {
        const body = {
          title: String(payload?.title || '').trim(),
          message: String(payload?.message || '').trim(),
          audience: String(payload?.audience || 'all').trim().toLowerCase(),
          type: String(payload?.notificationType || payload?.type || 'system').trim().toLowerCase(),
          severity: String(payload?.severity || 'medium').trim().toLowerCase(),
          subject: String(payload?.emailSubject || payload?.title || '').trim(),
          recipientEmails: Array.isArray(payload?.recipientEmails)
            ? payload.recipientEmails.map((item) => String(item || '').trim()).filter(Boolean)
            : [],
        };

        const candidates = ['/notifications/send-email', '/notifications/email', '/notifications/send'];
        let lastError = null;

        for (const endpoint of candidates) {
          try {
            return await request(endpoint, {
              method: 'POST',
              auth: true,
              body,
            });
          } catch (error) {
            lastError = error;
          }
        }

        throw lastError || new Error('Unable to send notification email');
      },
      () => null,
      'sendAdminNotificationEmail',
      { fallbackValue: null, allowFallback: false }
    ),

  getMyReceipts: async () =>
    withFallback(
      async () => toArray(await request('/receipts/my', { auth: true }))
        .map((item, idx) => normalizeReceipt(item, idx)),
      () => [],
      'getMyReceipts',
      { throwOnError: true, fallbackValue: [] }
    ),

  getReceiptByNumber: async (receiptNumber) =>
    withFallback(
      async () => normalizeReceipt(await request(`/receipts/${encodeURIComponent(receiptNumber)}`, { auth: true })),
      () => null,
      'getReceiptByNumber',
      { throwOnError: true }
    ),

  downloadReceiptPdf: async (receiptNumber) =>
    withFallback(
      async () => {
        const normalizedReceipt = String(receiptNumber || '').trim();
        if (!normalizedReceipt) {
          throw new Error('Receipt number is required');
        }

        const token = getStoredAuthToken();

        const response = await fetch(
          buildApiUrl(`/receipts/${encodeURIComponent(normalizedReceipt)}/pdf`),
          {
            method: 'GET',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        if (!response.ok) {
          const message = await response.text().catch(() => '');
          throw new Error(message || `Failed to download receipt (${response.status})`);
        }

        return await response.blob();
      },
      () => null,
      'downloadReceiptPdf',
      { throwOnError: true, allowFallback: false }
    ),

  getMyPickups: async () =>
    withFallback(
      async () => toArray(await request('/pickups/my', { auth: true }))
        .map((item, idx) => normalizePickup(item, idx)),
      () => [],
      'getMyPickups',
      { throwOnError: true, fallbackValue: [] }
    ),

  getNGOPickups: async (status = '') =>
    withFallback(
      async () => {
        const normalizedStatus = String(status || '').trim().toUpperCase();
        const endpoint = normalizedStatus
          ? `/pickups/ngo?status=${encodeURIComponent(normalizedStatus)}`
          : '/pickups/ngo';
        return toArray(await request(endpoint, { auth: true }))
          .map((item, idx) => normalizePickup(item, idx));
      },
      () => [],
      'getNGOPickups',
      { throwOnError: true, fallbackValue: [] }
    ),

  getNGOVolunteers: async () =>
    withFallback(
      async () => {
        const raw = await request('/ngos/volunteers', { auth: true });
        return toArray(raw).map((item, idx) => ({
          volunteer_id: parseNumber(item?.volunteerId ?? item?.volunteer_id, idx + 1),
          user_id: parseNumber(item?.userId ?? item?.user_id, 0),
          name: String(item?.name || item?.volunteer_name || `Volunteer ${idx + 1}`).trim(),
          email: String(item?.email || '').trim(),
          phone: String(item?.phone || '').trim(),
          status: String(item?.status || 'ACTIVE').trim().toUpperCase(),
          joined_date: item?.joinedDate || item?.joined_date || null,
          tasks_completed: parseNumber(item?.tasksCompleted ?? item?.tasks_completed, 0),
          hours_volunteered: parseNumber(item?.hoursVolunteered ?? item?.hours_volunteered, 0),
        }));
      },
      () => [],
      'getNGOVolunteers',
      { throwOnError: true, fallbackValue: [] }
    ),

  getNGOVolunteerStats: async () =>
    withFallback(
      async () => {
        const raw = await request('/ngos/volunteers/stats', { auth: true });
        return {
          totalVolunteers: parseNumber(raw?.totalVolunteers ?? raw?.total_volunteers, 0),
          activeVolunteers: parseNumber(raw?.activeVolunteers ?? raw?.active_volunteers, 0),
          inactiveVolunteers: parseNumber(raw?.inactiveVolunteers ?? raw?.inactive_volunteers, 0),
          totalHoursVolunteered: parseNumber(raw?.totalHoursVolunteered ?? raw?.total_hours_volunteered, 0),
          totalTasksCompleted: parseNumber(raw?.totalTasksCompleted ?? raw?.total_tasks_completed, 0),
          ongoingTasks: parseNumber(raw?.ongoingTasks ?? raw?.ongoing_tasks, 0),
        };
      },
      () => ({
        totalVolunteers: 0,
        activeVolunteers: 0,
        inactiveVolunteers: 0,
        totalHoursVolunteered: 0,
        totalTasksCompleted: 0,
        ongoingTasks: 0,
      }),
      'getNGOVolunteerStats',
      { throwOnError: true }
    ),

  getNGOVolunteerSchedule: async () =>
    withFallback(
      async () => {
        const raw = await request('/ngos/volunteers/schedule/all', { auth: true });
        return toArray(raw).map((item, idx) => ({
          task_id: parseNumber(item?.taskId ?? item?.task_id, idx + 1),
          volunteer_id: parseNumber(item?.volunteerId ?? item?.volunteer_id, 0),
          volunteer_name: String(item?.volunteerName || item?.volunteer_name || '').trim(),
          description: String(item?.description || '').trim(),
          status: String(item?.status || 'ASSIGNED').trim().toUpperCase(),
          assigned_date: item?.assignedDate || item?.assigned_date || null,
          completed_date: item?.completedDate || item?.completed_date || null,
          pickup_id: parseNumber(item?.pickupId ?? item?.pickup_id, 0),
        }));
      },
      () => [],
      'getNGOVolunteerSchedule',
      { throwOnError: true, fallbackValue: [] }
    ),

  getNGOVolunteerTaskHistory: async (volunteerId) =>
    withFallback(
      async () => {
        const raw = await request(`/ngos/volunteers/${encodeURIComponent(volunteerId)}/task-history`, { auth: true });
        return toArray(raw).map((item, idx) => ({
          task_id: parseNumber(item?.taskId ?? item?.task_id, idx + 1),
          description: String(item?.description || '').trim(),
          status: String(item?.status || 'ASSIGNED').trim().toUpperCase(),
          assigned_date: item?.assignedDate || item?.assigned_date || null,
          completed_date: item?.completedDate || item?.completed_date || null,
          pickup_id: parseNumber(item?.pickupId ?? item?.pickup_id, 0),
        }));
      },
      () => [],
      'getNGOVolunteerTaskHistory',
      { throwOnError: true, fallbackValue: [] }
    ),

  updateNGOVolunteerStatus: async (volunteerId, status) =>
    withFallback(
      async () => request(
        `/ngos/volunteers/${encodeURIComponent(volunteerId)}/status?status=${encodeURIComponent(String(status || '').toUpperCase())}`,
        {
          method: 'PUT',
          auth: true,
        }
      ),
      () => null,
      'updateNGOVolunteerStatus',
      { throwOnError: true }
    ),

  registerNGOVolunteer: async (payload = {}) =>
    withFallback(
      async () =>
        request('/ngos/volunteers/register', {
          method: 'POST',
          auth: true,
          body: {
            userId: parseNumber(payload.userId ?? payload.user_id, 0),
          },
        }),
      () => null,
      'registerNGOVolunteer',
      { throwOnError: true }
    ),

  decideNGOPickup: async (pickupId, decision) =>
    withFallback(
      async () => normalizePickup(await request(
        `/pickups/ngo/${pickupId}/decision?decision=${encodeURIComponent(String(decision || '').trim().toLowerCase())}`,
        {
          method: 'PUT',
          auth: true,
        }
      )),
      () => null,
      'decideNGOPickup',
      { throwOnError: true }
    ),

  assignNGOPickupVolunteer: async (pickupId, volunteerId, description = '') =>
    withFallback(
      async () => normalizePickup(await request(
        `/pickups/ngo/${pickupId}/assign?volunteerId=${encodeURIComponent(String(volunteerId || ''))}${description ? `&description=${encodeURIComponent(String(description).trim())}` : ''}`,
        {
          method: 'PUT',
          auth: true,
        }
      )),
      () => null,
      'assignNGOPickupVolunteer',
      { throwOnError: true }
    ),

  updateNGOPickupStatus: async (pickupId, status) =>
    withFallback(
      async () => normalizePickup(await request(
        `/pickups/ngo/${pickupId}/status?status=${encodeURIComponent(String(status || '').trim().toUpperCase())}`,
        {
          method: 'PUT',
          auth: true,
        }
      )),
      () => null,
      'updateNGOPickupStatus',
      { throwOnError: true }
    ),

  assignAdminPickupVolunteer: async (pickupId, volunteerId, description = '') =>
    withFallback(
      async () => normalizePickup(await request(
        `/pickups/admin/${pickupId}/assign?volunteerId=${encodeURIComponent(String(volunteerId || ''))}${description ? `&description=${encodeURIComponent(String(description).trim())}` : ''}`,
        {
          method: 'PUT',
          auth: true,
        }
      )),
      () => null,
      'assignAdminPickupVolunteer',
      { throwOnError: true, allowFallback: false }
    ),

  updateAdminPickupStatus: async (pickupId, status) =>
    withFallback(
      async () => normalizePickup(await request(
        `/pickups/${pickupId}/status?status=${encodeURIComponent(String(status || '').trim().toUpperCase())}`,
        {
          method: 'PUT',
          auth: true,
        }
      )),
      () => null,
      'updateAdminPickupStatus',
      { throwOnError: true, allowFallback: false }
    ),

  schedulePickup: async (payload = {}) => {
    // Clean up the payload to ensure proper types
    const cleanPayload = {
      donationId: parseNumber(payload.donationId ?? payload.donation_id, 0),
      address: String(payload.address || '').trim(),
      pickupDate: payload.pickupDate || payload.pickup_date || null,
      timeSlot: String(payload.timeSlot || payload.time_slot || '').trim(),
      contactPhone: String(payload.contactPhone || payload.contact_phone || '').trim(),
      notes: String(payload.notes || '').trim(),
    };

    // Only include lat/lng if they exist as valid numbers
    const lat = payload.latitude ?? payload.lat;
    const lng = payload.longitude ?? payload.lng;
    if (lat !== null && lat !== undefined && !isNaN(Number(lat))) {
      cleanPayload.latitude = Number(lat);
    }
    if (lng !== null && lng !== undefined && !isNaN(Number(lng))) {
      cleanPayload.longitude = Number(lng);
    }

    return withFallback(
      async () => normalizePickup(await request(
        '/pickups',
        {
          method: 'POST',
          auth: true,
          body: cleanPayload,
        }
      )),
      () => null,
      'schedulePickup',
      { throwOnError: true }
    );
  },

  getPickupsByStatus: async (status) =>
    withFallback(
      async () => toArray(await request(`/pickups/status/${encodeURIComponent(status)}`, { auth: true }))
        .map((item, idx) => normalizePickup(item, idx)),
      () => [],
      'getPickupsByStatus',
      { throwOnError: true, fallbackValue: [] }
    ),

  getLivePickupTracking: async () =>
    withFallback(
      async () => toArray(await request('/pickups/live', { auth: true }))
        .map((item, idx) => normalizePickup(item, idx)),
      () => [
        {
          pickup_id: 1,
          donor_name: 'Anita Sharma',
          donor_address: 'Andheri West, Mumbai',
          latitude: 19.1206,
          longitude: 72.8460,
          volunteer_name: 'Arjun',
          volunteer_latitude: 19.1025,
          volunteer_longitude: 72.8622,
          items: ['food', 'clothes'],
          contact_phone: '+91 9876543210',
          pickup_status: 'en_route',
        },
        {
          pickup_id: 2,
          donor_name: 'Rahul Verma',
          donor_address: 'Powai, Mumbai',
          latitude: 19.1176,
          longitude: 72.9060,
          volunteer_name: 'Meena',
          volunteer_latitude: 19.0950,
          volunteer_longitude: 72.8950,
          items: ['books'],
          contact_phone: '+91 9123456789',
          pickup_status: 'en_route',
        },
      ].map((item, idx) => normalizePickup(item, idx)),
      'getLivePickupTracking',
      { fallbackValue: [] }
    ),

  getNGOs: async () =>
    withFallback(
      async () => toArray(await request('/ngos')).map((item, idx) => normalizeNGO(item, idx)),
      () => [],
      'getNGOs',
      { fallbackValue: [] }
    ),

  // ── Public platform stats (no auth required) ──────────────────────────────
  getPublicStats: async () =>
    withFallback(
      async () => normalizeStats(await request('/public/stats')),
      () => null,
      'getPublicStats',
      { fallbackValue: null }
    ),

  // ── Role-specific dashboard stats ────────────────────────────────────────
  getNGOStats: async () =>
    withFallback(
      async () => await request('/dashboard/ngo/stats', { auth: true }),
      () => null,
      'getNGOStats',
      { fallbackValue: null }
    ),

  getDonorStats: async () =>
    withFallback(
      async () => await request('/dashboard/donor/stats', { auth: true }),
      () => null,
      'getDonorStats',
      { fallbackValue: null }
    ),

  getVolunteerDashboardStats: async () =>
    withFallback(
      async () => await request('/dashboard/volunteer/stats', { auth: true }),
      () => null,
      'getVolunteerDashboardStats',
      { fallbackValue: null }
    ),

  // ── Volunteer tasks ───────────────────────────────────────────────────────
  getVolunteerTasks: async () =>
    withFallback(
      async () => toArray(await request('/volunteers/tasks', { auth: true }))
        .map((item, idx) => normalizeVolunteerTask(item, idx)),
      () => [],
      'getVolunteerTasks',
      { fallbackValue: [] }
    ),

  getVolunteerAwaitingAssignmentPickups: async () =>
    withFallback(
      async () => toArray(await request('/volunteers/pickups/awaiting-assignment', { auth: true }))
        .map((item, idx) => normalizePickup(item, idx)),
      () => [],
      'getVolunteerAwaitingAssignmentPickups',
      { fallbackValue: [] }
    ),

  claimVolunteerPickup: async (pickupId) =>
    withFallback(
      async () => await request(`/volunteers/pickups/${encodeURIComponent(String(pickupId || ''))}/claim`, {
        method: 'PUT',
        auth: true,
      }),
      () => null,
      'claimVolunteerPickup',
      { throwOnError: true }
    ),

  completeTask: async (taskId) =>
    withFallback(
      async () => request(`/volunteers/tasks/${taskId}/complete`, {
        method: 'PUT',
        auth: true,
      }),
      () => null,
      'completeTask',
      { throwOnError: true }
    ),

  uploadProof: async ({ donationId, type, file }) =>
    withFallback(
      async () => {
        const payload = new FormData();
        payload.append('donationId', String(donationId || ''));
        payload.append('type', String(type || '').toUpperCase());
        payload.append('file', file);

        return await request('/upload-proof', {
          method: 'POST',
          auth: true,
          body: payload,
        });
      },
      () => null,
      'uploadProof',
      { throwOnError: true }
    ),

  getDonationProofs: async (donationId) =>
    withFallback(
      async () => toArray(await request(`/proofs/donation/${encodeURIComponent(String(donationId || ''))}`, { auth: true })),
      () => [],
      'getDonationProofs',
      { fallbackValue: [] }
    ),

  submitPickupRating: async (pickupId, payload = {}) =>
    withFallback(
      async () =>
        await request(`/ratings/pickups/${encodeURIComponent(String(pickupId || ''))}`, {
          method: 'POST',
          auth: true,
          body: {
            stars: parseNumber(payload?.stars, 0),
            feedback: String(payload?.feedback || '').trim(),
          },
        }),
      () => null,
      'submitPickupRating',
      { throwOnError: true }
    ),

  updateVolunteerTaskStatus: async (taskId, status) =>
    withFallback(
      async () => {
        const normalizedStatus = String(status || '').trim().toUpperCase();
        if (!normalizedStatus) {
          throw new Error('Task status is required');
        }

        try {
          return await request(
            `/volunteers/tasks/${taskId}/status?status=${encodeURIComponent(normalizedStatus)}`,
            {
              method: 'PUT',
              auth: true,
            }
          );
        } catch (error) {
          if (normalizedStatus === 'COMPLETED') {
            return await request(`/volunteers/tasks/${taskId}/complete`, {
              method: 'PUT',
              auth: true,
            });
          }
          throw error;
        }
      },
      () => ({ taskId, status }),
      'updateVolunteerTaskStatus',
      { throwOnError: true }
    ),

  registerVolunteer: async (payload = {}) =>
    withFallback(
      async () =>
        request('/volunteers/register', {
          method: 'POST',
          auth: true,
          body: {
            userId: parseNumber(payload.userId ?? payload.user_id, 0),
            ngoId: payload.ngoId ?? payload.ngo_id ?? null,
            skills: String(payload.skills || '').trim(),
            availability: String(payload.availability || '').trim(),
            preferredCity: String(payload.preferredCity || payload.city || '').trim(),
            motivation: String(payload.motivation || '').trim(),
          },
        }),
      () => ({ submitted: true }),
      'registerVolunteer',
      { throwOnError: true }
    ),

  // ── NGO campaigns ─────────────────────────────────────────────────────────
  getNGOCampaigns: async (page = 0, size = 20) =>
    withFallback(
      async () => {
        const raw = await request(`/campaigns/my?page=${page}&size=${size}`, { auth: true });
        const items = toArray(raw);
        return items.map((item, idx) => normalizeCampaign(item, idx));
      },
      () => [],
      'getNGOCampaigns',
      { fallbackValue: [] }
    ),

  createCampaign: async (payload = {}) =>
    withFallback(
      async () => normalizeCampaign(await request('/campaigns', {
        method: 'POST',
        auth: true,
        body: {
          title: String(payload?.title || '').trim(),
          description: String(payload?.description || '').trim(),
          ngoId: payload?.ngoId ?? payload?.ngo_id ?? null,
          donationType: String(payload?.donationType ?? payload?.donation_type ?? 'MONEY').trim().toUpperCase(),
          targetAmount: parseNumber(payload?.targetAmount ?? payload?.target_amount, 0),
          startDate: payload?.startDate ?? payload?.start_date ?? null,
          endDate: payload?.endDate ?? payload?.end_date ?? null,
          image: payload?.image ?? null,
          city: String(payload?.city || '').trim(),
          state: String(payload?.state || '').trim(),
        },
      })),
      () => null,
      'createCampaign',
      { throwOnError: true }
    ),

  updateCampaign: async (id, payload) =>
    withFallback(
      async () => normalizeCampaign(await request(`/campaigns/${id}`, {
        method: 'PUT',
        auth: true,
        body: {
          title: payload?.title,
          description: payload?.description,
          ngoId: payload?.ngoId ?? payload?.ngo_id,
          donationType: payload?.donationType ?? payload?.donation_type,
          targetAmount: payload?.targetAmount ?? payload?.target_amount,
          startDate: payload?.startDate ?? payload?.start_date,
          endDate: payload?.endDate ?? payload?.end_date,
          image: payload?.image,
          city: payload?.city,
          state: payload?.state,
        },
      })),
      () => null,
      'updateCampaign',
      { throwOnError: true }
    ),

  updateCampaignStatus: async (id, status) =>
    withFallback(
      async () => normalizeCampaign(await request(`/campaigns/${id}/status?status=${status}`, {
        method: 'PUT',
        auth: true,
      })),
      () => null,
      'updateCampaignStatus',
      { throwOnError: true }
    ),

  deleteCampaign: async (id) =>
    withFallback(
      async () => request(`/campaigns/${id}`, { method: 'DELETE', auth: true }),
      () => null,
      'deleteCampaign',
      { throwOnError: true }
    ),

  // ── Campaign updates feed ────────────────────────────────────────────────
  getCampaignUpdates: async (campaignId) =>
    withFallback(
      async () => {
        const raw = await request(`/campaigns/${campaignId}/updates`);
        return toArray(raw).map((item, idx) =>
          normalizeCampaignUpdate({ ...item, campaign_id: item?.campaign_id ?? campaignId }, idx)
        );
      },
      () => {
        const now = Date.now();
        return [
          {
            id: 1,
            campaign_id: parseNumber(campaignId, 0),
            ngo_name: 'Campaign NGO',
            message: 'Food distributed to 200 families in the first relief phase.',
            impact_count: 200,
            impact_label: 'families reached',
            posted_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
            posted_by: 'Operations Lead',
          },
          {
            id: 2,
            campaign_id: parseNumber(campaignId, 0),
            ngo_name: 'Campaign NGO',
            message: 'Volunteer team completed 35 pickup routes this week.',
            impact_count: 35,
            impact_label: 'pickup routes completed',
            posted_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
            posted_by: 'Field Coordinator',
          },
          {
            id: 3,
            campaign_id: parseNumber(campaignId, 0),
            ngo_name: 'Campaign NGO',
            message: 'Distribution report verified and uploaded for donor transparency.',
            impact_count: 1,
            impact_label: 'report published',
            posted_at: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(),
            posted_by: 'NGO Admin',
          },
        ].map((item, idx) => normalizeCampaignUpdate(item, idx));
      },
      'getCampaignUpdates',
      { fallbackValue: [] }
    ),

  createCampaignUpdate: async (campaignId, payload) =>
    withFallback(
      async () => {
        const created = await request(`/campaigns/${campaignId}/updates`, {
          method: 'POST',
          auth: true,
          body: {
            message: String(payload?.message || '').trim(),
            impactCount: parseNumber(payload?.impact_count ?? payload?.impactCount, 0),
            impactLabel: String(payload?.impact_label ?? payload?.impactLabel ?? '').trim(),
            imageUrl: payload?.image_url ?? payload?.imageUrl ?? '',
          },
        });
        return normalizeCampaignUpdate({ ...created, campaign_id: campaignId });
      },
      () =>
        normalizeCampaignUpdate({
          id: Date.now(),
          campaign_id: parseNumber(campaignId, 0),
          message: String(payload?.message || '').trim(),
          impact_count: parseNumber(payload?.impact_count ?? payload?.impactCount, 0),
          impact_label: String(payload?.impact_label ?? payload?.impactLabel ?? '').trim(),
          posted_at: new Date().toISOString(),
          posted_by: 'NGO Admin',
        }),
      'createCampaignUpdate',
      { throwOnError: true }
    ),

  updateCampaignUpdate: async (campaignId, updateId, payload) =>
    withFallback(
      async () => {
        const updated = await request(`/campaigns/${campaignId}/updates/${updateId}`, {
          method: 'PUT',
          auth: true,
          body: {
            message: String(payload?.message || '').trim(),
            impactCount: parseNumber(payload?.impact_count ?? payload?.impactCount, 0),
            impactLabel: String(payload?.impact_label ?? payload?.impactLabel ?? '').trim(),
          },
        });
        return normalizeCampaignUpdate({ ...updated, campaign_id: campaignId, id: updateId });
      },
      () =>
        normalizeCampaignUpdate({
          id: parseNumber(updateId, Date.now()),
          campaign_id: parseNumber(campaignId, 0),
          message: String(payload?.message || '').trim(),
          impact_count: parseNumber(payload?.impact_count ?? payload?.impactCount, 0),
          impact_label: String(payload?.impact_label ?? payload?.impactLabel ?? '').trim(),
          posted_at: new Date().toISOString(),
          posted_by: 'NGO Admin',
        }),
      'updateCampaignUpdate',
      { throwOnError: true }
    ),

  deleteCampaignUpdate: async (campaignId, updateId) =>
    withFallback(
      async () => request(`/campaigns/${campaignId}/updates/${updateId}`, {
        method: 'DELETE',
        auth: true,
      }),
      () => ({ deleted: true }),
      'deleteCampaignUpdate',
      { throwOnError: true }
    ),

  setCampaignUpdatePinned: async (campaignId, updateId, pinned = true) =>
    withFallback(
      async () => {
        let updated;

        // Primary contract: PUT /pin with { pinned } body
        try {
          updated = await request(`/campaigns/${campaignId}/updates/${updateId}/pin`, {
            method: 'PUT',
            auth: true,
            body: { pinned: Boolean(pinned) },
          });
        } catch (_primaryError) {
          // Compatibility contract: PUT /pin or PUT /unpin (no body)
          const actionPath = pinned ? 'pin' : 'unpin';
          updated = await request(`/campaigns/${campaignId}/updates/${updateId}/${actionPath}`, {
            method: 'PUT',
            auth: true,
          });
        }

        return normalizeCampaignUpdate({
          ...updated,
          campaign_id: campaignId,
          id: updateId,
          is_pinned: Boolean(updated?.is_pinned ?? updated?.isPinned ?? pinned),
        });
      },
      () =>
        normalizeCampaignUpdate({
          id: parseNumber(updateId, Date.now()),
          campaign_id: parseNumber(campaignId, 0),
          is_pinned: Boolean(pinned),
          pinned_at: pinned ? new Date().toISOString() : null,
        }),
      'setCampaignUpdatePinned',
      { throwOnError: true }
    ),

  // ── Volunteer leaderboard ────────────────────────────────────────────────
  getVolunteerLeaderboard: async (campaignId, limit = 5) =>
    withFallback(
      async () => {
        const raw = await request(`/campaigns/${campaignId}/volunteers/leaderboard?limit=${limit}`);
        return toArray(raw)
          .map((item, idx) => normalizeVolunteerLeader(item, idx))
          .sort((a, b) => b.pickups - a.pickups)
          .slice(0, limit);
      },
      () =>
        [
          { id: 1, name: 'Arjun', pickups: 12, badge: 'Gold' },
          { id: 2, name: 'Ravi', pickups: 9, badge: 'Silver' },
          { id: 3, name: 'Meena', pickups: 7, badge: 'Bronze' },
          { id: 4, name: 'Priya', pickups: 6, badge: 'Rising Star' },
          { id: 5, name: 'Karan', pickups: 5, badge: 'Rising Star' },
        ]
          .map((item, idx) => normalizeVolunteerLeader(item, idx))
          .slice(0, limit),
      'getVolunteerLeaderboard',
      { fallbackValue: [] }
    ),

  // ── AI Campaign Recommendations ───────────────────────────────────────────
  getRecommendations: async () =>
    withFallback(
      async () =>
        toArray(await request('/recommendations', { auth: true })).map((raw, idx) => ({
          campaign_id:       parseNumber(raw.campaignId ?? raw.campaign_id ?? raw.id, 0),
          title:             raw.title             ?? 'Campaign',
          description:       raw.description       ?? '',
          image:             resolveImageUrl(raw.image ?? null),
          ngo_name:          raw.ngoName           ?? raw.ngo_name ?? '',
          ngo_id:            raw.ngoId             ?? raw.ngo_id   ?? 0,
          city:              raw.city              ?? '',
          donation_type:     (raw.donationType     ?? raw.donation_type ?? 'money').toLowerCase(),
          target_amount:     parseNumber(raw.targetAmount   ?? raw.target_amount,   0),
          collected_amount:  parseNumber(raw.collectedAmount?? raw.collected_amount, 0),
          donors_count:      parseNumber(raw.donorsCount    ?? raw.donors_count,     0),
          percentage_funded: parseNumber(raw.percentageFunded ?? raw.percentage_funded, 0),
          days_left:         parseNumber(raw.daysLeft        ?? raw.days_left,        0),
          score:             parseNumber(raw.score,           0),
          match_label:       raw.matchLabel        ?? raw.match_label  ?? '🌟 Recommended',
          match_reason:      raw.matchReason       ?? raw.match_reason ?? 'Discover new causes',
        })),
      (err) => {
        console.warn('[api] getRecommendations fallback', err?.message);
        return [];
      },
      'getRecommendations',
      { fallbackValue: [] }
    ),
};

export default api;
