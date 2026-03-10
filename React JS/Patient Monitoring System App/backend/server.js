const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mysql = require("mysql2/promise");

const TOKEN_PREFIX = "mock-token-";

const app = express();
const port = Number(process.env.PORT || 8080);

const mysqlConfig = {
  host: process.env.DB_HOST || "mysql",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "patient_user",
  password: process.env.DB_PASSWORD || "patient_pass",
  database: process.env.DB_NAME || "patient_monitor",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let mysqlPool = null;
let mysqlReady = false;
let persistTimer = null;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const clone = (value) => JSON.parse(JSON.stringify(value));
const asArray = (value) => (Array.isArray(value) ? value : []);
const nowIso = () => new Date().toISOString();
const normalizeRole = (role) =>
  String(role || "PATIENT").toUpperCase().replace(/^ROLE_/, "");

const toId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : String(value);
};

const patientSnapshot = (patient) => ({
  patientId: patient.patientId,
  userId: patient.userId,
  name: patient.name,
  email: patient.email,
  dateOfBirth: patient.dateOfBirth || "",
  contactNumber: patient.contactNumber || "",
  emergencyContact: patient.emergencyContact || "",
});

const doctorSnapshot = (doctor) => ({
  doctorId: doctor.doctorId,
  userId: doctor.userId,
  name: doctor.name,
  email: doctor.email,
  licenseNumber: doctor.licenseNumber || "",
  contactNumber: doctor.contactNumber || "",
  specialization: doctor.specialization || "",
});

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

