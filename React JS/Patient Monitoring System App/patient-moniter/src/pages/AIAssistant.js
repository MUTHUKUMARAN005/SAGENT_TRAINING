import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { sendAssistantMessage } from '../api/openaiAssistant';

const createMessage = (role, text) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  text: String(text || ''),
});

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatDateTime = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value || '');
  }
};

const take = (arr, count) => safeArray(arr).slice(0, count);

const summarizeDoctors = (doctors, count = 5) =>
  take(doctors, count)
    .map((doctor, index) => {
      const name = doctor?.name || `Doctor ${index + 1}`;
      const license = doctor?.licenseNumber ? ` (License: ${doctor.licenseNumber})` : '';
      return `${index + 1}. ${name}${license}`;
    })
    .join('\n');

const findDoctorMatches = (query, doctors) => {
  const q = String(query || '').toLowerCase();
  const words = q.split(/[^a-z0-9]+/).filter((word) => word.length >= 3);
  if (!words.length) return [];

  return safeArray(doctors).filter((doctor) => {
    const haystack = `${doctor?.name || ''} ${doctor?.licenseNumber || ''}`.toLowerCase();
    return words.some((word) => haystack.includes(word));
  });
};

const getQuickPrompts = (role) => {
  const normalizedRole = String(role || '').toUpperCase();

  if (normalizedRole === 'DOCTOR') {
    return [
      'Summarize my dashboard',
      'How many appointments do I have today?',
      'Where is the monitoring dashboard?',
      'Create a follow-up consultation checklist',
      'Draft a patient-friendly explanation of blood pressure',
    ];
  }

  if (normalizedRole === 'ADMIN') {
    return [
      'Summarize system dashboard',
      'Where is the system dashboard?',
      'How do I manage patients?',
      'How many patients and doctors are in the system?',
      'Draft an appointment reminder message',
      'Create a no-show follow-up workflow checklist',
    ];
  }

  return [
    'Summarize my dashboard',
    'How many appointments do I have?',
    'Show my live vitals status',
    'Where is health charts?',
    'Show doctor details',
    'How do I book an appointment?',
    'What is my latest health record?',
    'Summarize my medical history',
    'What questions should I ask my doctor?',
  ];
};

const buildContextSummary = (context, user) => {
  if (!context) return 'No live app context available.';

  const role = String(user?.role || '').toUpperCase();
  if (role === 'PATIENT') {
    const latestRecord = context.latestHealthRecord;
    const nextAppt = context.nextAppointment;
    const recentConditions = take(context.medicalHistoryConditions, 3);
    const doctorCount = safeArray(context.availableDoctors).length;
    return [
      `Role: PATIENT`,
      `My Appointments: ${context.myAppointments || 0}`,
      `Scheduled: ${context.scheduled || 0}`,
      `Completed: ${context.completed || 0}`,
      `Unread Notifications: ${context.unreadNotifications || 0}`,
      `Reports: ${context.reportCount || 0}`,
      `Doctors Available: ${doctorCount}`,
      nextAppt
        ? `Next Appointment: ${formatDateTime(nextAppt.dateTime)} (${nextAppt.status || 'UNKNOWN'}) with ${nextAppt.doctor?.name || 'Doctor'}`
        : 'Next Appointment: None found',
      latestRecord
        ? `Latest Vitals: BP ${latestRecord.bloodPressureSystolic || '-'} / ${latestRecord.bloodPressureDiastolic || '-'} mmHg, SpO2 ${latestRecord.oxygenLevel ?? '-'}%, Temp ${latestRecord.temperature ?? '-'}F (${latestRecord.date || 'No date'})`
        : 'Latest Vitals: No health records found',
      recentConditions.length
        ? `Medical History (recent conditions): ${recentConditions.join(', ')}`
        : 'Medical History: No conditions found',
    ].join('\n');
  }
  if (role === 'DOCTOR') {
    const recentPatientNames = take(context.recentPatients, 3)
      .map((p) => p?.name)
      .filter(Boolean);
    return [
      `Role: DOCTOR`,
      `My Patients: ${context.myPatients || 0}`,
      `Appointments: ${context.myAppointments || 0}`,
      `Scheduled: ${context.scheduled || 0}`,
      `Unread Notifications: ${context.unreadNotifications || 0}`,
      `Reports: ${context.reportCount || 0}`,
      `Doctors in Directory: ${safeArray(context.availableDoctors).length}`,
      recentPatientNames.length
        ? `Recent Patients: ${recentPatientNames.join(', ')}`
        : 'Recent Patients: No recent patients found',
    ].join('\n');
  }
  return [
    `Role: ADMIN`,
    `Total Patients: ${context.totalPatients || 0}`,
    `Total Doctors: ${context.totalDoctors || 0}`,
    `Total Appointments: ${context.totalAppointments || 0}`,
    `Unread Notifications: ${context.unreadNotifications || 0}`,
    `Reports: ${context.reportCount || 0}`,
    `Doctors in Directory: ${safeArray(context.availableDoctors).length}`,
  ].join('\n');
};

