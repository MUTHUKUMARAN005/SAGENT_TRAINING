const DEFAULT_VITALS = {
  heartRate: 78,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  oxygenLevel: 98,
  temperature: 98.6,
};

const LOCAL_ALERTS_KEY_PREFIX = 'patient_local_alerts_';
const ALERT_DEDUPE_WINDOW_MS = 2 * 60 * 1000;
const MAX_ALERT_HISTORY = 150;

const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getLocalAlertsKey = (userId) => `${LOCAL_ALERTS_KEY_PREFIX}${userId || 'unknown'}`;

const safeNowIso = () => new Date().toISOString();

const safeGetLocalStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const normalizeVitals = (record = {}) => ({
  heartRate: clamp(toNumber(record.heartRate, DEFAULT_VITALS.heartRate), 30, 220),
  bloodPressureSystolic: clamp(
    toNumber(record.bloodPressureSystolic, DEFAULT_VITALS.bloodPressureSystolic),
    70,
    250
  ),
  bloodPressureDiastolic: clamp(
    toNumber(record.bloodPressureDiastolic, DEFAULT_VITALS.bloodPressureDiastolic),
    40,
    150
  ),
  oxygenLevel: clamp(toNumber(record.oxygenLevel, DEFAULT_VITALS.oxygenLevel), 70, 100),
  temperature: clamp(toNumber(record.temperature, DEFAULT_VITALS.temperature), 93, 108),
});

export const simulateVitals = (previousVitals = DEFAULT_VITALS) => {
  const prev = normalizeVitals(previousVitals);
  const next = {
    heartRate: clamp(prev.heartRate + (Math.random() * 8 - 4), 48, 150),
    bloodPressureSystolic: clamp(prev.bloodPressureSystolic + (Math.random() * 10 - 5), 95, 190),
    bloodPressureDiastolic: clamp(prev.bloodPressureDiastolic + (Math.random() * 6 - 3), 58, 120),
    oxygenLevel: clamp(prev.oxygenLevel + (Math.random() * 2 - 1), 84, 100),
    temperature: clamp(prev.temperature + (Math.random() * 0.4 - 0.2), 96, 104),
  };

  return {
    ...next,
    heartRate: Math.round(next.heartRate),
    bloodPressureSystolic: Math.round(next.bloodPressureSystolic),
    bloodPressureDiastolic: Math.round(next.bloodPressureDiastolic),
    oxygenLevel: Math.round(next.oxygenLevel),
    temperature: Math.round(next.temperature * 10) / 10,
  };
};

export const getVitalStatus = (metric, value, auxValue = null) => {
  const val = toNumber(value, 0);
  const aux = toNumber(auxValue, null);

  if (metric === 'heartRate') {
    if (val >= 130 || val < 45) return { tone: 'danger', label: 'Critical' };
    if (val > 110 || val < 55) return { tone: 'warning', label: 'High/Low' };
    return { tone: 'success', label: 'Normal' };
  }

  if (metric === 'oxygenLevel') {
    if (val < 88) return { tone: 'danger', label: 'Critical' };
    if (val < 93) return { tone: 'warning', label: 'Low' };
    return { tone: 'success', label: 'Normal' };
  }

  if (metric === 'temperature') {
    if (val >= 103) return { tone: 'danger', label: 'High Fever' };
    if (val >= 100.4) return { tone: 'warning', label: 'Fever' };
    return { tone: 'success', label: 'Normal' };
  }

  if (metric === 'bloodPressure') {
    if (val >= 160 || (aux !== null && aux >= 100)) return { tone: 'danger', label: 'Critical' };
    if (val >= 140 || (aux !== null && aux >= 90)) return { tone: 'warning', label: 'High' };
    return { tone: 'success', label: 'Normal' };
  }

  return { tone: 'success', label: 'Normal' };
};