const createSeedDatabase = () => {
  const now = Date.now();
  const tomorrow = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const users = [
    {
      userId: 1,
      name: "John Doe",
      email: "john.doe@email.com",
      password: "password123",
      role: "PATIENT",
    },
    {
      userId: 2,
      name: "Dr. Smith",
      email: "dr.smith@healthcare.com",
      password: "password123",
      role: "DOCTOR",
    },
    {
      userId: 3,
      name: "System Admin",
      email: "admin@healthcare.com",
      password: "admin123",
      role: "ADMIN",
    },
  ];

  const patients = [
    {
      patientId: 1,
      userId: 1,
      name: "John Doe",
      email: "john.doe@email.com",
      dateOfBirth: "1990-05-15",
      contactNumber: "+1-555-1010",
      emergencyContact: "+1-555-1011",
    },
  ];

  const doctors = [
    {
      doctorId: 2,
      userId: 2,
      name: "Dr. Smith",
      email: "dr.smith@healthcare.com",
      licenseNumber: "MED-2024-001",
      contactNumber: "+1-555-2020",
      specialization: "General Medicine",
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
      reason: "Follow-up checkup",
      status: "SCHEDULED",
    },
  ];

  const notifications = [
    {
      notificationId: 1,
      userId: 1,
      type: "APPOINTMENT_REMINDER",
      message: "You have an appointment scheduled for tomorrow.",
      isRead: false,
      createdAt: nowIso(),
    },
    {
      notificationId: 2,
      userId: 2,
      type: "APPOINTMENT_REQUEST",
      message: "A patient booked an appointment with you.",
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
      notes: "Vitals stable",
      date: yesterday,
      createdAt: yesterday,
    },
  ];

  const medicalHistory = [
    {
      historyId: 1,
      patientId: 1,
      condition: "Mild Hypertension",
      diagnosisDate: "2024-03-10",
      details: "Controlled with diet and exercise.",
    },
  ];

  const consultations = [
    {
      consultationId: 1,
      appointmentId: 1,
      appointment: clone(appointments[0]),
      summary: "Patient is recovering well.",
      advice: "Continue medication and routine exercise.",
      prescription: "Vitamin D 1000 IU daily",
      followUpDate: "",
      createdAt: yesterday,
    },
  ];

  const reports = [
    {
      reportId: 1,
      userId: 1,
      reportType: "Health Summary",
      fileUrl: "health-summary-john-doe.pdf",
      createdAt: nowIso(),
    },
    {
      reportId: 2,
      userId: 2,
      reportType: "Doctor Activity",
      fileUrl: "doctor-activity-dr-smith.pdf",
      createdAt: nowIso(),
    },
  ];

  const messages = [
    {
      messageId: 1,
      sender: { userId: 1, email: "john.doe@email.com" },
      receiver: { userId: 2, email: "dr.smith@healthcare.com" },
      content: "Hello doctor, I have a question about my prescription.",
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
  const parsed = value && typeof value === "object" ? value : {};
  return {
    nextIds: { ...seed.nextIds, ...(parsed.nextIds || {}) },
    users: asArray(parsed.users).length ? asArray(parsed.users) : seed.users,
    patients: asArray(parsed.patients).length ? asArray(parsed.patients) : seed.patients,
    doctors: asArray(parsed.doctors).length ? asArray(parsed.doctors) : seed.doctors,
    appointments: asArray(parsed.appointments).length
      ? asArray(parsed.appointments)
      : seed.appointments,
    notifications: asArray(parsed.notifications).length
      ? asArray(parsed.notifications)
      : seed.notifications,
    healthRecords: asArray(parsed.healthRecords).length
      ? asArray(parsed.healthRecords)
      : seed.healthRecords,
    medicalHistory: asArray(parsed.medicalHistory).length
      ? asArray(parsed.medicalHistory)
      : seed.medicalHistory,
    consultations: asArray(parsed.consultations).length
      ? asArray(parsed.consultations)
      : seed.consultations,
    reports: asArray(parsed.reports).length ? asArray(parsed.reports) : seed.reports,
    messages: asArray(parsed.messages).length ? asArray(parsed.messages) : seed.messages,
  };
};

let db = createSeedDatabase();

const nextId = (key) => {
  const value = Number(db.nextIds[key] || 1);
  db.nextIds[key] = value + 1;
  return value;
};

const syncLinkedRecords = () => {
  db.appointments = db.appointments.map((appointment) => {
    const patient = db.patients.find(
      (item) => toId(item.patientId) === toId(appointment.patientId)
    );
    const doctor = db.doctors.find(
      (item) => toId(item.doctorId) === toId(appointment.doctorId)
    );
    return {
      ...appointment,
      patient: patient ? patientSnapshot(patient) : appointment.patient,
      doctor: doctor ? doctorSnapshot(doctor) : appointment.doctor,
    };
  });

  db.messages = db.messages.map((message) => {
    const senderUser = db.users.find(
      (item) => toId(item.userId) === toId(message.sender?.userId)
    );
    const receiverUser = db.users.find(
      (item) => toId(item.userId) === toId(message.receiver?.userId)
    );
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const saveStateToMySql = async () => {
  if (!mysqlReady || !mysqlPool) return;
  const payload = JSON.stringify(db);
  await mysqlPool.query(
    "INSERT INTO app_state (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data = ?",
    [payload, payload]
  );
};

const schedulePersist = () => {
  if (!mysqlReady || !mysqlPool) return;
  if (persistTimer) return;
  persistTimer = setTimeout(async () => {
    persistTimer = null;
    try {
      await saveStateToMySql();
    } catch (err) {
      console.error("Failed to persist app state to MySQL:", err.message);
    }
  }, 75);
};

const connectMySqlWithRetry = async () => {
  const maxAttempts = Number(process.env.DB_CONNECT_RETRIES || 30);
  const delayMs = Number(process.env.DB_CONNECT_DELAY_MS || 2000);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      mysqlPool = mysql.createPool(mysqlConfig);
      await mysqlPool.query("SELECT 1");
      mysqlReady = true;
      console.log(`Connected to MySQL at ${mysqlConfig.host}:${mysqlConfig.port}`);
      return true;
    } catch (err) {
      mysqlReady = false;
      console.error(
        `MySQL connection attempt ${attempt}/${maxAttempts} failed: ${err.message}`
      );
      if (attempt < maxAttempts) await sleep(delayMs);
    }
  }

  return false;
};

const initializeStateFromMySql = async () => {
  if (!mysqlReady || !mysqlPool) return false;

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id TINYINT PRIMARY KEY,
      data LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await mysqlPool.query("SELECT data FROM app_state WHERE id = 1");
  const row = Array.isArray(rows) && rows.length ? rows[0] : null;

  if (!row || !row.data) {
    db = createSeedDatabase();
    syncLinkedRecords();
    await saveStateToMySql();
    return true;
  }

  try {
    const parsed = JSON.parse(String(row.data));
    db = ensureDatabase(parsed);
    syncLinkedRecords();
    return true;
  } catch (err) {
    console.error("Invalid app_state JSON in MySQL. Re-seeding database.", err.message);
    db = createSeedDatabase();
    syncLinkedRecords();
    await saveStateToMySql();
    return true;
  }
};

const initPersistence = async () => {
  const connected = await connectMySqlWithRetry();
  if (!connected) {
    console.error("MySQL unavailable. Running with in-memory state only.");
    mysqlReady = false;
    db = createSeedDatabase();
    syncLinkedRecords();
    return;
  }

  try {
    await initializeStateFromMySql();
  } catch (err) {
    console.error("Failed to initialize state from MySQL:", err.message);
    mysqlReady = false;
    db = createSeedDatabase();
    syncLinkedRecords();
  }
};

const createNotification = (userId, type, message) => {
  db.notifications.unshift({
    notificationId: nextId("notificationId"),
    userId,
    type,
    message,
    isRead: false,
    createdAt: nowIso(),
  });
  schedulePersist();
};

const getBearerToken = (req) => {
  const auth = String(req.headers.authorization || "");
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return "";
  return parts[1];
};

const getAuthUser = (req) => {
  const token = getBearerToken(req);
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const userId = Number(token.slice(TOKEN_PREFIX.length));
  if (!Number.isFinite(userId)) return null;
  return db.users.find((item) => item.userId === userId) || null;
};

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "patient-monitor-backend",
    persistence: mysqlReady ? "mysql" : "memory",
    mysql: mysqlReady,
    timestamp: nowIso(),
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "Backend is running.",
    health: "/api/health",
  });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const user = db.users.find((item) => item.email.toLowerCase() === email);

  if (!user || user.password !== password) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  return res.json(buildAuthPayload(user));
});

