import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiMail, FiPhone, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const EMPTY_PROFILE = {
  name: '',
  email: '',
  licenseNumber: '',
  contactNumber: '',
  specialization: '',
};

const extractPayload = (data) => data?.data || data || {};

const mapDoctorProfile = (profile, fallbackUser) => ({
  doctorId: profile.doctorId || profile.userId || fallbackUser?.userId || null,
  name: profile.name || fallbackUser?.name || '',
  email: profile.email || fallbackUser?.email || '',
  licenseNumber: profile.licenseNumber || '',
  contactNumber: profile.contactNumber || '',
  specialization: profile.specialization || '',
});

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [doctorId, setDoctorId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const endpointCandidates = useMemo(
    () => [`/doctors/${user?.userId}`, `/doctors/user/${user?.userId}`, '/doctors/me'],
    [user?.userId]
  );

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.userId) {
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
            // Try the next fallback endpoint.
          }
        }

        if (!profilePayload) {
          try {
            const res = await API.get('/doctors');
            const doctors = Array.isArray(res.data) ? res.data : [];
            profilePayload = doctors.find((item) => {
              const sameId =
                Number(item.doctorId) === Number(user.userId) ||
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

        const mapped = mapDoctorProfile(profilePayload || {}, user);
        setDoctorId(mapped.doctorId);
        setFormData({
          name: mapped.name,
          email: mapped.email,
          licenseNumber: mapped.licenseNumber,
          contactNumber: mapped.contactNumber,
          specialization: mapped.specialization,
        });
      } catch (err) {
        console.error(err);
        toast.error('Unable to load doctor profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [endpointCandidates, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.userId) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      licenseNumber: formData.licenseNumber.trim(),
      contactNumber: formData.contactNumber.trim(),
      specialization: formData.specialization.trim(),
    };

    setSaving(true);
    try {
      const targetId = doctorId || user.userId;
      const writeAttempts = [
        { method: 'put', url: `/doctors/${targetId}` },
        { method: 'patch', url: `/doctors/${targetId}` },
        { method: 'put', url: `/doctors/user/${user.userId}` },
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
          // Continue fallback writes.
        }
      }

      if (!writeSuccess) {
        throw new Error('No doctor profile update endpoint accepted the request.');
      }

      const updated = mapDoctorProfile(extractPayload(latestResponse?.data), {
        ...user,
        name: payload.name,
        email: payload.email,
      });
      setDoctorId(updated.doctorId);
      setFormData({
        name: updated.name,
        email: updated.email,
        licenseNumber: updated.licenseNumber || payload.licenseNumber,
        contactNumber: updated.contactNumber || payload.contactNumber,
        specialization: updated.specialization || payload.specialization,
      });

      updateUserProfile({
        name: updated.name || payload.name,
        email: updated.email || payload.email,
      });
      toast.success('Doctor profile updated');
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
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Doctor Profile</h1>
        <p>Manage your secure login identity and professional details</p>
      </motion.div>

      <motion.div className="data-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="data-card-header">
          <h3><FiUser style={{ marginRight: 8 }} /> Profile Information</h3>
        </div>

        <form onSubmit={handleSave} style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Full Name</label>
              <div className="form-input-icon">
                <FiUser className="icon" />
                <input className="form-input" name="name" value={formData.name} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Email</label>
              <div className="form-input-icon">
                <FiMail className="icon" />
                <input className="form-input" type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>License Number</label>
              <div className="form-input-icon">
                <FiAward className="icon" />
                <input className="form-input" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Contact Number</label>
              <div className="form-input-icon">
                <FiPhone className="icon" />
                <input className="form-input" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 14, marginBottom: 0 }}>
            <label>Specialization</label>
            <input
              className="form-input"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="Cardiology, General Medicine, Pediatrics, ..."
            />
          </div>

          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>
              Doctor ID: {doctorId || 'Not available'} | Secure role: {user?.role || 'DOCTOR'}
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving} style={{ width: 'auto', minWidth: 220 }}>
              {saving ? 'Saving...' : 'Save Doctor Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
