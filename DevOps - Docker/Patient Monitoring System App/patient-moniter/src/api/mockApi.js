const DB_KEY = 'patient_monitor_mock_db_v1';
const TOKEN_PREFIX = 'mock-token-';

const asArray = (value) => (Array.isArray(value) ? value : []);

const normalizeRole = (role) => String(role || 'PATIENT').toUpperCase().replace(/^ROLE_/, '');

const clone = (value) => JSON.parse(JSON.stringify(value));

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : String(value);
};

const nowIso = () => new Date().toISOString();

const hasLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const createSeedDatabase = () => {
  const now = Date.now();
  const tomorrow = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const users = [
    {
      userId: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: 'password123',
      role: 'PATIENT',
    },
    {
      userId: 2,
      name: 'Dr. Smith',
      email: 'dr.smith@healthcare.com',
      password: 'password123',
      role: 'DOCTOR',
    },
    {
      userId: 3,
      name: 'System Admin',
      email: 'admin@healthcare.com',
      password: 'admin123',
      role: 'ADMIN',
    },
  ];

  const patients = [
    {
      patientId: 1,
      userId: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      dateOfBirth: '1990-05-15',
      contactNumber: '+1-555-1010',
      emergencyContact: '+1-555-1011',
    },
  ];

  const doctors = [
    {
      doctorId: 2,
      userId: 2,
      name: 'Dr. Smith',
      email: 'dr.smith@healthcare.com',
      licenseNumber: 'MED-2024-001',
      contactNumber: '+1-555-2020',
      specialization: 'General Medicine',
    },
  ];

  const appointments = [
    {
      appointmentId: 1,
      patientId: 1,
      doctorId: 2,
      patient: clone(patients[0]),
      doctor: clone(doctors[0]),
      dateTime: tomorrow,
      reason: 'Follow-up checkup',
      status: 'SCHEDULED',
    },
  ];

  const notifications = [
    {
      notificationId: 1,
      userId: 1,
      type: 'APPOINTMENT_REMINDER',
      message: 'You have an appointment scheduled for tomorrow.',
      isRead: false,
      createdAt: nowIso(),
    },
    {
      notificationId: 2,
      userId: 2,
      type: 'APPOINTMENT_REQUEST',
      message: 'A patient booked an appointment with you.',
      isRead: false,
      createdAt: nowIso(),
    },
  ];

  const healthRecords = [
    {
      recordId: 1,
      patientId: 1,
      patient: clone(patients[0]),
      heartRate: 74,
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 78,
      oxygenLevel: 98,
      temperature: 98.4,
      notes: 'Vitals stable',
      date: yesterday,
      createdAt: yesterday,
    },
  ];

  const medicalHistory = [
    {
      historyId: 1,
      patientId: 1,
      condition: 'Mild Hypertension',
      diagnosisDate: '2024-03-10',
      details: 'Controlled with diet and exercise.',
    },
  ];

  const consultations = [
    {
      consultationId: 1,
      appointmentId: 1,
      appointment: clone(appointments[0]),
      summary: 'Patient is recovering well.',
      advice: 'Continue medication and routine exercise.',
      prescription: 'Vitamin D 1000 IU daily',
      followUpDate: '',
      createdAt: yesterday,
    },
  ];

  const reports = [
    {
      reportId: 1,
      userId: 1,
      reportType: 'Health Summary',
      fileUrl: 'health-summary-john-doe.pdf',
      createdAt: nowIso(),
    },
    {
      reportId: 2,
      userId: 2,
      reportType: 'Doctor Activity',
      fileUrl: 'doctor-activity-dr-smith.pdf',
      createdAt: nowIso(),
    },
  ];

  const messages = [
    {
      messageId: 1,
      sender: { userId: 1, email: 'john.doe@email.com' },
      receiver: { userId: 2, email: 'dr.smith@healthcare.com' },
      content: 'Hello doctor, I have a question about my prescription.',
      sentAt: nowIso(),
    },
  ];

  return {
    nextIds: {
      userId: 4,
      patientId: 2,
      doctorId: 3,
      appointmentId: 2,
      notificationId: 3,
      recordId: 2,
      historyId: 2,
      consultationId: 2,
      reportId: 3,
      messageId: 2,
    },
    users,
    patients,
    doctors,
    appointments,
    notifications,
    healthRecords,
    medicalHistory,
    consultations,
    reports,
    messages,
  };
};

