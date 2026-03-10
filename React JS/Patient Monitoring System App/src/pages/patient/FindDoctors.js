import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/axios';
import AnimatedCard from '../../components/AnimatedCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiUserCheck, FiAward, FiSearch, FiMessageSquare, FiCalendar, FiClock, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

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

const resolvePatientId = async (user) => {
  const directId = normalizeId(user?.userId);
  if (directId !== null) return directId;

  try {
    const meRes = await API.get('/patients/me');
    const meId = getPatientIdFromPayload(meRes.data);
    if (meId !== null) return meId;
  } catch {
    // Continue to fallback lookups.
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

const FindDoctors = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState(normalizeId(user?.userId));
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await API.get('/doctors');
        setDoctors(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrapPatientId = async () => {
      const resolved = await resolvePatientId(user);
      if (!cancelled) setPatientId(resolved);
    };

    bootstrapPatientId();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = doctors.filter((d) =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openBookingModal = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingForm({ date: '', time: '', reason: '' });
  };

  const closeBookingModal = () => {
    if (submitting) return;
    setSelectedDoctor(null);
  };

  const handleBookingFieldChange = (e) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    const resolvedDoctorId = normalizeId(
      selectedDoctor?.doctorId ?? selectedDoctor?.id ?? selectedDoctor?.userId
    );

    if (!resolvedDoctorId) {
      toast.error('Please select a doctor.');
      return;
    }

    if (!bookingForm.date || !bookingForm.time || !bookingForm.reason.trim()) {
      toast.error('Please fill date, time, and reason.');
      return;
    }

    const appointmentDate = new Date(`${bookingForm.date}T${bookingForm.time}`);
    if (Number.isNaN(appointmentDate.getTime())) {
      toast.error('Invalid date or time.');
      return;
    }

    if (appointmentDate <= new Date()) {
      toast.error('Please choose a future appointment time.');
      return;
    }

    setSubmitting(true);
    try {
      const resolvedPatientId = patientId ?? (await resolvePatientId(user));
      if (!resolvedPatientId) {
        toast.error('Unable to identify patient profile. Please re-login and try again.');
        setSubmitting(false);
        return;
      }

      const payload = {
        doctorId: resolvedDoctorId,
        patientId: resolvedPatientId,
        dateTime: appointmentDate.toISOString(),
        reason: bookingForm.reason.trim(),
      };

      await API.post('/appointments', payload);
      toast.success('Appointment booked successfully');
      setSelectedDoctor(null);
      navigate('/patient/appointments');
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to book appointment'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Find Doctors</h1>
        <p>Browse our medical professionals</p>
      </motion.div>

      <motion.div
        style={{ marginBottom: 24 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="form-input-icon" style={{ maxWidth: 400 }}>
          <FiSearch className="icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {filtered.map((doctor, index) => (
          <AnimatedCard
            key={doctor.doctorId || doctor.userId || doctor.id || index}
            delay={index * 0.1}
            className="data-card"
          >
            <div style={{ padding: 24 }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 16, marginBottom: 20,
              }}>
                <motion.div
                  style={{
                    width: 60, height: 60, borderRadius: 16,
                    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 26, fontWeight: 700,
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {doctor.name?.charAt(0)}
                </motion.div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                    {doctor.name}
                  </h3>
                  <span className="badge badge-doctor">
                    <FiUserCheck style={{ marginRight: 4 }} /> Doctor
                  </span>
                </div>
              </div>

              <div style={{
                padding: 12, background: 'rgba(0,0,0,0.2)',
                borderRadius: 10, fontSize: 13,
                color: '#94a3b8', marginBottom: 16,
              }}>
                <FiAward style={{ marginRight: 8 }} />
                License: <strong style={{ color: '#f8fafc' }}>
                  {doctor.licenseNumber}
                </strong>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <motion.button
                  className="btn btn-primary"
                  onClick={() => openBookingModal(doctor)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ fontSize: 13 }}
                >
                  <FiCalendar /> Book Appointment
                </motion.button>
                <motion.button
                  className="btn btn-secondary"
                  onClick={() => navigate('/messages')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ fontSize: 13, width: '100%' }}
                >
                  <FiMessageSquare /> Send Message
                </motion.button>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBookingModal}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              zIndex: 999,
            }}
          >
            <motion.div
              className="data-card"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              onClick={(evt) => evt.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 560,
                marginBottom: 0,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>Book Appointment</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
                    {selectedDoctor.name} {selectedDoctor.licenseNumber ? `• ${selectedDoctor.licenseNumber}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeBookingModal}
                  disabled={submitting}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#f8fafc',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleBookAppointment} style={{ padding: 20 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 14,
                  }}
                >
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Date</label>
                    <div className="form-input-icon">
                      <FiCalendar className="icon" />
                      <input
                        type="date"
                        className="form-input"
                        name="date"
                        value={bookingForm.date}
                        onChange={handleBookingFieldChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Time</label>
                    <div className="form-input-icon">
                      <FiClock className="icon" />
                      <input
                        type="time"
                        className="form-input"
                        name="time"
                        value={bookingForm.time}
                        onChange={handleBookingFieldChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 14 }}>
                  <label>Reason</label>
                  <textarea
                    className="form-input"
                    name="reason"
                    value={bookingForm.reason}
                    onChange={handleBookingFieldChange}
                    placeholder="Describe your symptoms or reason for visit"
                    rows={4}
                    style={{ resize: 'vertical', minHeight: 110 }}
                    required
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Your appointment will be sent as a scheduled request.
                  </div>
                  <motion.button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    style={{ width: 'auto', minWidth: 190 }}
                  >
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FindDoctors;
