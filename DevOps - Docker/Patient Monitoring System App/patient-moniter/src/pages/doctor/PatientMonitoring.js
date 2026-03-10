import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiAlertTriangle, FiHeart, FiThermometer, FiUsers, FiWind } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import {
  appendLocalAlerts,
  buildVitalAlerts,
  getMetricToneColor,
  getVitalStatus,
  normalizeVitals,
  readLocalAlerts,
} from '../../utils/vitals';

const toLower = (value) => String(value || '').toLowerCase();

const getLatestRecordMap = (records) => {
  const latestByPatient = new Map();
  (Array.isArray(records) ? records : []).forEach((record) => {
    const patientId = record?.patient?.patientId || record?.patientId;
    if (!patientId) return;

    const existing = latestByPatient.get(patientId);
    const existingTime = new Date(existing?.createdAt || existing?.date || 0).getTime() || 0;
    const nextTime = new Date(record?.createdAt || record?.date || 0).getTime() || 0;
    if (!existing || nextTime >= existingTime) {
      latestByPatient.set(patientId, record);
    }
  });
  return latestByPatient;
};

const isCriticalVitals = (vitals) => {
  if (vitals.heartRate >= 130 || vitals.heartRate < 45) return true;
  if (vitals.oxygenLevel < 90) return true;
  if (vitals.temperature >= 102.5) return true;
  if (vitals.bloodPressureSystolic >= 160 || vitals.bloodPressureDiastolic >= 100) return true;
  return false;
};