const ensureDatabase = (value) => {
  const seed = createSeedDatabase();
  const db = value && typeof value === 'object' ? value : {};

  return {
    nextIds: {
      ...seed.nextIds,
      ...(db.nextIds || {}),
    },
    users: asArray(db.users).length ? asArray(db.users) : seed.users,
    patients: asArray(db.patients).length ? asArray(db.patients) : seed.patients,
    doctors: asArray(db.doctors).length ? asArray(db.doctors) : seed.doctors,
    appointments: asArray(db.appointments).length ? asArray(db.appointments) : seed.appointments,
    notifications: asArray(db.notifications).length ? asArray(db.notifications) : seed.notifications,
    healthRecords: asArray(db.healthRecords).length ? asArray(db.healthRecords) : seed.healthRecords,
    medicalHistory: asArray(db.medicalHistory).length ? asArray(db.medicalHistory) : seed.medicalHistory,
    consultations: asArray(db.consultations).length ? asArray(db.consultations) : seed.consultations,
    reports: asArray(db.reports).length ? asArray(db.reports) : seed.reports,
    messages: asArray(db.messages).length ? asArray(db.messages) : seed.messages,
  };
};

const readDatabase = () => {
  if (!hasLocalStorage()) return createSeedDatabase();
  const raw = window.localStorage.getItem(DB_KEY);
  const parsed = raw ? safeParse(raw, null) : null;
  const db = ensureDatabase(parsed);
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
};

const writeDatabase = (db) => {
  if (!hasLocalStorage()) return;
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const nextId = (db, key) => {
  const value = Number(db.nextIds[key] || 1);
  db.nextIds[key] = value + 1;
  return value;
};

const toPath = (url = '') => {
  const raw = String(url || '');
  let value = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      value = `${parsed.pathname}${parsed.search}`;
    } catch {
      value = raw;
    }
  }

  const [pathPart] = value.split('?');
  let path = pathPart || '/';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.startsWith('/api/')) path = path.slice(4);
  if (path === '/api') path = '/';
  return { path };
};

const parseBody = (payload) => {
  if (!payload) return {};
  if (typeof payload === 'string') return safeParse(payload, {});
  if (typeof payload === 'object') return payload;
  return {};
};

const toStatusText = (status) => {
  if (status === 200) return 'OK';
  if (status === 201) return 'Created';
  if (status === 400) return 'Bad Request';
  if (status === 401) return 'Unauthorized';
  if (status === 404) return 'Not Found';
  if (status === 409) return 'Conflict';
  return 'OK';
};

const response = (config, data, status = 200) => Promise.resolve({
  data,
  status,
  statusText: toStatusText(status),
  headers: {},
  config,
});

const responseError = (config, status, message) => {
  const error = new Error(message);
  error.config = config;
  error.response = {
    data: { error: message },
    status,
    statusText: toStatusText(status),
    headers: {},
    config,
  };
  return Promise.reject(error);
};

const getToken = (config) => {
  const headers = config?.headers || {};
  const authHeader = headers.Authorization || headers.authorization || '';
  const parts = String(authHeader).split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return '';
  return parts[1];
};

const getAuthUser = (db, config) => {
  const token = getToken(config);
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const userId = Number(token.slice(TOKEN_PREFIX.length));
  if (!Number.isFinite(userId)) return null;
  return db.users.find((item) => item.userId === userId) || null;
};

const buildAuthPayload = (user) => ({
  token: `${TOKEN_PREFIX}${user.userId}`,
  userId: user.userId,
  email: user.email,
  role: normalizeRole(user.role),
  name: user.name,
  user: {
    userId: user.userId,
    email: user.email,
    role: normalizeRole(user.role),
    name: user.name,
  },
});

const patientSnapshot = (patient) => ({
  patientId: patient.patientId,
  userId: patient.userId,
  name: patient.name,
  email: patient.email,
  dateOfBirth: patient.dateOfBirth || '',
  contactNumber: patient.contactNumber || '',
  emergencyContact: patient.emergencyContact || '',
});

const doctorSnapshot = (doctor) => ({
  doctorId: doctor.doctorId,
  userId: doctor.userId,
  name: doctor.name,
  email: doctor.email,
  licenseNumber: doctor.licenseNumber || '',
  contactNumber: doctor.contactNumber || '',
  specialization: doctor.specialization || '',
});