app.post("/api/auth/register", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const name = String(req.body?.name || "").trim();
  const role = normalizeRole(req.body?.role || "PATIENT");

  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }
  if (db.users.some((item) => item.email.toLowerCase() === email)) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const userId = nextId("userId");
  const user = { userId, email, password, name, role };
  db.users.push(user);

  if (role === "PATIENT") {
    db.patients.push({
      patientId: userId,
      userId,
      name,
      email,
      dateOfBirth: req.body?.dateOfBirth || "",
      contactNumber: req.body?.contactNumber || "",
      emergencyContact: req.body?.emergencyContact || "",
    });
    createNotification(
      userId,
      "WELCOME_PATIENT",
      `Welcome ${name}, your patient account is ready.`
    );
  } else if (role === "DOCTOR") {
    db.doctors.push({
      doctorId: userId,
      userId,
      name,
      email,
      licenseNumber: req.body?.licenseNumber || "",
      contactNumber: req.body?.contactNumber || "",
      specialization: req.body?.specialization || "",
    });
    createNotification(
      userId,
      "WELCOME_DOCTOR",
      `Welcome ${name}, your doctor account is ready.`
    );
  } else {
    createNotification(userId, "WELCOME_USER", `Welcome ${name}.`);
  }

  syncLinkedRecords();
  schedulePersist();
  return res.status(201).json({ data: buildAuthPayload(user) });
});

app.get("/api/patients", (req, res) => {
  res.json(clone(db.patients));
});