const PatientMonitoring = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [criticalAlertCount, setCriticalAlertCount] = useState(0);

  const refreshMonitoring = useCallback(async () => {
    if (!user?.userId) {
      setPatients([]);
      setLoading(false);
      return;
    }

    try {
      const [appointmentsRes, recordsRes] = await Promise.all([
        API.get(`/appointments/doctor/${user.userId}`),
        API.get('/health-records'),
      ]);

      const appointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];
      const records = Array.isArray(recordsRes.data) ? recordsRes.data : [];
      const latestRecordMap = getLatestRecordMap(records);
      const patientMap = new Map();

      appointments.forEach((appt) => {
        const patient = appt?.patient;
        if (!patient?.patientId) return;

        const latestRecord = latestRecordMap.get(patient.patientId) || {};
        const vitals = normalizeVitals(latestRecord);
        const status = isCriticalVitals(vitals) ? 'CRITICAL' : 'NORMAL';

        if (!patientMap.has(patient.patientId)) {
          patientMap.set(patient.patientId, {
            patientId: patient.patientId,
            name: patient.name || `Patient ${patient.patientId}`,
            dateOfBirth: patient.dateOfBirth || '',
            contactNumber: patient.contactNumber || '',
            emergencyContact: patient.emergencyContact || '',
            latestAppointmentAt: appt.dateTime || null,
            vitals,
            status,
            lastRecordAt: latestRecord.createdAt || latestRecord.date || null,
          });
        } else {
          const existing = patientMap.get(patient.patientId);
          const existingTime = new Date(existing.latestAppointmentAt || 0).getTime() || 0;
          const nextTime = new Date(appt.dateTime || 0).getTime() || 0;
          if (nextTime > existingTime) {
            patientMap.set(patient.patientId, {
              ...existing,
              latestAppointmentAt: appt.dateTime || existing.latestAppointmentAt,
            });
          }
        }
      });

      const monitoringPatients = Array.from(patientMap.values()).sort((a, b) =>
        a.status === b.status ? toLower(a.name).localeCompare(toLower(b.name)) : a.status === 'CRITICAL' ? -1 : 1
      );

      const generatedAlerts = [];
      monitoringPatients.forEach((patient) => {
        if (patient.status !== 'CRITICAL') return;
        generatedAlerts.push({
          type: 'CRITICAL_CONDITION_ALERT',
          message: `Critical condition alert for ${patient.name}: HR ${patient.vitals.heartRate} bpm, SpO2 ${patient.vitals.oxygenLevel}%, Temp ${patient.vitals.temperature}°F, BP ${patient.vitals.bloodPressureSystolic}/${patient.vitals.bloodPressureDiastolic}.`,
          severity: 'critical',
          createdAt: new Date().toISOString(),
          source: 'DOCTOR_MONITOR',
        });

        const emergencySignals = buildVitalAlerts(patient.vitals, 'DOCTOR_MONITOR')
          .filter((alert) => alert.type === 'EMERGENCY_NOTIFICATION')
          .map((alert) => ({
            ...alert,
            message: `${patient.name}: ${alert.message}`,
          }));
        generatedAlerts.push(...emergencySignals);
      });

      const insertedAlerts = appendLocalAlerts(user.userId, generatedAlerts);
      if (insertedAlerts.length > 0) {
        insertedAlerts.slice(0, 3).forEach((alert) => toast.error(alert.message));
      }

      const unreadCriticalAlerts = readLocalAlerts(user.userId).filter(
        (item) =>
          !item.isRead &&
          (String(item.type || '').includes('CRITICAL') || String(item.type || '').includes('EMERGENCY'))
      );

      setCriticalAlertCount(unreadCriticalAlerts.length);
      setPatients(monitoringPatients);
      setLastSyncAt(new Date().toISOString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    let ignore = false;

    const initialLoad = async () => {
      if (!ignore) setLoading(true);
      await refreshMonitoring();
    };

    initialLoad();
    const intervalId = setInterval(refreshMonitoring, 15000);
    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, [refreshMonitoring]);

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) =>
        toLower(patient.name).includes(toLower(search))
      ),
    [patients, search]
  );

  if (loading) return <LoadingSpinner />;

  const criticalCount = patients.filter((patient) => patient.status === 'CRITICAL').length;
  const normalCount = patients.length - criticalCount;

  return (
    <div>
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Patient Monitoring Dashboard</h1>
        <p>Real-time patient status, vitals monitoring, and emergency alerts</p>
      </motion.div>

      <motion.div className="stats-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">All Patients</span>
            <div className="stat-card-icon"><FiUsers /></div>
          </div>
          <div className="stat-card-value">{patients.length}</div>
          <div className="stat-card-change positive">Assigned to doctor</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Normal</span>
            <div className="stat-card-icon"><FiHeart /></div>
          </div>
          <div className="stat-card-value">{normalCount}</div>
          <div className="stat-card-change positive">Stable status</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Critical</span>
            <div className="stat-card-icon"><FiAlertTriangle /></div>
          </div>
          <div className="stat-card-value">{criticalCount}</div>
          <div className="stat-card-change negative">Needs attention</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Emergency Alerts</span>
            <div className="stat-card-icon"><FiActivity /></div>
          </div>
          <div className="stat-card-value">{criticalAlertCount}</div>
          <div className="stat-card-change negative">Unread notifications</div>
        </div>
      </motion.div>

      <motion.div style={{ marginBottom: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="form-input-icon" style={{ maxWidth: 420 }}>
          <FiUsers className="icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search patient by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 12 }}>
          Last sync: {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'Not synced'}
        </div>
      </motion.div>

      {filteredPatients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🩺</div>
          <h3>No monitored patients found</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filteredPatients.map((patient, index) => {
            const hrStatus = getVitalStatus('heartRate', patient.vitals.heartRate);
            const o2Status = getVitalStatus('oxygenLevel', patient.vitals.oxygenLevel);
            const tempStatus = getVitalStatus('temperature', patient.vitals.temperature);
            const bpStatus = getVitalStatus(
              'bloodPressure',
              patient.vitals.bloodPressureSystolic,
              patient.vitals.bloodPressureDiastolic
            );
            const statusColor = patient.status === 'CRITICAL' ? '#ef4444' : '#10b981';

            return (
              <motion.div
                key={patient.patientId}
                className="data-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700 }}>{patient.name}</h3>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        DOB: {patient.dateOfBirth || 'N/A'} | Contact: {patient.contactNumber || 'N/A'}
                      </div>
                    </div>
                    <span className="badge" style={{ background: `${statusColor}22`, color: statusColor }}>
                      {patient.status}
                    </span>
                  </div>

                  <div className="vitals-grid">
                    <div className="vital-card">
                      <div className="vital-card-top">
                        <span className="vital-icon"><FiHeart /></span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Heart Rate</span>
                      </div>
                      <div className="vital-value" style={{ color: getMetricToneColor(hrStatus.tone), fontSize: 30 }}>
                        {patient.vitals.heartRate}
                      </div>
                      <div className="vital-meta">bpm | {hrStatus.label}</div>
                    </div>

                    <div className="vital-card">
                      <div className="vital-card-top">
                        <span className="vital-icon"><FiWind /></span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Oxygen</span>
                      </div>
                      <div className="vital-value" style={{ color: getMetricToneColor(o2Status.tone), fontSize: 30 }}>
                        {patient.vitals.oxygenLevel}
                      </div>
                      <div className="vital-meta">% SpO2 | {o2Status.label}</div>
                    </div>

                    <div className="vital-card">
                      <div className="vital-card-top">
                        <span className="vital-icon"><FiThermometer /></span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Temperature</span>
                      </div>
                      <div className="vital-value" style={{ color: getMetricToneColor(tempStatus.tone), fontSize: 30 }}>
                        {patient.vitals.temperature}
                      </div>
                      <div className="vital-meta">deg F | {tempStatus.label}</div>
                    </div>

                    <div className="vital-card">
                      <div className="vital-card-top">
                        <span className="vital-icon"><FiActivity /></span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Blood Pressure</span>
                      </div>
                      <div className="vital-value" style={{ color: getMetricToneColor(bpStatus.tone), fontSize: 30 }}>
                        {patient.vitals.bloodPressureSystolic}/{patient.vitals.bloodPressureDiastolic}
                      </div>
                      <div className="vital-meta">mmHg | {bpStatus.label}</div>
                    </div>
                  </div>

                  {patient.status === 'CRITICAL' && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 10,
                        borderRadius: 10,
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#fca5a5',
                        fontSize: 12,
                      }}
                    >
                      Critical condition alert active for this patient. Open Notifications for emergency updates.
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientMonitoring;