const syncLinkedRecords = (db) => {
  db.appointments = db.appointments.map((appointment) => {
    const patient = db.patients.find((item) => item.patientId === appointment.patientId);
    const doctor = db.doctors.find((item) => item.doctorId === appointment.doctorId);
    return {
      ...appointment,
      patient: patient ? patientSnapshot(patient) : appointment.patient,
      doctor: doctor ? doctorSnapshot(doctor) : appointment.doctor,
    };
  });

  db.messages = db.messages.map((message) => {
    const senderUser = db.users.find((item) => item.userId === message.sender?.userId);
    const receiverUser = db.users.find((item) => item.userId === message.receiver?.userId);
    return {
      ...message,
      sender: senderUser
        ? { userId: senderUser.userId, email: senderUser.email }
        : message.sender,
      receiver: receiverUser
        ? { userId: receiverUser.userId, email: receiverUser.email }
        : message.receiver,
    };
  });
};

const createNotification = (db, userId, type, message) => {
  db.notifications.unshift({
    notificationId: nextId(db, 'notificationId'),
    userId,
    type,
    message,
    isRead: false,
    createdAt: nowIso(),
  });
};

const handleAuthRoutes = ({ config, db, method, path, body }) => {
  if (method === 'POST' && path === '/auth/login') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = db.users.find((item) => item.email.toLowerCase() === email);
    if (!user || user.password !== password) {
      return responseError(config, 400, 'Invalid email or password');
    }
    return response(config, buildAuthPayload(user), 200);
  }

  if (method === 'POST' && path === '/auth/register') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    const role = normalizeRole(body.role || 'PATIENT');

    if (!email || !password || !name) {
      return responseError(config, 400, 'Name, email, and password are required');
    }
    if (password.length < 6) {
      return responseError(config, 400, 'Password must be at least 6 characters');
    }
    const duplicate = db.users.some((item) => item.email.toLowerCase() === email);
    if (duplicate) {
      return responseError(config, 409, 'Email already exists');
    }

    const userId = nextId(db, 'userId');
    const user = { userId, email, password, name, role };
    db.users.push(user);

    if (role === 'PATIENT') {
      db.patients.push({
        patientId: userId,
        userId,
        name,
        email,
        dateOfBirth: body.dateOfBirth || '',
        contactNumber: body.contactNumber || '',
        emergencyContact: body.emergencyContact || '',
      });
      createNotification(db, userId, 'WELCOME_PATIENT', `Welcome ${name}, your patient account is ready.`);
    } else if (role === 'DOCTOR') {
      db.doctors.push({
        doctorId: userId,
        userId,
        name,
        email,
        licenseNumber: body.licenseNumber || '',
        contactNumber: body.contactNumber || '',
        specialization: body.specialization || '',
      });
      createNotification(db, userId, 'WELCOME_DOCTOR', `Welcome ${name}, your doctor account is ready.`);
    } else {
      createNotification(db, userId, 'WELCOME_USER', `Welcome ${name}.`);
    }

    syncLinkedRecords(db);
    writeDatabase(db);
    return response(config, { data: buildAuthPayload(user) }, 201);
  }

  return null;
};