app.post("/api/patients", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const name = String(req.body?.name || "").trim();

  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }
  if (db.users.some((item) => item.email.toLowerCase() === email)) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const userId = nextId("userId");
  db.users.push({
    userId,
    email,
    password,
    name,
    role: "PATIENT",
  });

  const patient = {
    patientId: userId,
    userId,
    name,
    email,
    dateOfBirth: req.body?.dateOfBirth || "",
    contactNumber: req.body?.contactNumber || "",
    emergencyContact: req.body?.emergencyContact || "",
  };
  db.patients.push(patient);
  createNotification(
    userId,
    "ACCOUNT_CREATED",
    "Your patient account was created by admin."
  );
  syncLinkedRecords();
  schedulePersist();
  return res.status(201).json(patientSnapshot(patient));
});

app.get("/api/patients/me", (req, res) => {
  const authUser = getAuthUser(req);
  const patient = db.patients.find((item) => item.userId === authUser?.userId);
  if (!patient) return res.status(404).json({ error: "Patient profile not found" });
  return res.json(patientSnapshot(patient));
});

app.get("/api/patients/user/:userId", (req, res) => {
  const userId = toId(req.params.userId);
  const patient = db.patients.find((item) => toId(item.userId) === userId);
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  return res.json(patientSnapshot(patient));
});

app.get("/api/patients/:patientId", (req, res) => {
  const patientId = toId(req.params.patientId);
  const patient = db.patients.find((item) => toId(item.patientId) === patientId);
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  return res.json(patientSnapshot(patient));
});

const updatePatient = (req, res) => {
  const patientId = toId(req.params.patientId);
  const index = db.patients.findIndex((item) => toId(item.patientId) === patientId);
  if (index < 0) return res.status(404).json({ error: "Patient not found" });

  db.patients[index] = {
    ...db.patients[index],
    ...req.body,
    patientId: db.patients[index].patientId,
    userId: db.patients[index].userId,
    email: req.body?.email
      ? String(req.body.email).trim().toLowerCase()
      : db.patients[index].email,
  };

  const user = db.users.find((item) => item.userId === db.patients[index].userId);
  if (user) {
    user.name = db.patients[index].name || user.name;
    user.email = db.patients[index].email || user.email;
  }

  syncLinkedRecords();
  schedulePersist();
  return res.json(patientSnapshot(db.patients[index]));
};

app.put("/api/patients/:patientId", updatePatient);
app.patch("/api/patients/:patientId", updatePatient);

app.delete("/api/patients/:patientId", (req, res) => {
  const patientId = toId(req.params.patientId);
  const index = db.patients.findIndex((item) => toId(item.patientId) === patientId);
  if (index < 0) return res.status(404).json({ error: "Patient not found" });

  const [patient] = db.patients.splice(index, 1);
  db.users = db.users.filter((item) => item.userId !== patient.userId);
  db.appointments = db.appointments.filter(
    (item) => toId(item.patientId) !== toId(patient.patientId)
  );
  db.healthRecords = db.healthRecords.filter(
    (item) => toId(item.patientId) !== toId(patient.patientId)
  );
  db.medicalHistory = db.medicalHistory.filter(
    (item) => toId(item.patientId) !== toId(patient.patientId)
  );
  syncLinkedRecords();
  schedulePersist();
  return res.json({ success: true });
});

app.get("/api/doctors", (req, res) => {
  res.json(clone(db.doctors));
});

app.post("/api/doctors", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const name = String(req.body?.name || "").trim();

  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }
  if (db.users.some((item) => item.email.toLowerCase() === email)) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const userId = nextId("userId");
  db.users.push({
    userId,
    email,
    password,
    name,
    role: "DOCTOR",
  });

  const doctor = {
    doctorId: userId,
    userId,
    name,
    email,
    licenseNumber: req.body?.licenseNumber || "",
    contactNumber: req.body?.contactNumber || "",
    specialization: req.body?.specialization || "",
  };
  db.doctors.push(doctor);
  createNotification(
    userId,
    "ACCOUNT_CREATED",
    "Your doctor account was created by admin."
  );
  syncLinkedRecords();
  schedulePersist();
  return res.status(201).json(doctorSnapshot(doctor));
});

