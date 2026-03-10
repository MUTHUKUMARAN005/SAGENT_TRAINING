import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import AnimatedCard from '../components/AnimatedCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FiUsers, FiUserCheck, FiCalendar,
  FiBell, FiTrendingUp, FiActivity, FiFileText
} from 'react-icons/fi';

const toTime = (value) => {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeRecord = (record = {}) => ({
  heartRate: Number(record.heartRate ?? 0),
  bloodPressureSystolic: Number(record.bloodPressureSystolic ?? 0),
  bloodPressureDiastolic: Number(record.bloodPressureDiastolic ?? 0),
  oxygenLevel: Number(record.oxygenLevel ?? 0),
  temperature: Number(record.temperature ?? 0),
});

const isCriticalRecord = (record) => {
  const vitals = normalizeRecord(record);
  return (
    vitals.heartRate > 120 ||
    vitals.heartRate < 45 ||
    vitals.oxygenLevel < 92 ||
    vitals.temperature >= 100.4 ||
    vitals.bloodPressureSystolic >= 150 ||
    vitals.bloodPressureDiastolic >= 95
  );
};

const getLatestRecordByPatient = (records) => {
  const latest = new Map();
  (Array.isArray(records) ? records : []).forEach((record) => {
    const patientId = record?.patient?.patientId || record?.patientId;
    if (!patientId) return;
    const existing = latest.get(patientId);
    if (!existing || toTime(record.createdAt || record.date) >= toTime(existing.createdAt || existing.date)) {
      latest.set(patientId, record);
    }
  });
  return latest;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = (user?.role || '').toUpperCase().replace(/^ROLE_/, '');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    try {
      let apptRes;

      if (role === 'PATIENT') {
        apptRes = await API.get(`/appointments/patient/${user.userId}`);
        const notifRes = await API.get(`/notifications/user/${user.userId}`);

        setStats({
          myAppointments: apptRes.data.length,
          scheduled: apptRes.data.filter((a) => a.status === 'SCHEDULED').length,
          completed: apptRes.data.filter((a) => a.status === 'COMPLETED').length,
          unreadNotifications: notifRes.data.filter((n) => !n.isRead).length,
        });
      } else if (role === 'DOCTOR') {
        apptRes = await API.get(`/appointments/doctor/${user.userId}`);
        const notifRes = await API.get(`/notifications/user/${user.userId}`);
        const uniquePatients = new Set(apptRes.data.map((a) => a.patient?.patientId)).size;

        setStats({
          myPatients: uniquePatients,
          myAppointments: apptRes.data.length,
          scheduled: apptRes.data.filter((a) => a.status === 'SCHEDULED').length,
          unreadNotifications: notifRes.data.filter((n) => !n.isRead).length,
        });
      } else {
        // ADMIN
        const [pRes, dRes, aRes, nRes, rRes] = await Promise.all([
          API.get('/patients'),
          API.get('/doctors'),
          API.get('/appointments'),
          API.get(`/notifications/user/${user.userId}`),
          API.get('/health-records'),
        ]);
        apptRes = aRes;
        const patients = Array.isArray(pRes.data) ? pRes.data : [];
        const appointments = Array.isArray(aRes.data) ? aRes.data : [];
        const records = Array.isArray(rRes.data) ? rRes.data : [];
        const latestByPatient = getLatestRecordByPatient(records);
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const activePatients = new Set();
        appointments.forEach((appointment) => {
          const patientId = appointment?.patient?.patientId || appointment?.patientId;
          if (!patientId) return;
          const time = toTime(appointment.dateTime);
          const isRecent = time ? now - time <= thirtyDaysMs : false;
          const isScheduled = String(appointment.status || '').toUpperCase() === 'SCHEDULED';
          if (isRecent || isScheduled) activePatients.add(patientId);
        });

        let criticalPatients = 0;
        let sensorOnline = 0;
        patients.forEach((patient) => {
          const latest = latestByPatient.get(patient.patientId);
          if (!latest) return;
          if (isCriticalRecord(latest)) criticalPatients += 1;
          if (now - toTime(latest.createdAt || latest.date) <= oneDayMs) sensorOnline += 1;
        });

        setStats({
          totalPatients: patients.length,
          activePatients: activePatients.size,
          criticalPatients,
          sensorOnline,
          totalDoctors: dRes.data.length,
          totalAppointments: appointments.length,
          unreadNotifications: nRes.data.filter((n) => !n.isRead).length,
        });
      }

      setAppointments(apptRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Different stat cards based on role
  const getStatCards = () => {
    if (role === 'PATIENT') {
      return [
        { label: 'My Appointments', value: stats.myAppointments || 0, icon: <FiCalendar />, change: 'Total' },
        { label: 'Scheduled', value: stats.scheduled || 0, icon: <FiActivity />, change: 'Upcoming' },
        { label: 'Completed', value: stats.completed || 0, icon: <FiFileText />, change: 'Done' },
        { label: 'Notifications', value: stats.unreadNotifications || 0, icon: <FiBell />, change: 'Unread' },
      ];
    }
    if (role === 'DOCTOR') {
      return [
        { label: 'My Patients', value: stats.myPatients || 0, icon: <FiUsers />, change: 'Assigned' },
        { label: 'Appointments', value: stats.myAppointments || 0, icon: <FiCalendar />, change: 'Total' },
        { label: 'Scheduled', value: stats.scheduled || 0, icon: <FiActivity />, change: 'Upcoming' },
        { label: 'Notifications', value: stats.unreadNotifications || 0, icon: <FiBell />, change: 'Unread' },
      ];
    }
    // ADMIN
    return [
      { label: 'Total Patients', value: stats.totalPatients || 0, icon: <FiUsers />, change: 'Registered' },
      { label: 'Active Patients', value: stats.activePatients || 0, icon: <FiUserCheck />, change: 'Recent/Scheduled' },
      { label: 'Critical Patients', value: stats.criticalPatients || 0, icon: <FiActivity />, change: 'Needs Review' },
      { label: 'Sensor Online', value: stats.sensorOnline || 0, icon: <FiBell />, change: 'Last 24h' },
    ];
  };

  return (
    <div>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Welcome back, {user?.name} 👋</h1>
        <p>
          {role === 'PATIENT' && 'Here is your health overview'}
          {role === 'DOCTOR' && 'Here are your patients and appointments'}
          {role === 'ADMIN' && 'System overview and management'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="stats-grid">
        {getStatCards().map((stat, index) => (
          <AnimatedCard key={stat.label} delay={index * 0.1} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">{stat.label}</span>
              <div className="stat-card-icon">{stat.icon}</div>
            </div>
            <motion.div
              className="stat-card-value"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
            >
              {stat.value}
            </motion.div>
            <div className="stat-card-change positive">
              <FiTrendingUp /> {stat.change}
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Recent Appointments */}
      <motion.div
        className="data-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="data-card-header">
          <h3>📅 {role === 'ADMIN' ? 'Recent' : 'My'} Appointments</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              {role !== 'PATIENT' && <th>Patient</th>}
              {role !== 'DOCTOR' && <th>Doctor</th>}
              <th>Date & Time</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt, index) => (
              <motion.tr
                key={appt.appointmentId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.08 }}
              >
                <td>#{appt.appointmentId}</td>
                {role !== 'PATIENT' && <td>{appt.patient?.name || 'N/A'}</td>}
                {role !== 'DOCTOR' && <td>{appt.doctor?.name || 'N/A'}</td>}
                <td>{new Date(appt.dateTime).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-${appt.status?.toLowerCase()}`}>
                    {appt.status}
                  </span>
                </td>
                <td>{appt.reason?.substring(0, 40)}...</td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {appointments.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>No appointments</h3>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