const handlePatientRoutes = ({ config, db, method, path, body }) => {
  if (method === 'GET' && path === '/patients') {
    return response(config, clone(db.patients), 200);
  }

  if (method === 'POST' && path === '/patients') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    if (!email || !password || !name) {
      return responseError(config, 400, 'Name, email, and password are required');
    }
    const duplicate = db.users.some((item) => item.email.toLowerCase() === email);
    if (duplicate) return responseError(config, 409, 'Email already exists');

    const userId = nextId(db, 'userId');
    db.users.push({
      userId,
      email,
      password,
      name,
      role: 'PATIENT',
    });

    const patient = {
      patientId: userId,
      userId,
      name,
      email,
      dateOfBirth: body.dateOfBirth || '',
      contactNumber: body.contactNumber || '',
      emergencyContact: body.emergencyContact || '',
    };
    db.patients.push(patient);
    createNotification(db, userId, 'ACCOUNT_CREATED', 'Your patient account was created by admin.');
    syncLinkedRecords(db);
    writeDatabase(db);
    return response(config, patientSnapshot(patient), 201);
  }

  if (method === 'GET' && path === '/patients/me') {
    const authUser = getAuthUser(db, config);
    const patient = db.patients.find((item) => item.userId === authUser?.userId);
    if (!patient) return responseError(config, 404, 'Patient profile not found');
    return response(config, patientSnapshot(patient), 200);
  }

  const userMatch = path.match(/^\/patients\/user\/([^/]+)$/);
  if (method === 'GET' && userMatch) {
    const userId = toId(userMatch[1]);
    const patient = db.patients.find((item) => toId(item.userId) === userId);
    if (!patient) return responseError(config, 404, 'Patient not found');
    return response(config, patientSnapshot(patient), 200);
  }

  const idMatch = path.match(/^\/patients\/([^/]+)$/);
  if (!idMatch) return null;

  const patientId = toId(idMatch[1]);
  const patientIndex = db.patients.findIndex((item) => toId(item.patientId) === patientId);
  if (patientIndex < 0) return responseError(config, 404, 'Patient not found');

  if (method === 'GET') {
    return response(config, patientSnapshot(db.patients[patientIndex]), 200);
  }

  if (method === 'PUT' || method === 'PATCH') {
    db.patients[patientIndex] = {
      ...db.patients[patientIndex],
      ...body,
      patientId: db.patients[patientIndex].patientId,
      userId: db.patients[patientIndex].userId,
      email: body.email ? String(body.email).trim().toLowerCase() : db.patients[patientIndex].email,
    };
    const user = db.users.find((item) => item.userId === db.patients[patientIndex].userId);
    if (user) {
      user.name = db.patients[patientIndex].name || user.name;
      user.email = db.patients[patientIndex].email || user.email;
    }
    syncLinkedRecords(db);
    writeDatabase(db);
    return response(config, patientSnapshot(db.patients[patientIndex]), 200);
  }

  if (method === 'DELETE') {
    const [patient] = db.patients.splice(patientIndex, 1);
    db.users = db.users.filter((item) => item.userId !== patient.userId);
    db.appointments = db.appointments.filter((item) => item.patientId !== patient.patientId);
    db.healthRecords = db.healthRecords.filter((item) => item.patientId !== patient.patientId);
    db.medicalHistory = db.medicalHistory.filter((item) => item.patientId !== patient.patientId);
    syncLinkedRecords(db);
    writeDatabase(db);
    return response(config, { success: true }, 200);
  }

  return null;
};

const handleDoctorRoutes = ({ config, db, method, path, body }) => {
  if (method === 'GET' && path === '/doctors') {
    return response(config, clone(db.doctors), 200);
  }

  if (method === 'POST' && path === '/doctors') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    if (!email || !password || !name) {
      return responseError(config, 400, 'Name, email, and password are required');
    }
    const duplicate = db.users.some((item) => item.email.toLowerCase() === email);
    if (duplicate) return responseError(config, 409, 'Email already exists');

    const userId = nextId(db, 'userId');
    db.users.push({
      userId,
      email,
      password,
      name,
      role: 'DOCTOR',
    });

    const doctor = {
      doctorId: userId,
      userId,
      name,
      email,
      licenseNumber: body.licenseNumber || '',
      contactNumber: body.contactNumber || '',
      specialization: body.specialization || '',
    };
    db.doctors.push(doctor);
    createNotification(db, userId, 'ACCOUNT_CREATED', 'Your doctor account was created by admin.');
    syncLinkedRecords(db);
    writeDatabase(db);
    return response(config, doctorSnapshot(doctor), 201);
  }

  if (method === 'GET' && path === '/doctors/me') {
    const authUser = getAuthUser(db, config);
    const doctor = db.doctors.find((item) => item.userId === authUser?.userId);
    if (!doctor) return responseError(config, 404, 'Doctor profile not found');
    return response(config, doctorSnapshot(doctor), 200);
  }

  const userMatch = path.match(/^\/doctors\/user\/([^/]+)$/);
  if (method === 'GET' && userMatch) {
    const userId = toId(userMatch[1]);
    const doctor = db.doctors.find((item) => toId(item.userId) === userId);
    if (!doctor) return responseError(config, 404, 'Doctor not found');
    return response(config, doctorSnapshot(doctor), 200);
  }

  const idMatch = path.match(/^\/doctors\/([^/]+)$/);
  if (!idMatch) return null;

  const doctorId = toId(idMatch[1]);
  const doctorIndex = db.doctors.findIndex((item) => toId(item.doctorId) === doctorId);
  if (doctorIndex < 0) return responseError(config, 404, 'Doctor not found');

  if (method === 'GET') {
    return response(config, doctorSnapshot(db.doctors[doctorIndex]), 200);
  }

  if (method === 'PUT' || method === 'PATCH') {
    db.doctors[doctorIndex] = {
      ...db.doctors[doctorIndex],
      ...body,
      doctorId: db.doctors[doctorIndex].doctorId,
      userId: db.doctors[doctorIndex].userId,
      email: body.email ? String(body.email).trim().toLowerCase() : db.doctors[doctorIndex].email,
    };
    const user = db.users.find((item) => item.userId === db.doctors[doctorIndex].userId);
    if (user) {
      user.name = db.doctors[doctorIndex].name || user.name;
      user.email = db.doctors[doctorIndex].email || user.email;
    }
    syncLinkedRecords(db);
    writeDatabase(db);
    return response(config, doctorSnapshot(db.doctors[doctorIndex]), 200);
  }

  if (method === 'DELETE') {
    const [doctor] = db.doctors.splice(doctorIndex, 1);
    db.users = db.users.filter((item) => item.userId !== doctor.userId);
    db.appointments = db.appointments.filter((item) => item.doctorId !== doctor.doctorId);
    syncLinkedRecords(db);
    writeDatabase(db);
    return response(config, { success: true }, 200);
  }

  return null;
};

