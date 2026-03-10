import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiDownload, FiHeart, FiThermometer, FiWind } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { downloadReportPdf } from '../../utils/pdfReport';
import { normalizeVitals } from '../../utils/vitals';

const sortByDateAscending = (records) =>
  (Array.isArray(records) ? records : [])
    .slice()
    .sort((a, b) => new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0));

const normalizeId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : String(value);
};

const getPatientIdFromPayload = (payload) => (
  normalizeId(
    payload?.patientId ??
    payload?.id ??
    payload?.userId ??
    payload?.patient?.patientId ??
    payload?.patient?.id
  )
);

const toFiniteNumbers = (series) =>
  (Array.isArray(series) ? series : [])
    .filter((value) => Number.isFinite(Number(value)))
    .map(Number);

const buildChartScale = (series) => {
  const values = toFiniteNumbers(series);
  if (!values.length) return null;

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    const padding = Math.max(Math.abs(minValue) * 0.04, 2);
    return { min: minValue - padding, max: maxValue + padding };
  }

  const padding = Math.max((maxValue - minValue) * 0.12, 1);
  return { min: minValue - padding, max: maxValue + padding };
};

const buildChartCoordinates = (series, width, height, scale, padding = 44) => {
  const values = series.filter((value) => Number.isFinite(Number(value))).map(Number);
  if (!values.length) return [];

  const min = scale?.min ?? Math.min(...values);
  const max = scale?.max ?? Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = values.length > 1 ? padding + index * stepX : width / 2;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return { x, y, value };
    });
};

const formatAxisValue = (value, unit) => {
  if (!Number.isFinite(value)) return '--';
  return `${Math.round(value * 10) / 10}${unit}`;
};

const avg = (values) => {
  const nums = (Array.isArray(values) ? values : []).filter((value) => Number.isFinite(Number(value))).map(Number);
  if (!nums.length) return null;
  return Math.round((nums.reduce((sum, value) => sum + value, 0) / nums.length) * 10) / 10;
};

const formatRecordTime = (record) => record?.date || record?.createdAt || '';

const resolvePatientId = async (user) => {
  if (user?.userId !== null && user?.userId !== undefined && user?.userId !== '') {
    return normalizeId(user.userId);
  }

  try {
    const meRes = await API.get('/patients/me');
    const meId = getPatientIdFromPayload(meRes.data);
    if (meId !== null) return meId;
  } catch {
    // Continue to fallback lookups.
  }

  if (user?.userId !== null && user?.userId !== undefined && user?.userId !== '') {
    try {
      const byUserRes = await API.get(`/patients/user/${user.userId}`);
      const byUserId = getPatientIdFromPayload(byUserRes.data);
      if (byUserId !== null) return byUserId;
    } catch {
      // Continue to final fallback.
    }
  }

  if (user?.email) {
    try {
      const listRes = await API.get('/patients');
      const email = String(user.email).trim().toLowerCase();
      const patient = (Array.isArray(listRes.data) ? listRes.data : []).find(
        (item) => String(item?.email || '').toLowerCase() === email
      );
      const foundId = getPatientIdFromPayload(patient);
      if (foundId !== null) return foundId;
    } catch {
      // Ignore and return null below.
    }
  }

  return null;
};