export const buildVitalAlerts = (vitals, source = 'LIVE_MONITOR') => {
  const normalized = normalizeVitals(vitals);
  const createdAt = safeNowIso();
  const alerts = [];
  let criticalSignals = 0;

  if (normalized.heartRate > 110) {
    alerts.push({
      type: 'HIGH_HEART_RATE',
      message: `High heart rate detected: ${normalized.heartRate} bpm.`,
      severity: normalized.heartRate >= 130 ? 'critical' : 'warning',
      createdAt,
      source,
    });
  }
  if (normalized.heartRate >= 130 || normalized.heartRate < 45) {
    criticalSignals += 1;
  }

  if (normalized.oxygenLevel < 93) {
    alerts.push({
      type: 'LOW_OXYGEN',
      message: `Low oxygen level detected: ${normalized.oxygenLevel}% SpO2.`,
      severity: normalized.oxygenLevel < 88 ? 'critical' : 'warning',
      createdAt,
      source,
    });
  }
  if (normalized.oxygenLevel < 88) {
    criticalSignals += 1;
  }

  if (normalized.temperature >= 100.4) {
    alerts.push({
      type: 'FEVER_ALERT',
      message: `Fever detected: ${normalized.temperature}°F.`,
      severity: normalized.temperature >= 103 ? 'critical' : 'warning',
      createdAt,
      source,
    });
  }
  if (normalized.temperature >= 103) {
    criticalSignals += 1;
  }

  if (
    normalized.bloodPressureSystolic >= 140 ||
    normalized.bloodPressureDiastolic >= 90
  ) {
    alerts.push({
      type: 'HIGH_BLOOD_PRESSURE',
      message: `High blood pressure detected: ${normalized.bloodPressureSystolic}/${normalized.bloodPressureDiastolic} mmHg.`,
      severity:
        normalized.bloodPressureSystolic >= 160 || normalized.bloodPressureDiastolic >= 100
          ? 'critical'
          : 'warning',
      createdAt,
      source,
    });
  }
  if (
    normalized.bloodPressureSystolic >= 160 ||
    normalized.bloodPressureDiastolic >= 100
  ) {
    criticalSignals += 1;
  }

  if (criticalSignals > 0) {
    alerts.push({
      type: 'EMERGENCY_NOTIFICATION',
      message:
        criticalSignals > 1
          ? 'Multiple critical vitals detected. Please seek emergency medical support immediately.'
          : 'Critical vital detected. Contact emergency support or your doctor immediately.',
      severity: 'critical',
      createdAt,
      source,
    });
  }

  return alerts;
};

export const readLocalAlerts = (userId) => {
  const raw = safeGetLocalStorage(getLocalAlertsKey(userId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeLocalAlerts = (userId, alerts) => {
  const normalized = Array.isArray(alerts) ? alerts.slice(0, MAX_ALERT_HISTORY) : [];
  return safeSetLocalStorage(getLocalAlertsKey(userId), JSON.stringify(normalized));
};

export const appendLocalAlerts = (userId, alerts) => {
  if (!userId || !Array.isArray(alerts) || alerts.length === 0) return [];

  const existing = readLocalAlerts(userId);
  const nowMs = Date.now();
  const inserted = [];

  alerts.forEach((alert) => {
    const incomingCreatedAt = alert.createdAt || safeNowIso();
    const incomingMs = new Date(incomingCreatedAt).getTime() || nowMs;

    const recentlyExists = existing.some((item) => {
      if (item.type !== alert.type || item.message !== alert.message) return false;
      const itemMs = new Date(item.createdAt || 0).getTime();
      return Number.isFinite(itemMs) && Math.abs(incomingMs - itemMs) <= ALERT_DEDUPE_WINDOW_MS;
    });

    if (recentlyExists) return;

    const notification = {
      notificationId: `local-${incomingMs}-${Math.random().toString(36).slice(2, 8)}`,
      type: alert.type || 'HEALTH_ALERT',
      message: alert.message || 'Health alert generated.',
      severity: alert.severity || 'warning',
      source: alert.source || 'LIVE_MONITOR',
      isRead: false,
      createdAt: incomingCreatedAt,
    };

    existing.push(notification);
    inserted.push(notification);
  });

  const sorted = existing
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, MAX_ALERT_HISTORY);
  writeLocalAlerts(userId, sorted);

  return inserted;
};

export const markLocalAlertAsRead = (userId, notificationId) => {
  if (!notificationId) return false;
  const existing = readLocalAlerts(userId);
  let changed = false;

  const updated = existing.map((item) => {
    if (item.notificationId !== notificationId) return item;
    changed = true;
    return { ...item, isRead: true };
  });

  if (!changed) return false;
  return writeLocalAlerts(userId, updated);
};

export const getMetricToneColor = (tone) => {
  if (tone === 'danger') return '#ef4444';
  if (tone === 'warning') return '#f59e0b';
  return '#10b981';
};

export { DEFAULT_VITALS };