const handleAppointmentRoutes = ({ config, db, method, path, body }) => {
  if (method === 'GET' && path === '/appointments') {
    const list = clone(db.appointments).sort((a, b) => new Date(b.dateTime || 0) - new Date(a.dateTime || 0));
    return response(config, list, 200);
  }

  if (method === 'POST' && path === '/appointments') {
    const doctorId = toId(body.doctorId);
    const patientId = toId(body.patientId);
    const doctor = db.doctors.find((item) => toId(item.doctorId) === doctorId);
    const patient = db.patients.find((item) => toId(item.patientId) === patientId);

    if (!doctor || !patient) return responseError(config, 400, 'Invalid doctor or patient');
    if (!body.dateTime || !body.reason) return responseError(config, 400, 'Date/time and reason are required');

    const appointment = {
      appointmentId: nextId(db, 'appointmentId'),
      doctorId: doctor.doctorId,
      patientId: patient.patientId,
      doctor: doctorSnapshot(doctor),
      patient: patientSnapshot(patient),
      dateTime: body.dateTime,
      reason: String(body.reason).trim(),
      status: 'SCHEDULED',
    };
    db.appointments.push(appointment);
    createNotification(db, doctor.userId, 'APPOINTMENT_REQUEST', `${patient.name} booked an appointment.`);
    createNotification(db, patient.userId, 'APPOINTMENT_BOOKED', `Appointment booked with ${doctor.name}.`);
    writeDatabase(db);
    return response(config, appointment, 201);
  }

  const patientMatch = path.match(/^\/appointments\/patient\/([^/]+)$/);
  if (method === 'GET' && patientMatch) {
    const patientId = toId(patientMatch[1]);
    const list = db.appointments.filter((item) => toId(item.patientId) === patientId);
    return response(config, clone(list), 200);
  }

  const doctorMatch = path.match(/^\/appointments\/doctor\/([^/]+)$/);
  if (method === 'GET' && doctorMatch) {
    const doctorId = toId(doctorMatch[1]);
    const list = db.appointments.filter((item) => toId(item.doctorId) === doctorId);
    return response(config, clone(list), 200);
  }

  const statusMatch = path.match(/^\/appointments\/([^/]+)\/status$/);
  if (method === 'PUT' && statusMatch) {
    const appointmentId = toId(statusMatch[1]);
    const status = String(body.status || '').toUpperCase();
    const allowed = new Set(['SCHEDULED', 'COMPLETED', 'CANCELLED']);
    if (!allowed.has(status)) return responseError(config, 400, 'Invalid status');

    const index = db.appointments.findIndex((item) => toId(item.appointmentId) === appointmentId);
    if (index < 0) return responseError(config, 404, 'Appointment not found');

    db.appointments[index].status = status;
    const appointment = db.appointments[index];
    if (appointment.patient?.userId) {
      createNotification(
        db,
        appointment.patient.userId,
        'APPOINTMENT_STATUS',
        `Your appointment is now ${status}.`
      );
    }
    if (appointment.doctor?.userId) {
      createNotification(
        db,
        appointment.doctor.userId,
        'APPOINTMENT_STATUS',
        `Appointment with ${appointment.patient?.name || 'patient'} is now ${status}.`
      );
    }
    writeDatabase(db);
    return response(config, clone(db.appointments[index]), 200);
  }

  return null;
};

