import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiEdit2, FiEye, FiPhone, FiPlus, FiSearch, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  dateOfBirth: '',
  contactNumber: '',
  emergencyContact: '',
};

const toDateInput = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

const AllPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailPatient, setDetailPatient] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchPatients = async () => {
    try {
      const res = await API.get('/patients');
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter((patient) =>
      [patient.name, patient.email, String(patient.patientId)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [patients, search]);

  const openCreate = () => {
    setMode('create');
    setSelectedPatient(null);
    setFormData(EMPTY_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (patient) => {
    setMode('edit');
    setSelectedPatient(patient);
    setFormData({
      name: patient?.name || '',
      email: patient?.email || '',
      password: '',
      dateOfBirth: toDateInput(patient?.dateOfBirth),
      contactNumber: patient?.contactNumber || '',
      emergencyContact: patient?.emergencyContact || '',
    });
    setIsFormOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const closeForm = () => {
    if (submitting) return;
    setIsFormOpen(false);
    setSelectedPatient(null);
    setFormData(EMPTY_FORM);
  };

  const savePatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      dateOfBirth: formData.dateOfBirth || null,
      contactNumber: formData.contactNumber.trim(),
      emergencyContact: formData.emergencyContact.trim(),
    };

    try {
      if (mode === 'create') {
        const createPayload = {
          ...payload,
          password: formData.password,
          role: 'PATIENT',
        };

        let created = false;
        try {
          await API.post('/patients', createPayload);
          created = true;
        } catch {
          await API.post('/auth/register', createPayload);
          created = true;
        }

        if (created) toast.success('Patient added successfully');
      } else if (selectedPatient?.patientId) {
        let updated = false;
        try {
          await API.put(`/patients/${selectedPatient.patientId}`, payload);
          updated = true;
        } catch {
          await API.patch(`/patients/${selectedPatient.patientId}`, payload);
          updated = true;
        }
        if (updated) toast.success('Patient updated successfully');
      }

      closeForm();
      fetchPatients();
    } catch (err) {
      console.error(err);
      toast.error(mode === 'create' ? 'Failed to add patient' : 'Failed to update patient');
    } finally {
      setSubmitting(false);
    }
  };

  const deletePatient = async (patient) => {
    if (!patient?.patientId) return;
    const confirmed = window.confirm(`Delete patient ${patient.name || patient.patientId}?`);
    if (!confirmed) return;

    try {
      try {
        await API.delete(`/patients/${patient.patientId}`);
      } catch {
        await API.delete(`/users/${patient.patientId}`);
      }
      toast.success('Patient deleted');
      fetchPatients();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete patient');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Patient Management</h1>
        <p>Add, update, delete, and view patient details</p>
      </motion.div>

      <motion.div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="form-input-icon" style={{ maxWidth: 400 }}>
          <FiSearch className="icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={openCreate}>
          <FiPlus /> Add Patient
        </button>
      </motion.div>

      <motion.div className="data-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="data-card-header">
          <h3><FiUsers style={{ marginRight: 8 }} /> Patients ({filteredPatients.length})</h3>
        </div>

        <div className="report-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>DOB</th>
                <th>Contact</th>
                <th>Emergency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredPatients.map((patient, index) => (
                  <motion.tr key={patient.patientId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }}>
                    <td>#{patient.patientId}</td>
                    <td>{patient.name || 'N/A'}</td>
                    <td><FiCalendar style={{ marginRight: 4, opacity: 0.6 }} />{patient.dateOfBirth || 'N/A'}</td>
                    <td><FiPhone style={{ marginRight: 4, opacity: 0.6 }} />{patient.contactNumber || 'N/A'}</td>
                    <td>{patient.emergencyContact || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDetailPatient(patient)} title="View details">
                          <FiEye />
                        </button>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => openEdit(patient)} title="Update patient">
                          <FiEdit2 />
                        </button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => deletePatient(patient)} title="Delete patient">
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
                <h3>{mode === 'create' ? 'Add Patient' : 'Update Patient'}</h3>
                <button type="button" className="btn btn-sm btn-secondary" style={{ width: 'auto' }} onClick={closeForm}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={savePatient} style={{ padding: 20 }}>
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
                    <label>Date of Birth</label>
                    <input className="form-input" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Contact Number</label>
                    <input className="form-input" name="contactNumber" value={formData.contactNumber} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Emergency Contact</label>
                    <input className="form-input" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} />
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn btn-secondary" style={{ width: 'auto' }} onClick={closeForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={submitting}>
                    {submitting ? 'Saving...' : mode === 'create' ? 'Add Patient' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailPatient(null)}
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
                <h3>Patient Details</h3>
                <button type="button" className="btn btn-sm btn-secondary" style={{ width: 'auto' }} onClick={() => setDetailPatient(null)}>
                  <FiX />
                </button>
              </div>
              <div style={{ padding: 20, display: 'grid', gap: 8 }}>
                <div><strong>ID:</strong> {detailPatient.patientId}</div>
                <div><strong>Name:</strong> {detailPatient.name || 'N/A'}</div>
                <div><strong>Email:</strong> {detailPatient.email || 'N/A'}</div>
                <div><strong>Date of Birth:</strong> {detailPatient.dateOfBirth || 'N/A'}</div>
                <div><strong>Contact:</strong> {detailPatient.contactNumber || 'N/A'}</div>
                <div><strong>Emergency Contact:</strong> {detailPatient.emergencyContact || 'N/A'}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllPatients;