app.get("/api/doctors/me", (req, res) => {
  const authUser = getAuthUser(req);
  const doctor = db.doctors.find((item) => item.userId === authUser?.userId);
  if (!doctor) return res.status(404).json({ error: "Doctor profile not found" });
  return res.json(doctorSnapshot(doctor));
});

app.get("/api/doctors/user/:userId", (req, res) => {
  const userId = toId(req.params.userId);
  const doctor = db.doctors.find((item) => toId(item.userId) === userId);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  return res.json(doctorSnapshot(doctor));
});

app.get("/api/doctors/:doctorId", (req, res) => {
  const doctorId = toId(req.params.doctorId);
  const doctor = db.doctors.find((item) => toId(item.doctorId) === doctorId);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  return res.json(doctorSnapshot(doctor));
});

const updateDoctor = (req, res) => {
  const doctorId = toId(req.params.doctorId);
  const index = db.doctors.findIndex((item) => toId(item.doctorId) === doctorId);
  if (index < 0) return res.status(404).json({ error: "Doctor not found" });

  db.doctors[index] = {
    ...db.doctors[index],
    ...req.body,
    doctorId: db.doctors[index].doctorId,
    userId: db.doctors[index].userId,
    email: req.body?.email
      ? String(req.body.email).trim().toLowerCase()
      : db.doctors[index].email,
  };

  const user = db.users.find((item) => item.userId === db.doctors[index].userId);
  if (user) {
    user.name = db.doctors[index].name || user.name;
    user.email = db.doctors[index].email || user.email;
  }

  syncLinkedRecords();
  schedulePersist();
  return res.json(doctorSnapshot(db.doctors[index]));
};

app.put("/api/doctors/:doctorId", updateDoctor);
app.patch("/api/doctors/:doctorId", updateDoctor);

app.delete("/api/doctors/:doctorId", (req, res) => {
  const doctorId = toId(req.params.doctorId);
  const index = db.doctors.findIndex((item) => toId(item.doctorId) === doctorId);
  if (index < 0) return res.status(404).json({ error: "Doctor not found" });

  const [doctor] = db.doctors.splice(index, 1);
  db.users = db.users.filter((item) => item.userId !== doctor.userId);
  db.appointments = db.appointments.filter(
    (item) => toId(item.doctorId) !== toId(doctor.doctorId)
  );
  syncLinkedRecords();
  schedulePersist();
  return res.json({ success: true });
});

app.get("/api/appointments", (req, res) => {
  const list = clone(db.appointments).sort(
    (a, b) => new Date(b.dateTime || 0) - new Date(a.dateTime || 0)
  );
  res.json(list);
});

app.post("/api/appointments", (req, res) => {
  const doctorId = toId(req.body?.doctorId);
  const patientId = toId(req.body?.patientId);
  const doctor = db.doctors.find((item) => toId(item.doctorId) === doctorId);
  const patient = db.patients.find((item) => toId(item.patientId) === patientId);

  if (!doctor || !patient) {
    return res.status(400).json({ error: "Invalid doctor or patient" });
  }
  if (!req.body?.dateTime || !req.body?.reason) {
    return res
      .status(400)
      .json({ error: "Date/time and reason are required" });
  }

  const appointment = {
    appointmentId: nextId("appointmentId"),
    doctorId: doctor.doctorId,
    patientId: patient.patientId,
    doctor: doctorSnapshot(doctor),
    patient: patientSnapshot(patient),
    dateTime: req.body.dateTime,
    reason: String(req.body.reason).trim(),
    status: "SCHEDULED",
  };
  db.appointments.push(appointment);

  createNotification(
    doctor.userId,
    "APPOINTMENT_REQUEST",
    `${patient.name} booked an appointment.`
  );
  createNotification(
    patient.userId,
    "APPOINTMENT_BOOKED",
    `Appointment booked with ${doctor.name}.`
  );
  schedulePersist();

  return res.status(201).json(appointment);
});