const handleNotificationRoutes = ({ config, db, method, path }) => {
  const userMatch = path.match(/^\/notifications\/user\/([^/]+)$/);
  if (method === 'GET' && userMatch) {
    const userId = toId(userMatch[1]);
    const list = db.notifications
      .filter((item) => toId(item.userId) === userId)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return response(config, clone(list), 200);
  }

  const readMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (method === 'PUT' && readMatch) {
    const notificationId = toId(readMatch[1]);
    const index = db.notifications.findIndex((item) => toId(item.notificationId) === notificationId);
    if (index < 0) return responseError(config, 404, 'Notification not found');
    db.notifications[index].isRead = true;
    writeDatabase(db);
    return response(config, clone(db.notifications[index]), 200);
  }

  return null;
};

const handleMessageRoutes = ({ config, db, method, path, body }) => {
  const listMatch = path.match(/^\/messages\/user\/([^/]+)$/);
  if (method === 'GET' && listMatch) {
    const userId = toId(listMatch[1]);
    const list = db.messages
      .filter((item) => toId(item.sender?.userId) === userId || toId(item.receiver?.userId) === userId)
      .sort((a, b) => new Date(b.sentAt || 0) - new Date(a.sentAt || 0));
    return response(config, clone(list), 200);
  }

  const conversationMatch = path.match(/^\/messages\/conversation\/([^/]+)\/([^/]+)$/);
  if (method === 'GET' && conversationMatch) {
    const firstUserId = toId(conversationMatch[1]);
    const secondUserId = toId(conversationMatch[2]);
    const list = db.messages
      .filter((item) => (
        (toId(item.sender?.userId) === firstUserId && toId(item.receiver?.userId) === secondUserId) ||
        (toId(item.sender?.userId) === secondUserId && toId(item.receiver?.userId) === firstUserId)
      ))
      .sort((a, b) => new Date(a.sentAt || 0) - new Date(b.sentAt || 0));
    return response(config, clone(list), 200);
  }

  if (method === 'POST' && path === '/messages') {
    const senderId = toId(body.senderId);
    const receiverId = toId(body.receiverId);
    const content = String(body.content || '').trim();
    if (!senderId || !receiverId || !content) return responseError(config, 400, 'Invalid message payload');
    const sender = db.users.find((item) => toId(item.userId) === senderId);
    const receiver = db.users.find((item) => toId(item.userId) === receiverId);
    if (!sender || !receiver) return responseError(config, 404, 'User not found');

    const message = {
      messageId: nextId(db, 'messageId'),
      sender: { userId: sender.userId, email: sender.email },
      receiver: { userId: receiver.userId, email: receiver.email },
      content,
      sentAt: nowIso(),
    };
    db.messages.push(message);
    createNotification(db, receiver.userId, 'MESSAGE_RECEIVED', `New message from ${sender.email}`);
    writeDatabase(db);
    return response(config, message, 201);
  }

  return null;
};

const handleHealthRecordRoutes = ({ config, db, method, path }) => {
  if (method === 'GET' && path === '/health-records') {
    return response(config, clone(db.healthRecords), 200);
  }

  const byPatientMatch = path.match(/^\/health-records\/patient\/([^/]+)$/);
  if (method === 'GET' && byPatientMatch) {
    const patientId = toId(byPatientMatch[1]);
    const list = db.healthRecords
      .filter((item) => toId(item.patientId) === patientId)
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
    return response(config, clone(list), 200);
  }

  return null;
};

const handleMedicalHistoryRoutes = ({ config, db, method, path }) => {
  const byPatientMatch = path.match(/^\/medical-history\/patient\/([^/]+)$/);
  if (method === 'GET' && byPatientMatch) {
    const patientId = toId(byPatientMatch[1]);
    const list = db.medicalHistory
      .filter((item) => toId(item.patientId) === patientId)
      .sort((a, b) => new Date(b.diagnosisDate || 0) - new Date(a.diagnosisDate || 0));
    return response(config, clone(list), 200);
  }
  return null;
};