const HealthCharts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setRecords([]);
        setHistory([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const patientId = await resolvePatientId(user);
        if (patientId === null) {
          setRecords([]);
          setHistory([]);
          setLoading(false);
          return;
        }

        const [recordsRes, historyRes] = await Promise.all([
          API.get(`/health-records/patient/${patientId}`),
          API.get(`/medical-history/patient/${patientId}`),
        ]);

        setRecords(sortByDateAscending(recordsRes.data));
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const normalizedRecords = useMemo(
    () => records.map((record) => ({ ...record, ...normalizeVitals(record) })),
    [records]
  );

  const heartRateSeries = normalizedRecords.map((record) => record.heartRate);
  const temperatureSeries = normalizedRecords.map((record) => record.temperature);
  const oxygenSeries = normalizedRecords.map((record) => record.oxygenLevel);
  const latestRecord = normalizedRecords[normalizedRecords.length - 1];

  const generateHealthReportPdf = () => {
    if (!normalizedRecords.length) {
      toast.error('No health records available for report generation');
      return;
    }

    const recentRecords = normalizedRecords.slice(-12).reverse();
    downloadReportPdf({
      filename: `health-report-${user?.userId || 'patient'}.pdf`,
      title: `Health Report - ${user?.name || 'Patient'}`,
      sections: [
        {
          heading: 'Patient Summary',
          lines: [
            `Name: ${user?.name || 'N/A'}`,
            `Email: ${user?.email || 'N/A'}`,
            `Total Records: ${normalizedRecords.length}`,
            `Latest Reading: ${formatRecordTime(latestRecord) || 'N/A'}`,
          ],
        },
        {
          heading: 'Vitals Averages',
          lines: [
            `Average Heart Rate: ${avg(heartRateSeries) ?? 'N/A'} bpm`,
            `Average Temperature: ${avg(temperatureSeries) ?? 'N/A'} deg F`,
            `Average Oxygen Level: ${avg(oxygenSeries) ?? 'N/A'} % SpO2`,
            `Average Systolic BP: ${avg(normalizedRecords.map((record) => record.bloodPressureSystolic)) ?? 'N/A'} mmHg`,
            `Average Diastolic BP: ${avg(normalizedRecords.map((record) => record.bloodPressureDiastolic)) ?? 'N/A'} mmHg`,
          ],
        },
        {
          heading: 'Recent Health Readings',
          lines: recentRecords.map((record) =>
            `${formatRecordTime(record)} | HR ${record.heartRate} bpm | Temp ${record.temperature} deg F | O2 ${record.oxygenLevel}% | BP ${record.bloodPressureSystolic}/${record.bloodPressureDiastolic}`
          ),
        },
      ],
    });
    toast.success('Health report PDF generated');
  };

  const generatePatientHistoryPdf = () => {
    downloadReportPdf({
      filename: `patient-history-${user?.userId || 'patient'}.pdf`,
      title: `Patient History Report - ${user?.name || 'Patient'}`,
      sections: [
        {
          heading: 'Patient Summary',
          lines: [
            `Name: ${user?.name || 'N/A'}`,
            `Email: ${user?.email || 'N/A'}`,
            `Medical History Entries: ${history.length}`,
            `Health Record Entries: ${normalizedRecords.length}`,
          ],
        },
        {
          heading: 'Medical History',
          lines:
            history.length === 0
              ? ['No medical history entries available']
              : history.map(
                  (item) =>
                    `${item.condition || 'Condition'} | Diagnosed: ${item.diagnosisDate || 'N/A'} | ${item.details || 'No details'}`
                ),
        },
        {
          heading: 'Latest Health Snapshot',
          lines: latestRecord
            ? [
                `Date: ${formatRecordTime(latestRecord) || 'N/A'}`,
                `Heart Rate: ${latestRecord.heartRate} bpm`,
                `Temperature: ${latestRecord.temperature} deg F`,
                `Oxygen Level: ${latestRecord.oxygenLevel} % SpO2`,
                `Blood Pressure: ${latestRecord.bloodPressureSystolic}/${latestRecord.bloodPressureDiastolic} mmHg`,
              ]
            : ['No health records available'],
        },
      ],
    });
    toast.success('Patient history report PDF generated');
  };

  if (loading) return <LoadingSpinner />;

  const chartWidth = 760;
  const chartHeight = 220;
  const chartPadding = 44;
  const heartScale = buildChartScale(heartRateSeries);
  const temperatureScale = buildChartScale(temperatureSeries);
  const oxygenScale = buildChartScale(oxygenSeries);
  const heartCoords = buildChartCoordinates(heartRateSeries, chartWidth, chartHeight, heartScale, chartPadding);
  const temperatureCoords = buildChartCoordinates(temperatureSeries, chartWidth, chartHeight, temperatureScale, chartPadding);
  const oxygenCoords = buildChartCoordinates(oxygenSeries, chartWidth, chartHeight, oxygenScale, chartPadding);
  const toPoints = (coords) => coords.map((point) => `${point.x},${point.y}`).join(' ');
  const gridLineStops = [0, 0.25, 0.5, 0.75, 1];

  const renderChartGrid = (scale, unit) => {
    if (!scale) return null;

    return gridLineStops.map((stop) => {
      const y = chartPadding + stop * (chartHeight - chartPadding * 2);
      const value = scale.max - stop * (scale.max - scale.min);
      return (
        <g key={`grid-${unit}-${stop}`}>
          <line
            x1={chartPadding}
            y1={y}
            x2={chartWidth - chartPadding}
            y2={y}
            stroke="rgba(148, 163, 184, 0.32)"
            strokeDasharray={stop === 1 ? undefined : '4 6'}
          />
          <text
            x={chartPadding - 8}
            y={y + 4}
            textAnchor="end"
            fontSize="11"
            fill="rgba(226, 232, 240, 0.88)"
          >
            {formatAxisValue(value, unit)}
          </text>
        </g>
      );
    });
  };

  return (
    <div>
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Health Charts</h1>
        <p>Heart rate, temperature, and oxygen trend graphs with report generation</p>
      </motion.div>

      <motion.div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={generateHealthReportPdf}>
          <FiDownload /> Health Report PDF
        </button>
        <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={generatePatientHistoryPdf}>
          <FiDownload /> Patient History Report
        </button>
      </motion.div>

      <motion.div className="data-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div className="data-card-header">
          <h3><FiHeart style={{ marginRight: 8 }} /> Heart Rate Graph</h3>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Avg: {avg(heartRateSeries) ?? 'N/A'} bpm
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <div className="chart-shell">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={220} preserveAspectRatio="none">
              {renderChartGrid(heartScale, ' bpm')}
              <line x1={chartPadding} y1={chartPadding} x2={chartPadding} y2={chartHeight - chartPadding} stroke="rgba(148, 163, 184, 0.45)" />
              {heartCoords.length > 1 && (
                <polyline
                  points={toPoints(heartCoords)}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {heartCoords.map((point, index) => (
                <g key={`heart-${index}`}>
                  <circle cx={point.x} cy={point.y} r={heartCoords.length === 1 ? 6 : 3.2} fill="#ef4444" />
                  {heartCoords.length === 1 && (
                    <>
                      <circle cx={point.x} cy={point.y} r="10" fill="none" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="2" />
                      <text x={point.x + 12} y={point.y - 10} fontSize="12" fill="#fca5a5">
                        {`${point.value} bpm`}
                      </text>
                    </>
                  )}
                </g>
              ))}
              {heartCoords.length === 0 && (
                <text x={chartWidth / 2} y={chartHeight / 2} textAnchor="middle" className="chart-empty-text">
                  No heart rate records yet
                </text>
              )}
            </svg>
          </div>
        </div>
      </motion.div>

      <motion.div className="data-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="data-card-header">
          <h3><FiThermometer style={{ marginRight: 8 }} /> Temperature Graph</h3>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Avg: {avg(temperatureSeries) ?? 'N/A'} deg F
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <div className="chart-shell">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={220} preserveAspectRatio="none">
              {renderChartGrid(temperatureScale, ' F')}
              <line x1={chartPadding} y1={chartPadding} x2={chartPadding} y2={chartHeight - chartPadding} stroke="rgba(148, 163, 184, 0.45)" />
              {temperatureCoords.length > 1 && (
                <polyline
                  points={toPoints(temperatureCoords)}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {temperatureCoords.map((point, index) => (
                <g key={`temp-${index}`}>
                  <circle cx={point.x} cy={point.y} r={temperatureCoords.length === 1 ? 6 : 3.2} fill="#f59e0b" />
                  {temperatureCoords.length === 1 && (
                    <>
                      <circle cx={point.x} cy={point.y} r="10" fill="none" stroke="rgba(245, 158, 11, 0.45)" strokeWidth="2" />
                      <text x={point.x + 12} y={point.y - 10} fontSize="12" fill="#fdba74">
                        {`${point.value} F`}
                      </text>
                    </>
                  )}
                </g>
              ))}
              {temperatureCoords.length === 0 && (
                <text x={chartWidth / 2} y={chartHeight / 2} textAnchor="middle" className="chart-empty-text">
                  No temperature records yet
                </text>
              )}
            </svg>
          </div>
        </div>
      </motion.div>

      <motion.div className="data-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <div className="data-card-header">
          <h3><FiWind style={{ marginRight: 8 }} /> Oxygen Level Graph</h3>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Avg: {avg(oxygenSeries) ?? 'N/A'} % SpO2
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <div className="chart-shell">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={220} preserveAspectRatio="none">
              {renderChartGrid(oxygenScale, '%')}
              <line x1={chartPadding} y1={chartPadding} x2={chartPadding} y2={chartHeight - chartPadding} stroke="rgba(148, 163, 184, 0.45)" />
              {oxygenCoords.length > 1 && (
                <polyline
                  points={toPoints(oxygenCoords)}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {oxygenCoords.map((point, index) => (
                <g key={`oxygen-${index}`}>
                  <circle cx={point.x} cy={point.y} r={oxygenCoords.length === 1 ? 6 : 3.2} fill="#06b6d4" />
                  {oxygenCoords.length === 1 && (
                    <>
                      <circle cx={point.x} cy={point.y} r="10" fill="none" stroke="rgba(6, 182, 212, 0.45)" strokeWidth="2" />
                      <text x={point.x + 12} y={point.y - 10} fontSize="12" fill="#67e8f9">
                        {`${point.value}%`}
                      </text>
                    </>
                  )}
                </g>
              ))}
              {oxygenCoords.length === 0 && (
                <text x={chartWidth / 2} y={chartHeight / 2} textAnchor="middle" className="chart-empty-text">
                  No oxygen records yet
                </text>
              )}
            </svg>
          </div>
        </div>
      </motion.div>

      {normalizedRecords.length === 0 && (
        <motion.div className="data-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ padding: 20, color: '#94a3b8' }}>
            No health records available yet. Graphs and PDF reports will populate when vitals data is recorded.
          </div>
        </motion.div>
      )}

      <motion.div className="data-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="data-card-header">
          <h3><FiActivity style={{ marginRight: 8 }} /> Latest Snapshot</h3>
        </div>
        <div style={{ padding: 20, display: 'grid', gap: 6 }}>
          {latestRecord ? (
            <>
              <div>Date: {formatRecordTime(latestRecord) || 'N/A'}</div>
              <div>Heart Rate: {latestRecord.heartRate} bpm</div>
              <div>Temperature: {latestRecord.temperature} deg F</div>
              <div>Oxygen Level: {latestRecord.oxygenLevel}% SpO2</div>
              <div>Blood Pressure: {latestRecord.bloodPressureSystolic}/{latestRecord.bloodPressureDiastolic} mmHg</div>
            </>
          ) : (
            <div style={{ color: '#94a3b8' }}>No records available</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default HealthCharts;