app.get("/api/appointments/patient/:patientId", (req, res) => {
  const patientId = toId(req.params.patientId);
  const list = db.appointments.filter((item) => toId(item.patientId) === patientId);
  res.json(clone(list));
});

app.get("/api/appointments/doctor/:doctorId", (req, res) => {
  const doctorId = toId(req.params.doctorId);
  const list = db.appointments.filter((item) => toId(item.doctorId) === doctorId);
  res.json(clone(list));
});

app.put("/api/appointments/:appointmentId/status", (req, res) => {
  const appointmentId = toId(req.params.appointmentId);
  const status = String(req.body?.status || "").toUpperCase();
  const allowed = new Set(["SCHEDULED", "COMPLETED", "CANCELLED"]);
  if (!allowed.has(status)) return res.status(400).json({ error: "Invalid status" });

  const index = db.appointments.findIndex(
    (item) => toId(item.appointmentId) === appointmentId
  );
  if (index < 0) return res.status(404).json({ error: "Appointment not found" });

  db.appointments[index].status = status;
  const appointment = db.appointments[index];

  if (appointment.patient?.userId) {
    createNotification(
      appointment.patient.userId,
      "APPOINTMENT_STATUS",
      `Your appointment is now ${status}.`
    );
  }
  if (appointment.doctor?.userId) {
    createNotification(
      appointment.doctor.userId,
      "APPOINTMENT_STATUS",
      `Appointment with ${appointment.patient?.name || "patient"} is now ${status}.`
    );
  }

  schedulePersist();
  return res.json(clone(db.appointments[index]));
});

app.get("/api/notifications/user/:userId", (req, res) => {
  const userId = toId(req.params.userId);
  const list = db.notifications
    .filter((item) => toId(item.userId) === userId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(clone(list));
});

app.put("/api/notifications/:notificationId/read", (req, res) => {
  const notificationId = toId(req.params.notificationId);
  const index = db.notifications.findIndex(
    (item) => toId(item.notificationId) === notificationId
  );
  if (index < 0) return res.status(404).json({ error: "Notification not found" });

  db.notifications[index].isRead = true;
  schedulePersist();
  return res.json(clone(db.notifications[index]));
});

app.get("/api/messages/user/:userId", (req, res) => {
  const userId = toId(req.params.userId);
  const list = db.messages
    .filter(
      (item) =>
        toId(item.sender?.userId) === userId ||
        toId(item.receiver?.userId) === userId
    )
    .sort((a, b) => new Date(b.sentAt || 0) - new Date(a.sentAt || 0));
  res.json(clone(list));
});

app.get("/api/messages/conversation/:firstUserId/:secondUserId", (req, res) => {
  const firstUserId = toId(req.params.firstUserId);
  const secondUserId = toId(req.params.secondUserId);
  const list = db.messages
    .filter(
      (item) =>
        (toId(item.sender?.userId) === firstUserId &&
          toId(item.receiver?.userId) === secondUserId) ||
        (toId(item.sender?.userId) === secondUserId &&
          toId(item.receiver?.userId) === firstUserId)
    )
    .sort((a, b) => new Date(a.sentAt || 0) - new Date(b.sentAt || 0));
  res.json(clone(list));
});

app.post("/api/messages", (req, res) => {
  const senderId = toId(req.body?.senderId);
  const receiverId = toId(req.body?.receiverId);
  const content = String(req.body?.content || "").trim();
  if (!senderId || !receiverId || !content) {
    return res.status(400).json({ error: "Invalid message payload" });
  }

  const sender = db.users.find((item) => toId(item.userId) === senderId);
  const receiver = db.users.find((item) => toId(item.userId) === receiverId);
  if (!sender || !receiver) return res.status(404).json({ error: "User not found" });

  const message = {
    messageId: nextId("messageId"),
    sender: { userId: sender.userId, email: sender.email },
    receiver: { userId: receiver.userId, email: receiver.email },
    content,
    sentAt: nowIso(),
  };
  db.messages.push(message);
  createNotification(
    receiver.userId,
    "MESSAGE_RECEIVED",
    `New message from ${sender.email}`
  );
  schedulePersist();

  return res.status(201).json(message);
});

app.get("/api/health-records", (req, res) => {
  res.json(clone(db.healthRecords));
});

app.get("/api/health-records/patient/:patientId", (req, res) => {
  const patientId = toId(req.params.patientId);
  const list = db.healthRecords
    .filter((item) => toId(item.patientId) === patientId)
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
    );
  res.json(clone(list));
});