const buildQuestionWithContext = ({ question, context, user }) => {
  const role = String(user?.role || 'USER').toUpperCase();
  const userName = user?.name || user?.email || 'User';
  return [
    `App context for ${userName} (${role}) in a healthcare patient monitoring app:`,
    buildContextSummary(context, user),
    '',
    'Use the app context when relevant.',
    'For health information: do not diagnose and include a short safety note.',
    `User question: ${question}`,
  ].join('\n');
};

const localAssistantAnswer = ({ question, context, user }) => {
  const q = String(question || '').toLowerCase().trim();
  const role = String(user?.role || '').toUpperCase();
  const latestRecord = context?.latestHealthRecord;
  const nextAppt = context?.nextAppointment;
  const availableDoctors = safeArray(context?.availableDoctors);

  if (!q) return 'Please type a question.';

  if (
    /chest pain|trouble breathing|shortness of breath|stroke|severe bleeding|unconscious|seizure/.test(
      q
    )
  ) {
    return 'If this may be a severe or life-threatening symptom, seek emergency care immediately or call local emergency services. This assistant cannot diagnose.';
  }

  if (/\b(?:summary|dashboard|overview|status)\b/.test(q)) {
    return `Here is your current app summary:\n${buildContextSummary(context, user)}`;
  }

  if (/\bnotifications?\b/.test(q)) {
    return context
      ? `You currently have ${context.unreadNotifications || 0} unread notifications. Open Notifications to review them.`
      : 'Open Notifications from the sidebar to review updates.';
  }

  if (
    /\bdoctor\b/.test(q) &&
    /\b(details?|info|information|list|available|show|give|find|search)\b/.test(q)
  ) {
    if (!availableDoctors.length) {
      return 'I could not load doctor directory details right now. Open Find Doctors from the sidebar to browse available doctors.';
    }

    const matches = findDoctorMatches(q, availableDoctors);
    if (matches.length) {
      return [
        `Matching doctor details (${matches.length} found):`,
        summarizeDoctors(matches, 5),
        'Open Find Doctors to view full profiles and book an appointment.',
      ].join('\n');
    }

    return [
      `Available doctors (${availableDoctors.length} total):`,
      summarizeDoctors(availableDoctors, 5),
      'Open Find Doctors to see all doctors and book an appointment.',
    ].join('\n');
  }

  if (/\b(next|upcoming)\b/.test(q) && /\bappointments?\b/.test(q)) {
    if (!nextAppt) return 'I could not find an upcoming appointment in the loaded context.';
    return `Your next appointment is ${formatDateTime(nextAppt.dateTime)} with ${nextAppt.doctor?.name || 'Doctor'} (${nextAppt.status || 'UNKNOWN'}).`;
  }

  if (/\bappointments?\b/.test(q) && /\b(?:how|book|create)\b/.test(q)) {
    if (role === 'PATIENT') {
      return 'Open Find Doctors or Book Appointment, choose a doctor, select a date/time, add the reason, and confirm the appointment.';
    }
    return 'Appointments are managed from the appointments pages in the sidebar based on your role.';
  }

  if (/\bappointments?\b/.test(q)) {
    if (!context) return 'I could not load appointment counts right now.';
    if (role === 'PATIENT') {
      return `You have ${context.myAppointments || 0} appointments (${context.scheduled || 0} scheduled, ${context.completed || 0} completed).`;
    }
    if (role === 'DOCTOR') {
      return `You have ${context.myAppointments || 0} appointments and ${context.scheduled || 0} scheduled upcoming appointments.`;
    }
    return `The system has ${context.totalAppointments || 0} appointments.`;
  }

  if (/\bpatients?\b/.test(q)) {
    if (role === 'DOCTOR') {
      return context
        ? `You currently have ${context.myPatients || 0} unique patients in your appointment list.`
        : 'Open My Patients from the sidebar to review patients.';
    }
    if (role === 'ADMIN') {
      return context
        ? `The system currently has ${context.totalPatients || 0} patients.`
        : 'Open All Patients from the admin sidebar to review patient records.';
    }
  }

  if (/\bdoctors?\b/.test(q) && role === 'ADMIN') {
    if (!context) {
      return 'Open All Doctors from the admin sidebar to review doctor accounts.';
    }

    if (/\b(details?|list|show|available)\b/.test(q) && availableDoctors.length) {
      return [
        `The system currently has ${context.totalDoctors || 0} doctors.`,
        'Sample doctor details:',
        summarizeDoctors(availableDoctors, 5),
        'Open All Doctors for the full list.',
      ].join('\n');
    }

    return `The system currently has ${context.totalDoctors || 0} doctors.`;
  }

  if (role === 'PATIENT' && /\bdoctors?\b/.test(q) && /\blicense\b/.test(q)) {
    if (!availableDoctors.length) {
      return 'I could not load doctor license details right now. Open Find Doctors to view doctor licenses.';
    }
    return [
      'Doctor directory (with license numbers):',
      summarizeDoctors(availableDoctors, 5),
      'Open Find Doctors for more doctors and booking options.',
    ].join('\n');
  }

  if (/\b(report|reports)\b/.test(q)) {
    if (!context) return 'Open Reports from the sidebar to review available reports.';
    return `There ${context.reportCount === 1 ? 'is' : 'are'} ${context.reportCount || 0} report${context.reportCount === 1 ? '' : 's'} available in your current context. Open Reports to view details.`;
  }

  if (role === 'PATIENT' && /\b(health record|records|vitals|bp|blood pressure|oxygen|spo2|temperature)\b/.test(q)) {
    if (!latestRecord) {
      return 'I could not find health record data right now. Open My Health Records to view your vitals and history.';
    }
    return [
      `Latest health record (${latestRecord.date || 'date unavailable'}):`,
      `Blood Pressure: ${latestRecord.bloodPressureSystolic || '-'} / ${latestRecord.bloodPressureDiastolic || '-'} mmHg`,
      `Oxygen Level: ${latestRecord.oxygenLevel ?? '-'}%`,
      `Temperature: ${latestRecord.temperature ?? '-'}F`,
      latestRecord.notes ? `Notes: ${latestRecord.notes}` : '',
      'For live vitals monitoring and instant alerts, open Live Monitor.',
      'Safety note: for interpretation of values or symptoms, consult your doctor.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (role === 'PATIENT' && /\b(medical history|history|condition|conditions|diagnosed)\b/.test(q)) {
    const conditions = safeArray(context?.medicalHistoryConditions);
    if (!conditions.length) {
      return 'I could not find medical history entries right now. Open Medical History from the sidebar to review recorded conditions.';
    }
    return `Your recorded medical history includes: ${take(conditions, 8).join(', ')}. Open Medical History for full details and diagnosis dates.`;
  }

  if (/\b(how|where)\b/.test(q) && /\b(health records?|health charts?|medical history|reports?|appointments?|notifications?|messages?|profile|live|monitor|medical records?|system dashboard|patients?|doctors?)\b/.test(q)) {
    if (/\b(profile)\b/.test(q)) return 'Open My Profile from the sidebar.';
    if (/\b(live|monitor|vitals)\b/.test(q)) return 'Open Live Monitor from the sidebar for real-time vitals and alerts.';
    if (/\bhealth charts?\b/.test(q)) return 'Open Health Charts from the patient sidebar.';
    if (role === 'DOCTOR' && /\bmonitor\b/.test(q)) return 'Open Monitoring Dashboard from the doctor sidebar.';
    if (role === 'DOCTOR' && /\bmedical records?\b/.test(q)) return 'Open Medical Records from the doctor sidebar.';
    if (role === 'ADMIN' && /\bsystem dashboard\b/.test(q)) return 'Open System Dashboard from the admin sidebar.';
    if (role === 'ADMIN' && /\bpatients?\b/.test(q)) return 'Open Patient Management from the admin sidebar.';
    if (role === 'ADMIN' && /\bdoctors?\b/.test(q)) return 'Open Doctor Management from the admin sidebar.';
    if (/\bhealth records?\b/.test(q)) return 'Open My Health Records from the sidebar.';
    if (/\bmedical history\b/.test(q)) return 'Open Medical History from the sidebar.';
    if (/\breports?\b/.test(q)) return 'Open My Reports (patient) or Reports (doctor) from the sidebar.';
    if (/\bappointments?\b/.test(q)) return 'Open My Appointments from the sidebar. Patients can also use Book Appointment or Find Doctors.';
    if (/\bnotifications?\b/.test(q)) return 'Open Notifications from the sidebar.';
    if (/\bmessages?\b/.test(q)) return 'Open Messages from the sidebar.';
  }

  return [
    'I can help with app navigation, appointment/notification summaries, and general health-information drafting.',
    'Try: "show doctor details", "summarize my dashboard", "what is my latest health record?", or "next appointment".',
  ].join('\n');
};

const tryGet = async (url) => {
  try {
    const res = await API.get(url);
    return { ok: true, data: res.data };
  } catch (error) {
    return { ok: false, error };
  }
};

const getNextAppointment = (appointments) => {
  const now = Date.now();
  return safeArray(appointments)
    .filter((a) => a?.dateTime)
    .filter((a) => new Date(a.dateTime).getTime() >= now)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0] || null;
};

