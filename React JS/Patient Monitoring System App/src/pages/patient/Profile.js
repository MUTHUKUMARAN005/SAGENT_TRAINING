import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiCalendar, FiUser, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const EMPTY_PROFILE = {
  name: '',
  email: '',
  dateOfBirth: '',
  contactNumber: '',
  emergencyContact: '',
};

const extractPayload = (data) => data?.data || data || {};

const toDateInput = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

const mapPatientProfile = (profile, fallbackUser) => ({
  patientId: profile.patientId || profile.userId || fallbackUser?.userId || null,
  name: profile.name || fallbackUser?.name || '',
  email: profile.email || fallbackUser?.email || '',
  dateOfBirth: toDateInput(profile.dateOfBirth),
  contactNumber: profile.contactNumber || '',
  emergencyContact: profile.emergencyContact || '',
});

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState(EMPTY_PROFILE);
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const endpointCandidates = useMemo(
    () => [`/patients/${user?.userId}`, `/patients/user/${user?.userId}`, '/patients/me'],
    [user?.userId]
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.userId) {
        setFormData(EMPTY_PROFILE);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let profilePayload = null;

        for (const endpoint of endpointCandidates) {
          try {
            const res = await API.get(endpoint);
            const payload = extractPayload(res.data);
            if (payload && !Array.isArray(payload)) {
              profilePayload = payload;
              break;
            }
          } catch {
            // Continue trying fallbacks.
          }
        }

        if (!profilePayload) {
          try {
            const listRes = await API.get('/patients');
            const patientList = Array.isArray(listRes.data) ? listRes.data : [];
            profilePayload = patientList.find((item) => {
              const sameId =
                Number(item.patientId) === Number(user.userId) ||
                Number(item.userId) === Number(user.userId);
              const sameEmail =
                item.email &&
                user.email &&
                String(item.email).toLowerCase() === String(user.email).toLowerCase();
              return sameId || sameEmail;
            });
          } catch {
            profilePayload = null;
          }
        }

        const mapped = mapPatientProfile(profilePayload || {}, user);
        setPatientId(mapped.patientId);
        setFormData({
          name: mapped.name,
          email: mapped.email,
          dateOfBirth: mapped.dateOfBirth,
          contactNumber: mapped.contactNumber,
          emergencyContact: mapped.emergencyContact,
        });
      } catch (err) {
        console.error(err);
        toast.error('Unable to load profile details');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [endpointCandidates, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user?.userId) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      dateOfBirth: formData.dateOfBirth || null,
      contactNumber: formData.contactNumber.trim(),
      emergencyContact: formData.emergencyContact.trim(),
    };

    setSaving(true);
    try {
      const targetId = patientId || user.userId;
      const writeAttempts = [
        { method: 'put', url: `/patients/${targetId}` },
        { method: 'patch', url: `/patients/${targetId}` },
        { method: 'put', url: `/patients/user/${user.userId}` },
      ];

      let writeSuccess = false;
      let latestResponse = null;

      for (const attempt of writeAttempts) {
        try {
          if (attempt.method === 'patch') {
            latestResponse = await API.patch(attempt.url, payload);
          } else {
            latestResponse = await API.put(attempt.url, payload);
          }
          writeSuccess = true;
          break;
        } catch {
          // Continue trying fallback write endpoints.
        }
      }

      if (!writeSuccess) {
        throw new Error('No profile update endpoint accepted the request.');
      }

      const updated = mapPatientProfile(extractPayload(latestResponse?.data), {
        ...user,
        name: payload.name,
        email: payload.email,
      });
      setPatientId(updated.patientId);
      setFormData({
        name: updated.name,
        email: updated.email,
        dateOfBirth: updated.dateOfBirth,
        contactNumber: updated.contactNumber,
        emergencyContact: updated.emergencyContact,
      });

      updateUserProfile({
        name: updated.name || payload.name,
        email: updated.email || payload.email,
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
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
        <h1>My Profile</h1>
        <p>Manage your contact details and patient information</p>
      </motion.div>

      <motion.div
        className="data-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="data-card-header">
          <h3>
            <FiUser style={{ marginRight: 8 }} />
            Profile Information
          </h3>
        </div>

        <form onSubmit={saveProfile} style={{ padding: 24 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 14,
            }}
          >
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Full Name</label>
              <div className="form-input-icon">
                <FiUser className="icon" />
                <input
                  className="form-input"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Email</label>
              <div className="form-input-icon">
                <FiMail className="icon" />
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Date of Birth</label>
              <div className="form-input-icon">
                <FiCalendar className="icon" />
                <input
                  className="form-input"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Contact Number</label>
              <div className="form-input-icon">
                <FiPhone className="icon" />
                <input
                  className="form-input"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="+1-555-0000"
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 14, marginBottom: 0 }}>
            <label>Emergency Contact</label>
            <div className="form-input-icon">
              <FiShield className="icon" />
              <input
                className="form-input"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="+1-555-0000"
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: 12 }}>
              Patient ID: {patientId || 'Not available'} | Role: {user?.role || 'PATIENT'}
            </div>
            <motion.button
              className="btn btn-primary"
              type="submit"
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              style={{ width: 'auto', minWidth: 220 }}
            >
              {saving ? 'Saving Profile...' : 'Save Profile'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
