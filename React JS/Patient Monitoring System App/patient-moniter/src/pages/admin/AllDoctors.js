import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAward,
  FiEdit2,
  FiEye,
  FiMail,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUserCheck,
  FiX,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  licenseNumber: '',
  contactNumber: '',
  specialization: '',
};

const AllDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [detailDoctor, setDetailDoctor] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctors = async () => {
    try {
      const res = await API.get('/doctors');
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    const q = search.toLowerCase();
    return doctors.filter((doctor) =>
      [doctor.name, doctor.email, doctor.licenseNumber, String(doctor.doctorId)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [doctors, search]);

  const openCreate = () => {
    setMode('create');
    setSelectedDoctor(null);
    setFormData(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (doctor) => {
    setMode('edit');
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor?.name || '',
      email: doctor?.email || '',
      password: '',
      licenseNumber: doctor?.licenseNumber || '',
      contactNumber: doctor?.contactNumber || '',
      specialization: doctor?.specialization || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (submitting) return;
    setIsFormOpen(false);
    setSelectedDoctor(null);
    setFormData(EMPTY_FORM);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveDoctor = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      licenseNumber: formData.licenseNumber.trim(),
      contactNumber: formData.contactNumber.trim(),
      specialization: formData.specialization.trim(),
    };

    try {
      if (mode === 'create') {
        const createPayload = {
          ...payload,
          password: formData.password,
          role: 'DOCTOR',
        };

        let created = false;
        try {
          await API.post('/doctors', createPayload);
          created = true;
        } catch {
          await API.post('/auth/register', createPayload);
          created = true;
        }
        if (created) toast.success('Doctor added successfully');
      } else if (selectedDoctor?.doctorId) {
        let updated = false;
        try {
          await API.put(`/doctors/${selectedDoctor.doctorId}`, payload);
          updated = true;
        } catch {
          await API.patch(`/doctors/${selectedDoctor.doctorId}`, payload);
          updated = true;
        }
        if (updated) toast.success('Doctor updated successfully');
      }

      closeForm();
      fetchDoctors();
    } catch (err) {
      console.error(err);
      toast.error(mode === 'create' ? 'Failed to add doctor' : 'Failed to update doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDoctor = async (doctor) => {
    if (!doctor?.doctorId) return;
    const confirmed = window.confirm(`Delete doctor ${doctor.name || doctor.doctorId}?`);
    if (!confirmed) return;

    try {
      try {
        await API.delete(`/doctors/${doctor.doctorId}`);
      } catch {
        await API.delete(`/users/${doctor.doctorId}`);
      }
      toast.success('Doctor deleted');
      fetchDoctors();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete doctor');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Doctor Management</h1>
        <p>Add, update, delete, and review doctor details</p>
      </motion.div>

      <motion.div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="form-input-icon" style={{ maxWidth: 400 }}>
          <FiSearch className="icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, license, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={openCreate}>
          <FiPlus /> Add Doctor
        </button>
      </motion.div>

      <motion.div className="data-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="data-card-header">
          <h3><FiUserCheck style={{ marginRight: 8 }} /> Doctors ({filteredDoctors.length})</h3>
        </div>

        <div className="report-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>License</th>
                <th>Specialization</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredDoctors.map((doctor, index) => (
                  <motion.tr key={doctor.doctorId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }}>
                    <td>#{doctor.doctorId}</td>
                    <td>{doctor.name || 'N/A'}</td>
                    <td><FiMail style={{ marginRight: 4, opacity: 0.6 }} />{doctor.email || 'N/A'}</td>
                    <td><FiAward style={{ marginRight: 4, opacity: 0.6 }} />{doctor.licenseNumber || 'N/A'}</td>
                    <td>{doctor.specialization || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDetailDoctor(doctor)}>
                          <FiEye />
                        </button>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => openEdit(doctor)}>
                          <FiEdit2 />
                        </button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteDoctor(doctor)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeForm}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 14,
              zIndex: 1000,
            }}
          >
            <motion.div
              className="data-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 620, marginBottom: 0 }}
            >
              <div className="data-card-header">
                <h3>{mode === 'create' ? 'Add Doctor' : 'Update Doctor'}</h3>
                <button type="button" className="btn btn-sm btn-secondary" style={{ width: 'auto' }} onClick={closeForm}>
                  <FiX />
                </button>
              </div>

              <form onSubmit={saveDoctor} style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Full Name</label>
                    <input className="form-input" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Email</label>
                    <input className="form-input" type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  {mode === 'create' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Password</label>
                      <input className="form-input" type="password" name="password" value={formData.password} onChange={handleChange} minLength={6} required />
                    </div>
                  )}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>License Number</label>
                    <input className="form-input" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Contact Number</label>
                    <input className="form-input" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Specialization</label>
                    <input className="form-input" name="specialization" value={formData.specialization} onChange={handleChange} />
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={closeForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={submitting}>
                    {submitting ? 'Saving...' : mode === 'create' ? 'Add Doctor' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailDoctor(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 14,
              zIndex: 1000,
            }}
          >
            <motion.div
              className="data-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 540, marginBottom: 0, paddingBottom: 10 }}
            >
              <div className="data-card-header">
                <h3>Doctor Details</h3>
                <button type="button" className="btn btn-sm btn-secondary" style={{ width: 'auto' }} onClick={() => setDetailDoctor(null)}>
                  <FiX />
                </button>
              </div>
              <div style={{ padding: 20, display: 'grid', gap: 8 }}>
                <div><strong>ID:</strong> {detailDoctor.doctorId}</div>
                <div><strong>Name:</strong> {detailDoctor.name || 'N/A'}</div>
                <div><strong>Email:</strong> {detailDoctor.email || 'N/A'}</div>
                <div><strong>License:</strong> {detailDoctor.licenseNumber || 'N/A'}</div>
                <div><strong>Contact:</strong> {detailDoctor.contactNumber || 'N/A'}</div>
                <div><strong>Specialization:</strong> {detailDoctor.specialization || 'N/A'}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllDoctors;
