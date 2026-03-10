import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiActivity,
  FiAlertTriangle,
  FiHeart,
  FiThermometer,
  FiWind,
  FiWifi,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  DEFAULT_VITALS,
  appendLocalAlerts,
  buildVitalAlerts,
  getMetricToneColor,
  getVitalStatus,
  normalizeVitals,
  readLocalAlerts,
  simulateVitals,
} from '../../utils/vitals';
import { useAuth } from '../../context/AuthContext';

const sortByNewest = (items) =>
  (Array.isArray(items) ? items : [])
    .slice()
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

const buildChartPoints = (records, metric, width, height, padding = 18) => {
  const series = records
    .map((record) => Number(record?.[metric]))
    .filter((value) => Number.isFinite(value));

  if (series.length < 2) return '';

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (series.length - 1);

  return series
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');
};

const metricConfig = {
  heartRate: { label: 'Heart Rate', unit: 'bpm', icon: <FiHeart /> },
  oxygenLevel: { label: 'Oxygen Level', unit: '% SpO2', icon: <FiWind /> },
  temperature: { label: 'Temperature', unit: '°F', icon: <FiThermometer /> },
  bloodPressureSystolic: { label: 'Systolic BP', unit: 'mmHg', icon: <FiActivity /> },
};

const LiveHealthMonitor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState(DEFAULT_VITALS);
  const [history, setHistory] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('heartRate');
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await API.get(`/health-records/patient/${user.userId}`);
        const records = sortByNewest(res.data);
        const latestRecord = records[0] || DEFAULT_VITALS;
        const nextVitals = normalizeVitals(latestRecord);
        const seedHistory = records
          .slice(0, 20)
          .reverse()
          .map((record) => ({
            ...normalizeVitals(record),
            createdAt: record.createdAt || record.date || new Date().toISOString(),
          }));
        const liveAlerts = readLocalAlerts(user.userId).filter((item) => !item.isRead).slice(0, 5);

        setVitals(nextVitals);
        setHistory(
          seedHistory.length
            ? seedHistory
            : [{ ...nextVitals, createdAt: new Date().toISOString() }]
        );
        setRecentAlerts(liveAlerts);
        setLastUpdatedAt(new Date().toISOString());
      } catch (err) {
        console.error(err);
        const fallback = normalizeVitals(DEFAULT_VITALS);
        setVitals(fallback);
        setHistory([{ ...fallback, createdAt: new Date().toISOString() }]);
        setLastUpdatedAt(new Date().toISOString());
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [user?.userId]);

  useEffect(() => {
    if (loading || !user?.userId) return undefined;

    const intervalId = setInterval(() => {
      setVitals((previous) => {
        const next = simulateVitals(previous);
        const createdAt = new Date().toISOString();
        const alerts = buildVitalAlerts(next, 'LIVE_MONITOR');
        const insertedAlerts = appendLocalAlerts(user.userId, alerts);

        setHistory((prev) => [...prev, { ...next, createdAt }].slice(-30));
        setLastUpdatedAt(createdAt);

        if (insertedAlerts.length > 0) {
          const latestLocalAlerts = readLocalAlerts(user.userId)
            .filter((item) => !item.isRead)
            .slice(0, 5);
          setRecentAlerts(latestLocalAlerts);

          insertedAlerts.forEach((alert) => {
            if (alert.severity === 'critical') {
              toast.error(alert.message);
              return;
            }
            toast.warn(alert.message);
          });
        }

        return next;
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [loading, user?.userId]);

  const statuses = useMemo(
    () => ({
      heartRate: getVitalStatus('heartRate', vitals.heartRate),
      oxygenLevel: getVitalStatus('oxygenLevel', vitals.oxygenLevel),
      temperature: getVitalStatus('temperature', vitals.temperature),
      bloodPressure: getVitalStatus(
        'bloodPressure',
        vitals.bloodPressureSystolic,
        vitals.bloodPressureDiastolic
      ),
    }),
    [vitals]
  );

  const emergencyAlert = recentAlerts.find(
    (item) => item.type === 'EMERGENCY_NOTIFICATION' && !item.isRead
  );

  if (loading) return <LoadingSpinner />;

  const chartWidth = 760;
  const chartHeight = 260;
  const linePoints = buildChartPoints(history, selectedMetric, chartWidth, chartHeight);

  return (
    <div>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Live Health Monitor</h1>
        <p>Real-time patient vitals with automatic threshold alerts</p>
      </motion.div>

      <motion.div
        className="data-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className="data-card-header"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
        >
          <h3>
            <FiWifi style={{ marginRight: 8 }} />
            Monitoring Stream
          </h3>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>
            Updated: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : 'Waiting...'}
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div className="vitals-grid">
            <motion.div className="vital-card" whileHover={{ y: -3 }}>
              <div className="vital-card-top">
                <span className="vital-icon">{metricConfig.heartRate.icon}</span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{metricConfig.heartRate.label}</span>
              </div>
              <div
                className="vital-value"
                style={{ color: getMetricToneColor(statuses.heartRate.tone) }}
              >
                {vitals.heartRate}
              </div>
              <div className="vital-meta">
                {metricConfig.heartRate.unit} | {statuses.heartRate.label}
              </div>
            </motion.div>

            <motion.div className="vital-card" whileHover={{ y: -3 }}>
              <div className="vital-card-top">
                <span className="vital-icon">{metricConfig.temperature.icon}</span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{metricConfig.temperature.label}</span>
              </div>
              <div
                className="vital-value"
                style={{ color: getMetricToneColor(statuses.temperature.tone) }}
              >
                {vitals.temperature}
              </div>
              <div className="vital-meta">
                {metricConfig.temperature.unit} | {statuses.temperature.label}
              </div>
            </motion.div>

            <motion.div className="vital-card" whileHover={{ y: -3 }}>
              <div className="vital-card-top">
                <span className="vital-icon">{metricConfig.oxygenLevel.icon}</span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{metricConfig.oxygenLevel.label}</span>
              </div>
              <div
                className="vital-value"
                style={{ color: getMetricToneColor(statuses.oxygenLevel.tone) }}
              >
                {vitals.oxygenLevel}
              </div>
              <div className="vital-meta">
                {metricConfig.oxygenLevel.unit} | {statuses.oxygenLevel.label}
              </div>
            </motion.div>

            <motion.div className="vital-card" whileHover={{ y: -3 }}>
              <div className="vital-card-top">
                <span className="vital-icon">{metricConfig.bloodPressureSystolic.icon}</span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Blood Pressure</span>
              </div>
              <div
                className="vital-value"
                style={{ color: getMetricToneColor(statuses.bloodPressure.tone), fontSize: 34 }}
              >
                {vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic}
              </div>
              <div className="vital-meta">
                mmHg | {statuses.bloodPressure.label}
              </div>
            </motion.div>
          </div>

          {emergencyAlert && (
            <motion.div
              style={{
                marginTop: 18,
                border: '1px solid rgba(239,68,68,0.45)',
                background: 'rgba(239,68,68,0.12)',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <FiAlertTriangle style={{ color: '#ef4444', fontSize: 20 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#fecaca' }}>Emergency Notification</div>
                <div style={{ fontSize: 13, color: '#fca5a5' }}>{emergencyAlert.message}</div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        className="data-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <div className="data-card-header">
          <h3>Vitals Trend (Last {history.length} Samples)</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(metricConfig).map(([metric, meta]) => (
              <button
                key={metric}
                type="button"
                className={`btn btn-sm ${selectedMetric === metric ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedMetric(metric)}
                style={{ width: 'auto', padding: '6px 12px' }}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <div className="chart-shell">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={260}>
              <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="transparent" />
              <line x1="18" y1={chartHeight - 18} x2={chartWidth - 18} y2={chartHeight - 18} stroke="rgba(255,255,255,0.15)" />
              <line x1="18" y1="18" x2="18" y2={chartHeight - 18} stroke="rgba(255,255,255,0.15)" />
              {linePoints && (
                <polyline
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="3"
                  points={linePoints}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="data-card"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <div className="data-card-header">
          <h3>Recent Health Alerts</h3>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            style={{ width: 'auto' }}
            onClick={() => navigate('/notifications')}
          >
            Open Notifications
          </button>
        </div>

        {recentAlerts.length === 0 ? (
          <div style={{ padding: 20, color: '#94a3b8' }}>
            No active alerts. Monitoring is running normally.
          </div>
        ) : (
          recentAlerts.map((alert) => (
            <div
              key={alert.notificationId}
              style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {(alert.type || '').replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{alert.message}</div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: alert.severity === 'critical' ? '#ef4444' : '#f59e0b',
                }}
              >
                {new Date(alert.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default LiveHealthMonitor;
