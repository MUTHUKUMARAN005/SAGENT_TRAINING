import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { normalizeVitals } from '../../utils/vitals';

const toDateKey = (value) => {
  const parsed = new Date(value || Date.now());
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const roundOne = (value) => Math.round(value * 10) / 10;

const buildDailySummaries = (records) => {
  const grouped = {};

  (Array.isArray(records) ? records : []).forEach((record) => {
    const key = toDateKey(record.date || record.createdAt);
    if (!key) return;

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        count: 0,
        heartRateTotal: 0,
        oxygenTotal: 0,
        temperatureTotal: 0,
        systolicTotal: 0,
        diastolicTotal: 0,
      };
    }

    const vitals = normalizeVitals(record);
    grouped[key].count += 1;
    grouped[key].heartRateTotal += vitals.heartRate;
    grouped[key].oxygenTotal += vitals.oxygenLevel;
    grouped[key].temperatureTotal += vitals.temperature;
    grouped[key].systolicTotal += vitals.bloodPressureSystolic;
    grouped[key].diastolicTotal += vitals.bloodPressureDiastolic;
  });

  return Object.values(grouped)
    .map((item) => ({
      date: item.date,
      count: item.count,
      avgHeartRate: roundOne(item.heartRateTotal / item.count),
      avgOxygenLevel: roundOne(item.oxygenTotal / item.count),
      avgTemperature: roundOne(item.temperatureTotal / item.count),
      avgSystolic: roundOne(item.systolicTotal / item.count),
      avgDiastolic: roundOne(item.diastolicTotal / item.count),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

const buildChartPoints = (reports, metric, width, height, padding = 18) => {
  const values = reports.map((item) => Number(item?.[metric])).filter((value) => Number.isFinite(value));
  if (values.length < 2) return '';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (values.length - 1);

  return values
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');
};

const getDayStatus = (report) => {
  const issues = [];
  if (report.avgHeartRate > 110 || report.avgHeartRate < 55) issues.push('Heart Rate');
  if (report.avgOxygenLevel < 93) issues.push('Oxygen');
  if (report.avgTemperature >= 100.4) issues.push('Fever');
  if (report.avgSystolic >= 140 || report.avgDiastolic >= 90) issues.push('Blood Pressure');

  if (issues.length === 0) {
    return { label: 'Stable', color: '#10b981' };
  }
  if (issues.length > 1) {
    return { label: `Attention: ${issues.join(', ')}`, color: '#ef4444' };
  }
  return { label: `Watch: ${issues[0]}`, color: '#f59e0b' };
};

const metricOptions = [
  { key: 'avgHeartRate', label: 'Heart Rate Avg' },
  { key: 'avgOxygenLevel', label: 'Oxygen Avg' },
  { key: 'avgTemperature', label: 'Temperature Avg' },
  { key: 'avgSystolic', label: 'Systolic BP Avg' },
];

const DailyHealthReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState('avgHeartRate');

  useEffect(() => {
    const loadReports = async () => {
      if (!user?.userId) {
        setReports([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await API.get(`/health-records/patient/${user.userId}`);
        const daily = buildDailySummaries(res.data);
        setReports(daily);
      } catch (err) {
        console.error(err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [user?.userId]);

  const latest = reports.length ? reports[reports.length - 1] : null;
  const sevenDayReports = useMemo(() => reports.slice(-7), [reports]);

  if (loading) return <LoadingSpinner />;

  const chartWidth = 760;
  const chartHeight = 250;
  const chartPoints = buildChartPoints(sevenDayReports, selectedMetric, chartWidth, chartHeight);

  return (
    <div>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Daily Health Reports</h1>
        <p>Review daily trends and charted summaries from your health records</p>
      </motion.div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No daily reports available</h3>
          <p>Daily summaries will be generated once health records are available</p>
        </div>
      ) : (
        <>
          <motion.div
            className="stats-grid"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Latest Day</span>
                <div className="stat-card-icon">
                  <FiCalendar />
                </div>
              </div>
              <div className="stat-card-value" style={{ fontSize: 24 }}>
                {latest?.date}
              </div>
              <div className="stat-card-change positive">{latest?.count || 0} entries</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Avg Heart Rate</span>
                <div className="stat-card-icon">
                  <FiTrendingUp />
                </div>
              </div>
              <div className="stat-card-value">{latest?.avgHeartRate || '--'}</div>
              <div className="stat-card-change positive">bpm</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Avg Oxygen</span>
                <div className="stat-card-icon">
                  <FiBarChart2 />
                </div>
              </div>
              <div className="stat-card-value">{latest?.avgOxygenLevel || '--'}</div>
              <div className="stat-card-change positive">% SpO2</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Avg Temperature</span>
                <div className="stat-card-icon">
                  <FiTrendingUp />
                </div>
              </div>
              <div className="stat-card-value">{latest?.avgTemperature || '--'}</div>
              <div className="stat-card-change positive">°F</div>
            </div>
          </motion.div>

          <motion.div
            className="data-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="data-card-header">
              <h3>7-Day Trend Chart</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {metricOptions.map((metric) => (
                  <button
                    key={metric.key}
                    type="button"
                    className={`btn btn-sm ${selectedMetric === metric.key ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ width: 'auto', padding: '6px 12px' }}
                    onClick={() => setSelectedMetric(metric.key)}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: 16 }}>
              <div className="chart-shell">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={250}>
                  <line x1="18" y1={chartHeight - 18} x2={chartWidth - 18} y2={chartHeight - 18} stroke="rgba(255,255,255,0.14)" />
                  <line x1="18" y1="18" x2="18" y2={chartHeight - 18} stroke="rgba(255,255,255,0.14)" />
                  {chartPoints && (
                    <polyline
                      points={chartPoints}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="data-card-header">
              <h3>Daily Report History</h3>
            </div>

            <div className="report-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Entries</th>
                    <th>Avg HR</th>
                    <th>Avg BP</th>
                    <th>Avg O2</th>
                    <th>Avg Temp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports
                    .slice()
                    .reverse()
                    .map((report) => {
                      const status = getDayStatus(report);
                      return (
                        <tr key={report.date}>
                          <td>{report.date}</td>
                          <td>{report.count}</td>
                          <td>{report.avgHeartRate} bpm</td>
                          <td>
                            {report.avgSystolic}/{report.avgDiastolic} mmHg
                          </td>
                          <td>{report.avgOxygenLevel}%</td>
                          <td>{report.avgTemperature}°F</td>
                          <td style={{ color: status.color, fontWeight: 600 }}>{status.label}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default DailyHealthReports;
