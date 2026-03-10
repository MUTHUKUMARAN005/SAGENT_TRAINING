import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiBookOpen, FiClipboard, FiEdit2, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const LOCAL_NOTES_PREFIX = 'doctor_manual_notes_';

const getLocalNotesKey = (doctorId) => `${LOCAL_NOTES_PREFIX}${doctorId || 'unknown'}`;

const readLocalNotes = (doctorId) => {
  try {
    const raw = localStorage.getItem(getLocalNotesKey(doctorId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalNotes = (doctorId, notes) => {
  try {
    localStorage.setItem(getLocalNotesKey(doctorId), JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
};

const MedicalRecords = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [appointmentsByPatient, setAppointmentsByPatient] = useState(new Map());
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [history, setHistory] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [localNotes, setLocalNotes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    diagnosisNotes: '',
    prescriptionNotes: '',
    followUpDate: '',
  });

  useEffect(() => {
    const bootstrap = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [appointmentsRes, consultationsRes] = await Promise.all([
          API.get(`/appointments/doctor/${user.userId}`),
          API.get('/consultations'),
        ]);

        const appointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];
        const patientMap = new Map();
        const latestAppointmentMap = new Map();

        appointments.forEach((appt) => {
          const patient = appt?.patient;
          if (!patient?.patientId) return;
          if (!patientMap.has(patient.patientId)) patientMap.set(patient.patientId, patient);

          const existing = latestAppointmentMap.get(patient.patientId);
          const existingTime = new Date(existing?.dateTime || 0).getTime() || 0;
          const nextTime = new Date(appt.dateTime || 0).getTime() || 0;
          if (!existing || nextTime >= existingTime) {
            latestAppointmentMap.set(patient.patientId, appt);
          }
        });

        const consultationList = Array.isArray(consultationsRes.data) ? consultationsRes.data : [];
        setPatients(Array.from(patientMap.values()));
        setAppointmentsByPatient(latestAppointmentMap);
        setConsultations(consultationList);

        const initialPatient = Array.from(patientMap.values())[0];
        if (initialPatient?.patientId) {
          setSelectedPatientId(String(initialPatient.patientId));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [user?.userId]);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!selectedPatientId) {
        setHistory([]);
        setHealthRecords([]);
        setLocalNotes([]);
        return;
      }

      const patientId = Number(selectedPatientId);
      try {
        const [historyRes, recordsRes] = await Promise.all([
          API.get(`/medical-history/patient/${patientId}`),
          API.get(`/health-records/patient/${patientId}`),
        ]);
        setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
        setHealthRecords(Array.isArray(recordsRes.data) ? recordsRes.data : []);
      } catch (err) {
        console.error(err);
        setHistory([]);
        setHealthRecords([]);
      }

      setLocalNotes(
        readLocalNotes(user?.userId).filter(
          (note) => Number(note.patientId) === Number(patientId)
        )
      );
    };

    loadPatientData();
  }, [selectedPatientId, user?.userId]);

  const selectedPatient = useMemo(
    () =>
      patients.find(
        (patient) => Number(patient.patientId) === Number(selectedPatientId)
      ) || null,
    [patients, selectedPatientId]
  );

  const patientConsultations = useMemo(
    () =>
      consultations.filter(
        (consult) =>
          Number(consult?.appointment?.patient?.patientId) === Number(selectedPatientId)
      ),
    [consultations, selectedPatientId]
  );

  const allNotes = useMemo(() => {
    const remoteNotes = patientConsultations.map((item) => ({
      noteId: `remote-${item.consultationId}`,
      createdAt: item.createdAt || item.followUpDate || new Date().toISOString(),
      diagnosisNotes: item.summary || item.advice || '',
      prescriptionNotes: item.prescription || '',
      followUpDate: item.followUpDate || '',
      source: 'server',
    }));
    const localMapped = localNotes.map((item) => ({
      ...item,
      source: 'local',
    }));

    return [...remoteNotes, ...localMapped].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [localNotes, patientConsultations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveNotes = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !user?.userId) return;

    const diagnosisNotes = formData.diagnosisNotes.trim();
    const prescriptionNotes = formData.prescriptionNotes.trim();

    if (!diagnosisNotes || !prescriptionNotes) {
      toast.error('Both diagnosis and prescription notes are required');
      return;
    }

    setSaving(true);
    try {
      const latestAppointment = appointmentsByPatient.get(selectedPatient.patientId);
      const payload = {
        appointmentId: latestAppointment?.appointmentId || undefined,
        patientId: selectedPatient.patientId,
        doctorId: user.userId,
        summary: diagnosisNotes,
        advice: diagnosisNotes,
        prescription: prescriptionNotes,
        followUpDate: formData.followUpDate || null,
      };

      let persisted = false;
      try {
        await API.post('/consultations', payload);
        persisted = true;
      } catch {
        if (payload.appointmentId) {
          try {
            await API.post(`/consultations/appointment/${payload.appointmentId}`, payload);
            persisted = true;
          } catch {
            persisted = false;
          }
        }
      }

      if (persisted) {
        toast.success('Medical notes saved to server');
        try {
          const consultRes = await API.get('/consultations');
          setConsultations(Array.isArray(consultRes.data) ? consultRes.data : []);
        } catch {
          // Keep existing list on refresh failure.
        }
      } else {
        const note = {
          noteId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          patientId: selectedPatient.patientId,
          doctorId: user.userId,
          diagnosisNotes,
          prescriptionNotes,
          followUpDate: formData.followUpDate || '',
          createdAt: new Date().toISOString(),
        };
        const nextNotes = [note, ...readLocalNotes(user.userId)].slice(0, 200);
        writeLocalNotes(user.userId, nextNotes);
        setLocalNotes(nextNotes.filter((item) => Number(item.patientId) === selectedPatient.patientId));
        toast.success('Medical notes saved locally (server endpoint unavailable)');
      }

      setFormData({
        diagnosisNotes: '',
        prescriptionNotes: '',
        followUpDate: '',
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <motion.div className="page-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Medical Records</h1>
        <p>View patient history and add diagnosis/prescription notes</p>
      </motion.div>

      <motion.div className="data-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="data-card-header">
          <h3><FiClipboard style={{ marginRight: 8 }} /> Select Patient</h3>
        </div>
        <div style={{ padding: 20 }}>
          <select
            className="form-select"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
          >
            {patients.length === 0 && <option value="">No patients available</option>}
            {patients.map((patient) => (
              <option key={patient.patientId} value={patient.patientId}>
                {patient.name} (ID: {patient.patientId})
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {selectedPatient ? (
        <>
          <motion.div className="data-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="data-card-header">
              <h3><FiBookOpen style={{ marginRight: 8 }} /> Patient History</h3>
            </div>
            <div style={{ padding: 20 }}>
              {history.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>No medical history found for this patient.</div>
              ) : (
                history.map((item) => (
                  <div key={item.historyId} style={{ marginBottom: 10, padding: 12, borderRadius: 10, background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ fontWeight: 700 }}>{item.condition}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>Diagnosed: {item.diagnosisDate || 'N/A'}</div>
                    <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 13 }}>{item.details || 'No details'}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div className="data-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="data-card-header">
              <h3><FiFileText style={{ marginRight: 8 }} /> Recent Health Records</h3>
            </div>
            <div style={{ padding: 20 }}>
              {healthRecords.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>No health records available.</div>
              ) : (
                healthRecords.slice(0, 5).map((record) => (
                  <div key={record.recordId} style={{ marginBottom: 10, padding: 12, borderRadius: 10, background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{record.date || record.createdAt || 'Unknown date'}</div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      BP {record.bloodPressureSystolic}/{record.bloodPressureDiastolic} mmHg | HR {record.heartRate ?? '--'} bpm | SpO2 {record.oxygenLevel}% | Temp {record.temperature}deg F
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div className="data-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="data-card-header">
              <h3><FiEdit2 style={{ marginRight: 8 }} /> Add Diagnosis & Prescription Notes</h3>
            </div>
            <form onSubmit={saveNotes} style={{ padding: 20 }}>
              <div className="form-group">
                <label>Diagnosis Notes</label>
                <textarea
                  name="diagnosisNotes"
                  className="form-input"
                  value={formData.diagnosisNotes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Clinical observations and diagnosis..."
                  style={{ resize: 'vertical', minHeight: 110 }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Prescription Notes</label>
                <textarea
                  name="prescriptionNotes"
                  className="form-input"
                  value={formData.prescriptionNotes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Medication, dosage, and instructions..."
                  style={{ resize: 'vertical', minHeight: 110 }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Follow-up Date</label>
                <input
                  type="date"
                  name="followUpDate"
                  className="form-input"
                  value={formData.followUpDate}
                  onChange={handleChange}
                />
              </div>

              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving Notes...' : 'Save Notes'}
              </button>
            </form>
          </motion.div>

          <motion.div className="data-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="data-card-header">
              <h3>Existing Diagnosis & Prescription Notes</h3>
            </div>
            <div style={{ padding: 20 }}>
              {allNotes.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 13 }}>No notes saved for this patient yet.</div>
              ) : (
                allNotes.map((note) => (
                  <div key={note.noteId} style={{ marginBottom: 10, padding: 12, borderRadius: 10, background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>
                      {new Date(note.createdAt).toLocaleString()} | {note.source === 'local' ? 'Local note' : 'Server note'}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      <strong>Diagnosis:</strong> {note.diagnosisNotes || 'N/A'}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      <strong>Prescription:</strong> {note.prescriptionNotes || 'N/A'}
                    </div>
                    {note.followUpDate && (
                      <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 12 }}>
                        Follow-up: {note.followUpDate}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>Select a patient to view medical records</h3>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