app.get("/api/medical-history/patient/:patientId", (req, res) => {
  const patientId = toId(req.params.patientId);
  const list = db.medicalHistory
    .filter((item) => toId(item.patientId) === patientId)
    .sort((a, b) => new Date(b.diagnosisDate || 0) - new Date(a.diagnosisDate || 0));
  res.json(clone(list));
});

app.get("/api/consultations", (req, res) => {
  res.json(clone(db.consultations));
});

const createConsultation = (req, res, appointmentIdParam) => {
  const appointmentId = toId(req.body?.appointmentId || appointmentIdParam);
  const appointment = db.appointments.find(
    (item) => toId(item.appointmentId) === appointmentId
  );
  if (!appointment) return res.status(404).json({ error: "Appointment not found" });

  const consultation = {
    consultationId: nextId("consultationId"),
    appointmentId: appointment.appointmentId,
    appointment: clone(appointment),
    summary: String(req.body?.summary || req.body?.advice || "").trim(),
    advice: String(req.body?.advice || req.body?.summary || "").trim(),
    prescription: String(req.body?.prescription || "").trim(),
    followUpDate: req.body?.followUpDate || "",
    createdAt: nowIso(),
  };
  db.consultations.unshift(consultation);

  const report = {
    reportId: nextId("reportId"),
    userId: appointment.doctor?.userId || appointment.doctorId,
    reportType: "Consultation Report",
    fileUrl: `consultation-${consultation.consultationId}.pdf`,
    createdAt: nowIso(),
  };
  db.reports.unshift(report);
  schedulePersist();
  return res.status(201).json(clone(consultation));
};

app.post("/api/consultations", (req, res) => createConsultation(req, res, null));

app.post("/api/consultations/appointment/:appointmentId", (req, res) =>
  createConsultation(req, res, req.params.appointmentId)
);

app.get("/api/reports", (req, res) => {
  res.json(clone(db.reports));
});

app.get("/api/reports/user/:userId", (req, res) => {
  const userId = toId(req.params.userId);
  const list = db.reports.filter((item) => toId(item.userId) === userId);
  res.json(clone(list));
});

app.delete("/api/users/:userId", (req, res) => {
  const userId = toId(req.params.userId);
  const user = db.users.find((item) => toId(item.userId) === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  db.users = db.users.filter((item) => toId(item.userId) !== userId);
  db.patients = db.patients.filter((item) => toId(item.userId) !== userId);
  db.doctors = db.doctors.filter((item) => toId(item.userId) !== userId);
  db.notifications = db.notifications.filter((item) => toId(item.userId) !== userId);
  db.messages = db.messages.filter(
    (item) =>
      toId(item.sender?.userId) !== userId && toId(item.receiver?.userId) !== userId
  );
  syncLinkedRecords();
  schedulePersist();
  return res.json({ success: true });
});

app.use("/api", (req, res) => {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

const startServer = async () => {
  await initPersistence();
  app.listen(port, () => {
    console.log(
      `Backend listening on port ${port} (persistence=${mysqlReady ? "mysql" : "memory"})`
    );
  });
};

startServer();