const handleConsultationRoutes = ({ config, db, method, path, body }) => {
  if (method === 'GET' && path === '/consultations') {
    return response(config, clone(db.consultations), 200);
  }

  const appointmentRouteMatch = path.match(/^\/consultations\/appointment\/([^/]+)$/);
  const isConsultationCreate = method === 'POST' && (path === '/consultations' || !!appointmentRouteMatch);
  if (!isConsultationCreate) return null;

  const appointmentId = toId(body.appointmentId || appointmentRouteMatch?.[1]);
  const appointment = db.appointments.find((item) => toId(item.appointmentId) === appointmentId);
  if (!appointment) return responseError(config, 404, 'Appointment not found');

  const consultation = {
    consultationId: nextId(db, 'consultationId'),
    appointmentId: appointment.appointmentId,
    appointment: clone(appointment),
    summary: String(body.summary || body.advice || '').trim(),
    advice: String(body.advice || body.summary || '').trim(),
    prescription: String(body.prescription || '').trim(),
    followUpDate: body.followUpDate || '',
    createdAt: nowIso(),
  };
  db.consultations.unshift(consultation);

  const report = {
    reportId: nextId(db, 'reportId'),
    userId: appointment.doctor?.userId || appointment.doctorId,
    reportType: 'Consultation Report',
    fileUrl: `consultation-${consultation.consultationId}.pdf`,
    createdAt: nowIso(),
  };
  db.reports.unshift(report);
  writeDatabase(db);
  return response(config, clone(consultation), 201);
};

const handleReportRoutes = ({ config, db, method, path }) => {
  if (method === 'GET' && path === '/reports') {
    return response(config, clone(db.reports), 200);
  }

  const userMatch = path.match(/^\/reports\/user\/([^/]+)$/);
  if (method === 'GET' && userMatch) {
    const userId = toId(userMatch[1]);
    const list = db.reports.filter((item) => toId(item.userId) === userId);
    return response(config, clone(list), 200);
  }

  return null;
};

const handleUserRoutes = ({ config, db, method, path }) => {
  const match = path.match(/^\/users\/([^/]+)$/);
  if (!match || method !== 'DELETE') return null;

  const userId = toId(match[1]);
  const user = db.users.find((item) => toId(item.userId) === userId);
  if (!user) return responseError(config, 404, 'User not found');

  db.users = db.users.filter((item) => toId(item.userId) !== userId);
  db.patients = db.patients.filter((item) => toId(item.userId) !== userId);
  db.doctors = db.doctors.filter((item) => toId(item.userId) !== userId);
  db.notifications = db.notifications.filter((item) => toId(item.userId) !== userId);
  db.messages = db.messages.filter((item) => (
    toId(item.sender?.userId) !== userId && toId(item.receiver?.userId) !== userId
  ));
  writeDatabase(db);
  return response(config, { success: true }, 200);
};

export const mockApiAdapter = async (config) => {
  const db = readDatabase();
  const method = String(config?.method || 'GET').toUpperCase();
  const { path } = toPath(config?.url || '');
  const body = parseBody(config?.data);

  const context = {
    config,
    db,
    method,
    path,
    body,
  };

  const handlers = [
    handleAuthRoutes,
    handlePatientRoutes,
    handleDoctorRoutes,
    handleAppointmentRoutes,
    handleNotificationRoutes,
    handleMessageRoutes,
    handleHealthRecordRoutes,
    handleMedicalHistoryRoutes,
    handleConsultationRoutes,
    handleReportRoutes,
    handleUserRoutes,
  ];

  for (let index = 0; index < handlers.length; index += 1) {
    const result = handlers[index](context);
    if (result) return result;
  }

  return responseError(config, 404, `Mock endpoint not found: ${method} ${path}`);
};

export const isMockApiForced = () =>
  String(process.env.REACT_APP_USE_MOCK_API || '').trim().toLowerCase() === 'true';

export const shouldUseMockFallback = (error) => {
  const enabled = String(process.env.REACT_APP_ENABLE_MOCK_FALLBACK || 'true').trim().toLowerCase() !== 'false';
  if (!enabled) return false;

  const status = error?.response?.status;
  const requestPath = toPath(error?.config?.url || '').path;
  const isAuthRoute = /^\/auth\/(login|register)$/i.test(requestPath);

  if (!error?.response) return true;
  if (status === 404) return true;
  if ((status === 400 || status === 401 || status === 409) && isAuthRoute) return false;
  return false;
};

export const resetMockDatabase = () => {
  writeDatabase(createSeedDatabase());
};