const getLatestHealthRecord = (records) => {
  const sorted = [...safeArray(records)].sort((a, b) => {
    const aTime = new Date(a?.date || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.date || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });
  return sorted[0] || null;
};

const fetchAssistantContext = async (user) => {
  if (!user?.userId || !user?.role) return null;

  const role = String(user.role).toUpperCase();

  if (role === 'PATIENT') {
    const [apptRes, notifRes, recordsRes, historyRes, reportsRes, doctorsRes] = await Promise.all([
      tryGet(`/appointments/patient/${user.userId}`),
      tryGet(`/notifications/user/${user.userId}`),
      tryGet(`/health-records/patient/${user.userId}`),
      tryGet(`/medical-history/patient/${user.userId}`),
      tryGet('/reports'),
      tryGet('/doctors'),
    ]);
    const appointments = safeArray(apptRes.data);
    const notifications = safeArray(notifRes.data);
    const healthRecords = safeArray(recordsRes.data);
    const medicalHistory = safeArray(historyRes.data);
    const reports = safeArray(reportsRes.data);
    const doctors = safeArray(doctorsRes.data);
    return {
      myAppointments: appointments.length,
      scheduled: appointments.filter((a) => a.status === 'SCHEDULED').length,
      completed: appointments.filter((a) => a.status === 'COMPLETED').length,
      unreadNotifications: notifications.filter((n) => !n.isRead).length,
      reportCount: reports.length,
      nextAppointment: getNextAppointment(appointments),
      latestHealthRecord: getLatestHealthRecord(healthRecords),
      medicalHistoryConditions: medicalHistory
        .map((item) => item?.condition)
        .filter(Boolean),
      availableDoctors: doctors.map((doctor) => ({
        doctorId: doctor?.doctorId,
        name: doctor?.name,
        licenseNumber: doctor?.licenseNumber,
      })),
      contextSources: {
        appointments: apptRes.ok,
        notifications: notifRes.ok,
        healthRecords: recordsRes.ok,
        medicalHistory: historyRes.ok,
        reports: reportsRes.ok,
        doctors: doctorsRes.ok,
      },
    };
  }

  if (role === 'DOCTOR') {
    const [apptRes, notifRes, reportsRes, doctorsRes] = await Promise.all([
      tryGet(`/appointments/doctor/${user.userId}`),
      tryGet(`/notifications/user/${user.userId}`),
      tryGet(`/reports/user/${user.userId}`),
      tryGet('/doctors'),
    ]);
    const appointments = safeArray(apptRes.data);
    const notifications = safeArray(notifRes.data);
    const recentPatients = [];
    const seenPatients = new Set();
    appointments.forEach((appt) => {
      const patient = appt?.patient;
      if (patient?.patientId && !seenPatients.has(patient.patientId)) {
        seenPatients.add(patient.patientId);
        recentPatients.push(patient);
      }
    });
    return {
      myAppointments: appointments.length,
      scheduled: appointments.filter((a) => a.status === 'SCHEDULED').length,
      myPatients: new Set(appointments.map((a) => a.patient?.patientId)).size,
      unreadNotifications: notifications.filter((n) => !n.isRead).length,
      reportCount: safeArray(reportsRes.data).length,
      recentPatients,
      availableDoctors: safeArray(doctorsRes.data).map((doctor) => ({
        doctorId: doctor?.doctorId,
        name: doctor?.name,
        licenseNumber: doctor?.licenseNumber,
      })),
      contextSources: {
        appointments: apptRes.ok,
        notifications: notifRes.ok,
        reports: reportsRes.ok,
        doctors: doctorsRes.ok,
      },
    };
  }

  const [patientsRes, doctorsRes, appointmentsRes, notifRes, reportsRes] = await Promise.all([
    tryGet('/patients'),
    tryGet('/doctors'),
    tryGet('/appointments'),
    tryGet(`/notifications/user/${user.userId}`),
    tryGet('/reports'),
  ]);
  const patients = safeArray(patientsRes.data);
  const doctors = safeArray(doctorsRes.data);
  const appointments = safeArray(appointmentsRes.data);
  const notifications = safeArray(notifRes.data);
  const reports = safeArray(reportsRes.data);

  return {
    totalPatients: patients.length,
    totalDoctors: doctors.length,
    totalAppointments: appointments.length,
    unreadNotifications: notifications.filter((n) => !n.isRead).length,
    reportCount: reports.length,
    availableDoctors: doctors.map((doctor) => ({
      doctorId: doctor?.doctorId,
      name: doctor?.name,
      licenseNumber: doctor?.licenseNumber,
    })),
    contextSources: {
      patients: patientsRes.ok,
      doctors: doctorsRes.ok,
      appointments: appointmentsRes.ok,
      notifications: notifRes.ok,
      reports: reportsRes.ok,
    },
  };
};

const AIAssistant = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    createMessage(
      'assistant',
      'AI Assistant is ready. Ask about appointments, notifications, reports, or how to use this app.'
    ),
  ]);
  const [appContext, setAppContext] = useState(null);
  const [contextStatus, setContextStatus] = useState('loading');
  const messagesRef = useRef(null);
  const quickPrompts = useMemo(() => getQuickPrompts(user?.role), [user?.role]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    let ignore = false;

    const loadContext = async () => {
      if (!user) {
        if (!ignore) {
          setAppContext(null);
          setContextStatus('idle');
        }
        return;
      }

      if (!ignore) setContextStatus('loading');
      try {
        const data = await fetchAssistantContext(user);
        if (!ignore) {
          setAppContext(data);
          setContextStatus('ready');
        }
      } catch (error) {
        if (!ignore) {
          setAppContext(null);
          setContextStatus('error');
        }
        console.error('Assistant context load failed', error);
      }
    };

    loadContext();
    return () => {
      ignore = true;
    };
  }, [user]);

  if (!user) return null;

  const sendQuestion = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMessage = createMessage('user', question);
    const historySnapshot = [...messages, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let latestContext = appContext;
    let answerText = '';

    try {
      try {
        const freshContext = await fetchAssistantContext(user);
        latestContext = freshContext;
        setAppContext(freshContext);
        setContextStatus('ready');
      } catch (contextError) {
        setContextStatus((prev) => (prev === 'ready' ? 'ready' : 'error'));
        console.warn('Using cached assistant context.', contextError);
      }

      const aiMessages = historySnapshot.map((message, index) => ({
        role: message.role,
        content:
          index === historySnapshot.length - 1 && message.role === 'user'
            ? buildQuestionWithContext({
                question: message.text,
                context: latestContext,
                user,
              })
            : message.text,
      }));

      answerText = await sendAssistantMessage({ messages: aiMessages, user });
    } catch (error) {
      console.warn('Gemini request failed, using local fallback.', error);
      answerText = localAssistantAnswer({ question, context: latestContext, user });
    } finally {
      setMessages((prev) => [
        ...prev,
        createMessage(
          'assistant',
          String(answerText || 'Sorry, something went wrong while generating a response.')
        ),
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>AI Assistant</h1>
        <p>
          Frontend Gemini assistant for app guidance and health-information drafting.
          Do not use this for emergencies.
        </p>
      </div>

      <section className="data-card" aria-label="AI Assistant">
        <div
          className="data-card-header"
          style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
        >
          <div>
            <h3>Assistant Chat</h3>
            <p style={{ margin: '4px 0 0', opacity: 0.85 }}>
              {contextStatus === 'ready' && 'Live app context loaded'}
              {contextStatus === 'loading' && 'Loading live app context...'}
              {contextStatus === 'error' && 'Live context unavailable (chat still works)'}
            </p>
            {contextStatus === 'ready' && appContext?.contextSources && (
              <p style={{ margin: '4px 0 0', opacity: 0.65, fontSize: 12 }}>
                Data sources: {Object.entries(appContext.contextSources)
                  .map(([key, ok]) => `${key}:${ok ? 'ok' : 'off'}`)
                  .join(' | ')}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setMessages([
                createMessage(
                  'assistant',
                  'AI Assistant is ready. Ask about appointments, notifications, reports, or how to use this app.'
                ),
              ])
            }
            disabled={isLoading}
          >
            Clear Chat
          </button>
        </div>

        <div
          ref={messagesRef}
          style={{
            maxHeight: 420,
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  whiteSpace: 'pre-wrap',
                  background:
                    message.role === 'user'
                      ? 'rgba(79, 70, 229, 0.2)'
                      : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {message.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {quickPrompts.map((prompt) => (
            <button
              type="button"
              key={prompt}
              className="btn btn-secondary"
              onClick={() => setInput(prompt)}
              disabled={isLoading}
              style={{ padding: '6px 10px' }}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            rows={3}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendQuestion();
              }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={sendQuestion}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AIAssistant;
