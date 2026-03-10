import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiAlertTriangle, FiCpu, FiUsers } from 'react-icons/fi';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { normalizeVitals } from '../../utils/vitals';

const CRITICAL_THRESHOLD = {
  heartRateHigh: 120,
  heartRateLow: 45,
  oxygenLow: 92,
  tempHigh: 100.4,
  systolicHigh: 150,
  diastolicHigh: 95,
};

const isCritical = (vitals) => (
  vitals.heartRate > CRITICAL_THRESHOLD.heartRateHigh ||
  vitals.heartRate < CRITICAL_THRESHOLD.heartRateLow ||
  vitals.oxygenLevel < CRITICAL_THRESHOLD.oxygenLow ||
  vitals.temperature >= CRITICAL_THRESHOLD.tempHigh ||
  vitals.bloodPressureSystolic >= CRITICAL_THRESHOLD.systolicHigh ||
  vitals.bloodPressureDiastolic >= CRITICAL_THRESHOLD.diastolicHigh
);

const toTime = (value) => {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const getLatestRecordByPatient = (records) => {
  const map = new Map();
  (Array.isArray(records) ? records : []).forEach((record) => {
    const patientId = record?.patient?.patientId || record?.patientId;
    if (!patientId) return;
    const existing = map.get(patientId);
    if (!existing || toTime(record.createdAt || record.date) >= toTime(existing.createdAt || existing.date)) {
      map.set(patientId, record);
    }
  });
  return map;
};

const SystemDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [criticalPatients, setCriticalPatients] = useState([]);
  const [sensorStatus, setSensorStatus] = useState({ online: 0, offline: 0, unknown: 0 });
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [patientsRes, appointmentsRes, recordsRes] = await Promise.all([
        API.get('/patients'),
        API.get('/appointments'),
        API.get('/health-records'),
      ]);

      const patientList = Array.isArray(patientsRes.data) ? patientsRes.data : [];
      const appointmentList = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];
      const recordList = Array.isArray(recordsRes.data) ? recordsRes.data : [];
      const latestRecords = getLatestRecordByPatient(recordList);
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const critical = [];
      let online = 0;
      let offline = 0;
      let unknown = 0;

      patientList.forEach((patient) => {
        const record = latestRecords.get(patient.patientId);
        if (!record) {
          unknown += 1;
          return;
        }

        const recordTime = toTime(record.createdAt || record.date);
        if (recordTime && now - recordTime <= oneDayMs) online += 1;
        else offline += 1;

        const vitals = normalizeVitals(record);
        if (isCritical(vitals)) {
          critical.push({
            patientId: patient.patientId,
            name: patient.name,
            vitals,
            lastRecordAt: record.createdAt || record.date || null,
          });
        }
      });

      setPatients(patientList);
      setAppointments(appointmentList);
      setCriticalPatients(
        critical.sort((a, b) => toTime(b.lastRecordAt) - toTime(a.lastRecordAt))
      );
      setSensorStatus({ online, offline, unknown });
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 20000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const activePatients = useMemo(() => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const ids = new Set();

    appointments.forEach((appointment) => {
      const patientId = appointment?.patient?.patientId || appointment?.patientId;
      if (!patientId) return;

      const appointmentTime = toTime(appointment.dateTime);
      const isRecent = appointmentTime ? now - appointmentTime <= thirtyDaysMs : false;
      const isScheduled = String(appointment.status || '').toUpperCase() === 'SCHEDULED';
      if (isRecent || isScheduled) ids.add(patientId);
    });

    return ids.size;
  }, [appointments]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>System Dashboard</h1>
        <p>Platform-wide patient activity, risk level, and sensor status</p>
      </motion.div>

      <motion.div className="stats-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Patients</span>
            <div className="stat-card-icon"><FiUsers /></div>
          </div>
          <div className="stat-card-value">{patients.length}</div>
          <div className="stat-card-change positive">Registered</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Active Patients</span>
            <div className="stat-card-icon"><FiActivity /></div>
          </div>
          <div className="stat-card-value">{activePatients}</div>
          <div className="stat-card-change positive">Recent or scheduled activity</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Critical Patients</span>
            <div className="stat-card-icon"><FiAlertTriangle /></div>
          </div>
          <div className="stat-card-value">{criticalPatients.length}</div>
          <div className="stat-card-change negative">Immediate review required</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Sensor Status</span>
            <div className="stat-card-icon"><FiCpu /></div>
          </div>
          <div className="stat-card-value">{sensorStatus.online}</div>
          <div className="stat-card-change positive">
            Online {sensorStatus.online} | Offline {sensorStatus.offline} | Unknown {sensorStatus.unknown}
          </div>
        </div>
      </motion.div>

      <motion.div className="data-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="data-card-header">
          <h3>Critical Patient List</h3>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Updated: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : 'N/A'}
          </div>
        </div>

        {criticalPatients.length === 0 ? (
          <div style={{ padding: 20, color: '#94a3b8' }}>No critical patients detected right now.</div>
        ) : (
          <div className="report-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Heart Rate</th>
                  <th>Blood Pressure</th>
                  <th>SpO2</th>
                  <th>Temperature</th>
                  <th>Last Record</th>
                </tr>
              </thead>
              <tbody>
                {criticalPatients.map((patient) => (
                  <tr key={patient.patientId}>
                    <td>#{patient.patientId} {patient.name || 'Unknown'}</td>
                    <td>{patient.vitals.heartRate} bpm</td>
                    <td>{patient.vitals.bloodPressureSystolic}/{patient.vitals.bloodPressureDiastolic} mmHg</td>
                    <td>{patient.vitals.oxygenLevel}%</td>
                    <td>{patient.vitals.temperature}°F</td>
                    <td>{patient.lastRecordAt ? new Date(patient.lastRecordAt).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SystemDashboard;
