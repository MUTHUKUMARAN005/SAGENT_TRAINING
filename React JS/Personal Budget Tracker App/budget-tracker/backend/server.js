const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
const port = Number(process.env.PORT || 8080);

const pool = mysql.createPool({
  host: process.env.DB_HOST || "mysql",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "budget_user",
  password: process.env.DB_PASSWORD || "budget_pass",
  database: process.env.DB_NAME || "budget_tracker",
  waitForConnections: true,
  connectionLimit: 10
});

app.use(cors());
app.use(express.json());

const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const b = (v) => v === true || v === "true" || v === 1 || v === "1";
const d = (v) => {
  const x = v ? new Date(v) : null;
  return x && !Number.isNaN(x.getTime()) ? x.toISOString().slice(0, 10) : null;
};
const role = (v) => (["ADMIN", "USER", "VIEWER"].includes(String(v || "").toUpperCase()) ? String(v).toUpperCase() : "USER");
const userId = (body = {}) => body.user?.userId || body.userId || null;
const token = () => crypto.randomBytes(24).toString("hex");
const q = async (sql, p = []) => (await pool.query(sql, p))[0];

const mapUser = (r) => ({ userId: r.user_id, name: r.name, email: r.email, role: r.role, currencyPreference: r.currency_preference });
const mapAccount = (r) => ({ accountId: r.account_id, accountName: r.account_name, accountType: r.account_type, initialBalance: n(r.initial_balance), currentBalance: n(r.current_balance), isActive: !!r.is_active });
const mapCategory = (r) => ({ categoryId: r.category_id, categoryName: r.category_name, categoryType: r.category_type, isCustom: !!r.is_custom, user: r.user_id ? { userId: r.user_id, name: r.user_name } : null });

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function init() {
  await q(`CREATE TABLE IF NOT EXISTS users (user_id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(120) NOT NULL,email VARCHAR(180) NOT NULL UNIQUE,password_hash VARCHAR(255) NOT NULL,role ENUM('ADMIN','USER','VIEWER') NOT NULL DEFAULT 'USER',currency_preference VARCHAR(10) NOT NULL DEFAULT 'INR',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
  await q(`CREATE TABLE IF NOT EXISTS categories (category_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NULL,category_name VARCHAR(120) NOT NULL,category_type ENUM('INCOME','EXPENSE') NOT NULL,is_custom BOOLEAN NOT NULL DEFAULT FALSE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,UNIQUE KEY uq_categories_owner_name_type (user_id,category_name,category_type),CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE)`);
  await q(`CREATE TABLE IF NOT EXISTS accounts (account_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,account_name VARCHAR(140) NOT NULL,account_type VARCHAR(50) NOT NULL,initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,is_active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE)`);
  await q(`CREATE TABLE IF NOT EXISTS incomes (income_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,account_id INT NULL,amount DECIMAL(15,2) NOT NULL,income_type VARCHAR(60) NOT NULL DEFAULT 'Other',description TEXT NULL,date_received DATE NOT NULL,is_recurring BOOLEAN NOT NULL DEFAULT FALSE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,CONSTRAINT fk_incomes_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,CONSTRAINT fk_incomes_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL)`);
  await q(`CREATE TABLE IF NOT EXISTS expenses (expense_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,account_id INT NULL,category_id INT NULL,amount DECIMAL(15,2) NOT NULL,description TEXT NULL,date_spent DATE NOT NULL,payment_method VARCHAR(60) NOT NULL DEFAULT 'UPI',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,CONSTRAINT fk_expenses_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL)`);
  await q(`CREATE TABLE IF NOT EXISTS goals (goal_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,goal_name VARCHAR(140) NOT NULL,target_amount DECIMAL(15,2) NOT NULL,current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,target_date DATE NOT NULL,status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE)`);
  await q(`CREATE TABLE IF NOT EXISTS transfers (transfer_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,from_account_id INT NOT NULL,to_account_id INT NOT NULL,amount DECIMAL(15,2) NOT NULL,date DATE NOT NULL,description TEXT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,CONSTRAINT fk_transfers_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE)`);
  await q(`CREATE TABLE IF NOT EXISTS recurring (recurring_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,transaction_type VARCHAR(140) NOT NULL,amount DECIMAL(15,2) NOT NULL,frequency ENUM('DAILY','WEEKLY','MONTHLY','YEARLY') NOT NULL DEFAULT 'MONTHLY',next_date DATE NOT NULL,is_active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,CONSTRAINT fk_recurring_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE)`);
  await q(`CREATE TABLE IF NOT EXISTS alerts (alert_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,alert_type VARCHAR(80) NOT NULL,message TEXT NOT NULL,is_read BOOLEAN NOT NULL DEFAULT FALSE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,CONSTRAINT fk_alerts_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE)`);
  await q(`CREATE TABLE IF NOT EXISTS budgets (budget_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,category_id INT NOT NULL,month_year CHAR(7) NOT NULL,amount_limit DECIMAL(15,2) NOT NULL,amount_spent DECIMAL(15,2) NOT NULL DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,UNIQUE KEY uq_budgets_user_category_month (user_id,category_id,month_year),CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE)`);
  await q(`CREATE TABLE IF NOT EXISTS reports (report_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NOT NULL,report_type VARCHAR(40) NOT NULL,period_label VARCHAR(120) NULL,summary JSON NULL,generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE)`);

  const seeds = [
    { name: "Arun", email: "arun@gmail.com", pw: "hash1", role: "ADMIN" },
    { name: "Bala", email: "bala@gmail.com", pw: "hash2", role: "USER" },
    { name: "Dinesh", email: "dinesh@gmail.com", pw: "hash4", role: "VIEWER" }
  ];
  for (const s of seeds) {
    const ph = await bcrypt.hash(s.pw, 10);
    await q(`INSERT INTO users(name,email,password_hash,role,currency_preference) VALUES (?,?,?,?, 'INR') ON DUPLICATE KEY UPDATE name=VALUES(name),role=VALUES(role)`, [s.name, s.email, ph, s.role]);
  }

  const cats = [["Salary", "INCOME"], ["Business", "INCOME"], ["Other Income", "INCOME"], ["Food", "EXPENSE"], ["Transport", "EXPENSE"], ["Shopping", "EXPENSE"], ["Bills", "EXPENSE"], ["Education", "EXPENSE"], ["Others", "EXPENSE"]];
  for (const [name, type] of cats) {
    await q(`INSERT INTO categories(user_id,category_name,category_type,is_custom) VALUES (NULL,?,?,FALSE) ON DUPLICATE KEY UPDATE category_name=category_name`, [name, type]);
  }
}

app.get("/api/health", ah(async (_req, res) => {
  await q("SELECT 1");
  res.json({ status: "ok", service: "budget-tracker-backend-mysql" });
}));

app.post("/api/auth/login", ah(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || req.body?.passwordHash || "");
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  const rows = await q("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  res.json({ token: token(), user: mapUser(user) });
}));

app.post("/api/auth/register", ah(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || req.body?.passwordHash || "");
  const currencyPreference = String(req.body?.currencyPreference || "INR").toUpperCase();
  if (!name || !email || password.length < 4) return res.status(400).json({ message: "Invalid registration payload" });
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const r = await q("INSERT INTO users(name,email,password_hash,role,currency_preference) VALUES (?,?,?,?,?)", [name, email, passwordHash, role(req.body?.role), currencyPreference]);
    const rows = await q("SELECT * FROM users WHERE user_id = ? LIMIT 1", [r.insertId]);
    res.status(201).json(mapUser(rows[0]));
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email already exists" });
    throw e;
  }
}));

app.get("/api/users", ah(async (_req, res) => {
  const rows = await q("SELECT * FROM users ORDER BY user_id ASC");
  res.json(rows.map(mapUser));
}));

app.get("/api/users/:id", ah(async (req, res) => {
  const rows = await q("SELECT * FROM users WHERE user_id = ? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "User not found" });
  res.json(mapUser(rows[0]));
}));

app.post("/api/users", ah(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!name || !email) return res.status(400).json({ message: "Name and email are required" });
  const raw = String(req.body?.password || req.body?.passwordHash || "changeme");
  const passwordHash = await bcrypt.hash(raw, 10);
  try {
    const r = await q("INSERT INTO users(name,email,password_hash,role,currency_preference) VALUES (?,?,?,?,?)", [name, email, passwordHash, role(req.body?.role), String(req.body?.currencyPreference || "INR").toUpperCase()]);
    const rows = await q("SELECT * FROM users WHERE user_id = ? LIMIT 1", [r.insertId]);
    res.status(201).json(mapUser(rows[0]));
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email already exists" });
    throw e;
  }
}));

app.put("/api/users/:id", ah(async (req, res) => {
  const id = Number(req.params.id);
  const found = await q("SELECT * FROM users WHERE user_id = ? LIMIT 1", [id]);
  const current = found[0];
  if (!current) return res.status(404).json({ message: "User not found" });
  let pass = current.password_hash;
  if (req.body?.passwordHash || req.body?.password) {
    const next = String(req.body.passwordHash || req.body.password);
    if (next.length < 4) return res.status(400).json({ message: "Password must be at least 4 characters" });
    pass = await bcrypt.hash(next, 10);
  }
  try {
    await q("UPDATE users SET name=?,email=?,role=?,currency_preference=?,password_hash=?,updated_at=NOW() WHERE user_id=?", [
      String(req.body?.name || current.name).trim(),
      String(req.body?.email || current.email).trim().toLowerCase(),
      role(req.body?.role || current.role),
      String(req.body?.currencyPreference || current.currency_preference || "INR").toUpperCase(),
      pass,
      id
    ]);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email already exists" });
    throw e;
  }
  const rows = await q("SELECT * FROM users WHERE user_id = ? LIMIT 1", [id]);
  res.json(mapUser(rows[0]));
}));

app.delete("/api/users/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM users WHERE user_id = ?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted" });
}));

// ROUTES_PLACEHOLDER
app.get("/api/budgets", ah(async (_req, res) => {
  const rows = await q(`
    SELECT b.budget_id budgetId,b.month_year monthYear,b.amount_limit amountLimit,b.amount_spent amountSpent,c.category_id categoryId,c.category_name categoryName,c.category_type categoryType
    FROM budgets b LEFT JOIN categories c ON c.category_id=b.category_id
    ORDER BY b.month_year DESC,b.budget_id DESC
  `);
  res.json(rows.map((r) => ({ budgetId: r.budgetId, monthYear: r.monthYear, amountLimit: n(r.amountLimit), amountSpent: n(r.amountSpent), category: r.categoryId ? { categoryId: r.categoryId, categoryName: r.categoryName, categoryType: r.categoryType } : null })));
}));
app.get("/api/budgets/:id", ah(async (req, res) => {
  const rows = await q("SELECT budget_id budgetId,month_year monthYear,amount_limit amountLimit,amount_spent amountSpent,category_id categoryId FROM budgets WHERE budget_id=? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Budget not found" });
  res.json(rows[0]);
}));
app.get("/api/budgets/user/:userId", ah(async (req, res) => {
  const rows = await q(`
    SELECT b.budget_id budgetId,b.month_year monthYear,b.amount_limit amountLimit,b.amount_spent amountSpent,c.category_id categoryId,c.category_name categoryName,c.category_type categoryType
    FROM budgets b LEFT JOIN categories c ON c.category_id=b.category_id
    WHERE b.user_id=? ORDER BY b.month_year DESC,b.budget_id DESC
  `, [req.params.userId]);
  res.json(rows.map((r) => ({ budgetId: r.budgetId, monthYear: r.monthYear, amountLimit: n(r.amountLimit), amountSpent: n(r.amountSpent), category: r.categoryId ? { categoryId: r.categoryId, categoryName: r.categoryName, categoryType: r.categoryType } : null })));
}));
app.get("/api/budgets/user/:userId/month/:month", ah(async (req, res) => {
  const rows = await q("SELECT budget_id budgetId,month_year monthYear,amount_limit amountLimit,amount_spent amountSpent,category_id categoryId FROM budgets WHERE user_id=? AND month_year=? ORDER BY budget_id DESC", [req.params.userId, req.params.month]);
  res.json(rows);
}));
app.post("/api/budgets", ah(async (req, res) => {
  const uid = Number(userId(req.body)); const cid = Number(req.body?.category?.categoryId || req.body?.categoryId);
  if (!uid || !cid || !String(req.body?.monthYear || "").slice(0, 7) || n(req.body?.amountLimit) <= 0) return res.status(400).json({ message: "Invalid budget payload" });
  await q("INSERT INTO budgets(user_id,category_id,month_year,amount_limit,amount_spent) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE amount_limit=VALUES(amount_limit),amount_spent=VALUES(amount_spent),updated_at=NOW()", [uid, cid, String(req.body?.monthYear).slice(0, 7), n(req.body?.amountLimit), n(req.body?.amountSpent)]);
  const rows = await q("SELECT budget_id budgetId,month_year monthYear,amount_limit amountLimit,amount_spent amountSpent,category_id categoryId FROM budgets WHERE user_id=? AND category_id=? AND month_year=? LIMIT 1", [uid, cid, String(req.body?.monthYear).slice(0, 7)]);
  res.status(201).json(rows[0]);
}));
app.put("/api/budgets/:id", ah(async (req, res) => {
  const id = Number(req.params.id); const rows = await q("SELECT * FROM budgets WHERE budget_id=? LIMIT 1", [id]); const b0 = rows[0];
  if (!b0) return res.status(404).json({ message: "Budget not found" });
  await q("UPDATE budgets SET user_id=?,category_id=?,month_year=?,amount_limit=?,amount_spent=?,updated_at=NOW() WHERE budget_id=?", [Number(userId(req.body) || b0.user_id), Number(req.body?.category?.categoryId || req.body?.categoryId || b0.category_id), String(req.body?.monthYear || b0.month_year).slice(0, 7), req.body?.amountLimit === undefined ? n(b0.amount_limit) : n(req.body.amountLimit), req.body?.amountSpent === undefined ? n(b0.amount_spent) : n(req.body.amountSpent), id]);
  const next = await q("SELECT budget_id budgetId,month_year monthYear,amount_limit amountLimit,amount_spent amountSpent,category_id categoryId FROM budgets WHERE budget_id=? LIMIT 1", [id]); res.json(next[0]);
}));
app.delete("/api/budgets/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM budgets WHERE budget_id=?", [req.params.id]); if (!r.affectedRows) return res.status(404).json({ message: "Budget not found" }); res.json({ message: "Budget deleted" });
}));

app.get("/api/reports", ah(async (_req, res) => res.json(await q("SELECT report_id reportId,report_type reportType,period_label periodLabel,summary,generated_at generatedAt FROM reports ORDER BY generated_at DESC,report_id DESC"))));
app.get("/api/reports/user/:userId", ah(async (req, res) => res.json(await q("SELECT report_id reportId,report_type reportType,period_label periodLabel,summary,generated_at generatedAt FROM reports WHERE user_id=? ORDER BY generated_at DESC,report_id DESC", [req.params.userId]))));
app.post("/api/reports", ah(async (req, res) => {
  const uid = Number(userId(req.body) || req.body?.userId); if (!uid) return res.status(400).json({ message: "userId is required for report creation" });
  const r = await q("INSERT INTO reports(user_id,report_type,period_label,summary,generated_at) VALUES (?,?,?,?,?)", [uid, String(req.body?.reportType || "MONTHLY"), req.body?.periodLabel || null, typeof req.body?.summary === "string" ? req.body.summary : JSON.stringify(req.body?.summary || {}), req.body?.generatedAt ? new Date(req.body.generatedAt).toISOString().slice(0, 19).replace("T", " ") : new Date().toISOString().slice(0, 19).replace("T", " ")]);
  const rows = await q("SELECT report_id reportId,report_type reportType,period_label periodLabel,summary,generated_at generatedAt FROM reports WHERE report_id=? LIMIT 1", [r.insertId]); res.status(201).json(rows[0]);
}));
app.delete("/api/reports/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM reports WHERE report_id=?", [req.params.id]); if (!r.affectedRows) return res.status(404).json({ message: "Report not found" }); res.json({ message: "Report deleted" });
}));

app.get("/api/dashboard/:userId", ah(async (req, res) => {
  const uid = Number(req.params.userId);
  const b1 = await q("SELECT COALESCE(SUM(current_balance),0) v FROM accounts WHERE user_id=?", [uid]);
  const i1 = await q("SELECT COALESCE(SUM(amount),0) v FROM incomes WHERE user_id=?", [uid]);
  const e1 = await q("SELECT COALESCE(SUM(amount),0) v FROM expenses WHERE user_id=?", [uid]);
  const a1 = await q("SELECT COUNT(*) c FROM accounts WHERE user_id=?", [uid]);
  const g1 = await q("SELECT COUNT(*) c FROM goals WHERE user_id=? AND status='ACTIVE'", [uid]);
  const al = await q("SELECT COUNT(*) c FROM alerts WHERE user_id=? AND is_read=FALSE", [uid]);
  const by = await q("SELECT COALESCE(c.category_name,'Others') category,COALESCE(SUM(e.amount),0) total FROM expenses e LEFT JOIN categories c ON c.category_id=e.category_id WHERE e.user_id=? GROUP BY c.category_name ORDER BY total DESC", [uid]);
  const totalBalance = n(b1[0]?.v), totalIncome = n(i1[0]?.v), totalExpense = n(e1[0]?.v);
  res.json({ totalBalance, totalIncome, totalExpense, savings: totalIncome - totalExpense, accountCount: Number(a1[0]?.c || 0), activeGoals: Number(g1[0]?.c || 0), unreadAlerts: Number(al[0]?.c || 0), expenseByCategory: by.map((r) => ({ category: r.category, total: n(r.total) })) });
}));

app.post("/api/ai/assistant/chat", ah(async (req, res) => {
  const question = String(req.body?.question || "").trim();
  if (!question) return res.status(400).json({ message: "question is required" });
  res.json({ answer: `Backend AI stub: "${question}"` });
}));
app.get("/api/goals", ah(async (_req, res) => res.json(await q("SELECT goal_id goalId,goal_name goalName,target_amount targetAmount,current_amount currentAmount,target_date targetDate,status FROM goals ORDER BY goal_id DESC"))));
app.get("/api/goals/:id", ah(async (req, res) => {
  const rows = await q("SELECT goal_id goalId,goal_name goalName,target_amount targetAmount,current_amount currentAmount,target_date targetDate,status FROM goals WHERE goal_id=? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Goal not found" });
  res.json(rows[0]);
}));
app.get("/api/goals/user/:userId", ah(async (req, res) => res.json(await q("SELECT goal_id goalId,goal_name goalName,target_amount targetAmount,current_amount currentAmount,target_date targetDate,status FROM goals WHERE user_id=? ORDER BY goal_id DESC", [req.params.userId]))));
app.get("/api/goals/user/:userId/active", ah(async (req, res) => res.json(await q("SELECT goal_id goalId,goal_name goalName,target_amount targetAmount,current_amount currentAmount,target_date targetDate,status FROM goals WHERE user_id=? AND status='ACTIVE' ORDER BY goal_id DESC", [req.params.userId]))));
app.post("/api/goals", ah(async (req, res) => {
  const uid = Number(userId(req.body)); if (!uid) return res.status(400).json({ message: "userId is required" });
  const r = await q("INSERT INTO goals(user_id,goal_name,target_amount,current_amount,target_date,status) VALUES (?,?,?,?,?,?)", [uid, String(req.body?.goalName || ""), n(req.body?.targetAmount), n(req.body?.currentAmount), d(req.body?.targetDate), String(req.body?.status || "ACTIVE")]);
  const rows = await q("SELECT goal_id goalId,goal_name goalName,target_amount targetAmount,current_amount currentAmount,target_date targetDate,status FROM goals WHERE goal_id=? LIMIT 1", [r.insertId]);
  res.status(201).json(rows[0]);
}));
app.put("/api/goals/:id", ah(async (req, res) => {
  const id = Number(req.params.id); const rows = await q("SELECT * FROM goals WHERE goal_id=? LIMIT 1", [id]); const g = rows[0];
  if (!g) return res.status(404).json({ message: "Goal not found" });
  await q("UPDATE goals SET user_id=?,goal_name=?,target_amount=?,current_amount=?,target_date=?,status=?,updated_at=NOW() WHERE goal_id=?", [Number(userId(req.body) || g.user_id), String(req.body?.goalName || g.goal_name), req.body?.targetAmount === undefined ? n(g.target_amount) : n(req.body.targetAmount), req.body?.currentAmount === undefined ? n(g.current_amount) : n(req.body.currentAmount), d(req.body?.targetDate || g.target_date), String(req.body?.status || g.status), id]);
  const next = await q("SELECT goal_id goalId,goal_name goalName,target_amount targetAmount,current_amount currentAmount,target_date targetDate,status FROM goals WHERE goal_id=? LIMIT 1", [id]);
  res.json(next[0]);
}));
app.patch("/api/goals/:id/contribute", ah(async (req, res) => {
  const id = Number(req.params.id); const amount = n(req.query.amount);
  if (amount <= 0) return res.status(400).json({ message: "amount must be > 0" });
  const rows = await q("SELECT * FROM goals WHERE goal_id=? LIMIT 1", [id]); const g = rows[0];
  if (!g) return res.status(404).json({ message: "Goal not found" });
  const current = n(g.current_amount) + amount; const status = current >= n(g.target_amount) ? "COMPLETED" : g.status;
  await q("UPDATE goals SET current_amount=?,status=?,updated_at=NOW() WHERE goal_id=?", [current, status, id]);
  const next = await q("SELECT goal_id goalId,goal_name goalName,target_amount targetAmount,current_amount currentAmount,target_date targetDate,status FROM goals WHERE goal_id=? LIMIT 1", [id]);
  res.json(next[0]);
}));
app.delete("/api/goals/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM goals WHERE goal_id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: "Goal not found" });
  res.json({ message: "Goal deleted" });
}));

app.get("/api/transfers", ah(async (_req, res) => res.json(await q("SELECT transfer_id transferId,from_account_id fromAccountId,to_account_id toAccountId,amount,date,description FROM transfers ORDER BY date DESC,transfer_id DESC"))));
app.get("/api/transfers/:id", ah(async (req, res) => {
  const rows = await q("SELECT transfer_id transferId,from_account_id fromAccountId,to_account_id toAccountId,amount,date,description FROM transfers WHERE transfer_id=? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Transfer not found" });
  res.json(rows[0]);
}));
app.get("/api/transfers/user/:userId", ah(async (req, res) => {
  const rows = await q(`
    SELECT t.transfer_id transferId,t.amount,t.date,t.description,t.from_account_id,t.to_account_id,fa.account_name fromName,ta.account_name toName
    FROM transfers t LEFT JOIN accounts fa ON fa.account_id=t.from_account_id LEFT JOIN accounts ta ON ta.account_id=t.to_account_id
    WHERE t.user_id=? ORDER BY t.date DESC,t.transfer_id DESC
  `, [req.params.userId]);
  res.json(rows.map((r) => ({ transferId: r.transferId, amount: n(r.amount), date: d(r.date), description: r.description, fromAccount: r.from_account_id ? { accountId: r.from_account_id, accountName: r.fromName } : null, toAccount: r.to_account_id ? { accountId: r.to_account_id, accountName: r.toName } : null })));
}));
app.post("/api/transfers", ah(async (req, res) => {
  const fromId = Number(req.body?.fromAccount?.accountId || req.body?.fromAccountId);
  const toId = Number(req.body?.toAccount?.accountId || req.body?.toAccountId);
  const uid = Number(await (async () => { const rows = await q("SELECT user_id FROM accounts WHERE account_id=? LIMIT 1", [fromId]); return rows[0]?.user_id || 0; })());
  if (!uid || !fromId || !toId || fromId === toId || n(req.body?.amount) <= 0 || !d(req.body?.date)) return res.status(400).json({ message: "Invalid transfer payload" });
  const r = await q("INSERT INTO transfers(user_id,from_account_id,to_account_id,amount,date,description) VALUES (?,?,?,?,?,?)", [uid, fromId, toId, n(req.body?.amount), d(req.body?.date), req.body?.description || null]);
  const rows = await q("SELECT transfer_id transferId,amount,date,description FROM transfers WHERE transfer_id=? LIMIT 1", [r.insertId]);
  res.status(201).json(rows[0]);
}));
app.delete("/api/transfers/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM transfers WHERE transfer_id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: "Transfer not found" });
  res.json({ message: "Transfer deleted" });
}));

app.get("/api/recurring", ah(async (_req, res) => res.json(await q("SELECT recurring_id recurringId,transaction_type transactionType,amount,frequency,next_date nextDate,is_active isActive FROM recurring ORDER BY next_date ASC"))));
app.get("/api/recurring/:id", ah(async (req, res) => {
  const rows = await q("SELECT recurring_id recurringId,transaction_type transactionType,amount,frequency,next_date nextDate,is_active isActive FROM recurring WHERE recurring_id=? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Recurring item not found" });
  res.json(rows[0]);
}));
app.get("/api/recurring/user/:userId", ah(async (req, res) => res.json(await q("SELECT recurring_id recurringId,transaction_type transactionType,amount,frequency,next_date nextDate,is_active isActive FROM recurring WHERE user_id=? ORDER BY next_date ASC", [req.params.userId]))));
app.get("/api/recurring/user/:userId/active", ah(async (req, res) => res.json(await q("SELECT recurring_id recurringId,transaction_type transactionType,amount,frequency,next_date nextDate,is_active isActive FROM recurring WHERE user_id=? AND is_active=TRUE ORDER BY next_date ASC", [req.params.userId]))));
app.post("/api/recurring", ah(async (req, res) => {
  const uid = Number(userId(req.body)); if (!uid) return res.status(400).json({ message: "userId is required" });
  const r = await q("INSERT INTO recurring(user_id,transaction_type,amount,frequency,next_date,is_active) VALUES (?,?,?,?,?,?)", [uid, String(req.body?.transactionType || ""), n(req.body?.amount), String(req.body?.frequency || "MONTHLY"), d(req.body?.nextDate), b(req.body?.isActive ?? true)]);
  const rows = await q("SELECT recurring_id recurringId,transaction_type transactionType,amount,frequency,next_date nextDate,is_active isActive FROM recurring WHERE recurring_id=? LIMIT 1", [r.insertId]);
  res.status(201).json(rows[0]);
}));
app.put("/api/recurring/:id", ah(async (req, res) => {
  const id = Number(req.params.id); const rows = await q("SELECT * FROM recurring WHERE recurring_id=? LIMIT 1", [id]); const r0 = rows[0];
  if (!r0) return res.status(404).json({ message: "Recurring item not found" });
  await q("UPDATE recurring SET user_id=?,transaction_type=?,amount=?,frequency=?,next_date=?,is_active=?,updated_at=NOW() WHERE recurring_id=?", [Number(userId(req.body) || r0.user_id), String(req.body?.transactionType || r0.transaction_type), req.body?.amount === undefined ? n(r0.amount) : n(req.body.amount), String(req.body?.frequency || r0.frequency), d(req.body?.nextDate || r0.next_date), req.body?.isActive === undefined ? !!r0.is_active : b(req.body.isActive), id]);
  const next = await q("SELECT recurring_id recurringId,transaction_type transactionType,amount,frequency,next_date nextDate,is_active isActive FROM recurring WHERE recurring_id=? LIMIT 1", [id]);
  res.json(next[0]);
}));
app.delete("/api/recurring/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM recurring WHERE recurring_id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: "Recurring item not found" });
  res.json({ message: "Recurring item deleted" });
}));

app.get("/api/alerts", ah(async (_req, res) => res.json(await q("SELECT alert_id alertId,alert_type alertType,message,is_read isRead,created_at createdAt FROM alerts ORDER BY created_at DESC"))));
app.get("/api/alerts/user/:userId", ah(async (req, res) => res.json(await q("SELECT alert_id alertId,alert_type alertType,message,is_read isRead,created_at createdAt FROM alerts WHERE user_id=? ORDER BY created_at DESC", [req.params.userId]))));
app.get("/api/alerts/user/:userId/unread", ah(async (req, res) => res.json(await q("SELECT alert_id alertId,alert_type alertType,message,is_read isRead,created_at createdAt FROM alerts WHERE user_id=? AND is_read=FALSE ORDER BY created_at DESC", [req.params.userId]))));
app.get("/api/alerts/user/:userId/unread/count", ah(async (req, res) => {
  const rows = await q("SELECT COUNT(*) count FROM alerts WHERE user_id=? AND is_read=FALSE", [req.params.userId]); res.json({ count: Number(rows[0]?.count || 0) });
}));
app.patch("/api/alerts/:id/read", ah(async (req, res) => {
  const r = await q("UPDATE alerts SET is_read=TRUE WHERE alert_id=?", [req.params.id]); if (!r.affectedRows) return res.status(404).json({ message: "Alert not found" });
  const rows = await q("SELECT alert_id alertId,alert_type alertType,message,is_read isRead,created_at createdAt FROM alerts WHERE alert_id=? LIMIT 1", [req.params.id]); res.json(rows[0]);
}));
app.post("/api/alerts", ah(async (req, res) => {
  const uid = Number(userId(req.body)); if (!uid) return res.status(400).json({ message: "userId is required" });
  const r = await q("INSERT INTO alerts(user_id,alert_type,message,is_read) VALUES (?,?,?,?)", [uid, String(req.body?.alertType || "BUDGET_LIMIT"), String(req.body?.message || ""), b(req.body?.isRead)]);
  const rows = await q("SELECT alert_id alertId,alert_type alertType,message,is_read isRead,created_at createdAt FROM alerts WHERE alert_id=? LIMIT 1", [r.insertId]); res.status(201).json(rows[0]);
}));
app.delete("/api/alerts/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM alerts WHERE alert_id=?", [req.params.id]); if (!r.affectedRows) return res.status(404).json({ message: "Alert not found" }); res.json({ message: "Alert deleted" });
}));

// ROUTES_PLACEHOLDER
app.put("/api/incomes/:id", ah(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await q("SELECT * FROM incomes WHERE income_id=? LIMIT 1", [id]);
  const i = rows[0];
  if (!i) return res.status(404).json({ message: "Income not found" });
  await q("UPDATE incomes SET user_id=?,account_id=?,amount=?,income_type=?,description=?,date_received=?,is_recurring=? WHERE income_id=?", [
    Number(userId(req.body) || i.user_id),
    req.body?.account?.accountId || req.body?.accountId || i.account_id,
    req.body?.amount === undefined ? n(i.amount) : n(req.body.amount),
    String(req.body?.incomeType || i.income_type),
    req.body?.description === undefined ? i.description : req.body.description,
    d(req.body?.dateReceived || i.date_received),
    req.body?.isRecurring === undefined ? !!i.is_recurring : b(req.body.isRecurring),
    id
  ]);
  const next = await q("SELECT * FROM incomes WHERE income_id=? LIMIT 1", [id]);
  res.json({ incomeId: next[0].income_id, amount: n(next[0].amount), incomeType: next[0].income_type, description: next[0].description, dateReceived: d(next[0].date_received), isRecurring: !!next[0].is_recurring });
}));

app.delete("/api/incomes/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM incomes WHERE income_id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: "Income not found" });
  res.json({ message: "Income deleted" });
}));

app.get("/api/expenses", ah(async (_req, res) => {
  const rows = await q(`
    SELECT e.*,a.account_name,a.account_type,c.category_name,c.category_type FROM expenses e
    LEFT JOIN accounts a ON a.account_id=e.account_id
    LEFT JOIN categories c ON c.category_id=e.category_id
    ORDER BY e.date_spent DESC,e.expense_id DESC
  `);
  res.json(rows.map((r) => ({
    expenseId: r.expense_id, amount: n(r.amount), description: r.description, dateSpent: d(r.date_spent), paymentMethod: r.payment_method,
    account: r.account_id ? { accountId: r.account_id, accountName: r.account_name, accountType: r.account_type } : null,
    category: r.category_id ? { categoryId: r.category_id, categoryName: r.category_name, categoryType: r.category_type } : null
  })));
}));

app.get("/api/expenses/:id", ah(async (req, res) => {
  const rows = await q(`
    SELECT e.*,a.account_name,a.account_type,c.category_name,c.category_type FROM expenses e
    LEFT JOIN accounts a ON a.account_id=e.account_id
    LEFT JOIN categories c ON c.category_id=e.category_id WHERE e.expense_id=? LIMIT 1
  `, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Expense not found" });
  const r = rows[0];
  res.json({
    expenseId: r.expense_id, amount: n(r.amount), description: r.description, dateSpent: d(r.date_spent), paymentMethod: r.payment_method,
    account: r.account_id ? { accountId: r.account_id, accountName: r.account_name, accountType: r.account_type } : null,
    category: r.category_id ? { categoryId: r.category_id, categoryName: r.category_name, categoryType: r.category_type } : null
  });
}));

app.get("/api/expenses/user/:userId", ah(async (req, res) => {
  const rows = await q(`
    SELECT e.*,a.account_name,a.account_type,c.category_name,c.category_type FROM expenses e
    LEFT JOIN accounts a ON a.account_id=e.account_id
    LEFT JOIN categories c ON c.category_id=e.category_id WHERE e.user_id=?
    ORDER BY e.date_spent DESC,e.expense_id DESC
  `, [req.params.userId]);
  res.json(rows.map((r) => ({
    expenseId: r.expense_id, amount: n(r.amount), description: r.description, dateSpent: d(r.date_spent), paymentMethod: r.payment_method,
    account: r.account_id ? { accountId: r.account_id, accountName: r.account_name, accountType: r.account_type } : null,
    category: r.category_id ? { categoryId: r.category_id, categoryName: r.category_name, categoryType: r.category_type } : null
  })));
}));

app.get("/api/expenses/user/:userId/total", ah(async (req, res) => {
  const rows = await q("SELECT COALESCE(SUM(amount),0) total FROM expenses WHERE user_id=?", [req.params.userId]);
  res.json({ total: n(rows[0]?.total) });
}));

app.get("/api/expenses/user/:userId/by-category", ah(async (req, res) => {
  const rows = await q(`
    SELECT COALESCE(c.category_name,'Others') category,COALESCE(SUM(e.amount),0) total
    FROM expenses e LEFT JOIN categories c ON c.category_id=e.category_id
    WHERE e.user_id=? GROUP BY c.category_name ORDER BY total DESC
  `, [req.params.userId]);
  res.json(rows.map((x) => ({ category: x.category, total: n(x.total) })));
}));

app.post("/api/expenses", ah(async (req, res) => {
  const uid = Number(userId(req.body));
  const aid = req.body?.account?.accountId || req.body?.accountId || null;
  const cid = req.body?.category?.categoryId || req.body?.categoryId || null;
  if (!uid || n(req.body?.amount) <= 0 || !d(req.body?.dateSpent)) return res.status(400).json({ message: "Invalid expense payload" });
  const r = await q("INSERT INTO expenses(user_id,account_id,category_id,amount,description,date_spent,payment_method) VALUES (?,?,?,?,?,?,?)", [uid, aid, cid, n(req.body?.amount), req.body?.description || null, d(req.body?.dateSpent), String(req.body?.paymentMethod || "UPI")]);
  const rows = await q("SELECT * FROM expenses WHERE expense_id=? LIMIT 1", [r.insertId]);
  res.status(201).json({ expenseId: rows[0].expense_id, amount: n(rows[0].amount), description: rows[0].description, dateSpent: d(rows[0].date_spent), paymentMethod: rows[0].payment_method });
}));

app.put("/api/expenses/:id", ah(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await q("SELECT * FROM expenses WHERE expense_id=? LIMIT 1", [id]);
  const e = rows[0];
  if (!e) return res.status(404).json({ message: "Expense not found" });
  await q("UPDATE expenses SET user_id=?,account_id=?,category_id=?,amount=?,description=?,date_spent=?,payment_method=? WHERE expense_id=?", [
    Number(userId(req.body) || e.user_id),
    req.body?.account?.accountId || req.body?.accountId || e.account_id,
    req.body?.category?.categoryId || req.body?.categoryId || e.category_id,
    req.body?.amount === undefined ? n(e.amount) : n(req.body.amount),
    req.body?.description === undefined ? e.description : req.body.description,
    d(req.body?.dateSpent || e.date_spent),
    String(req.body?.paymentMethod || e.payment_method || "UPI"),
    id
  ]);
  const next = await q("SELECT * FROM expenses WHERE expense_id=? LIMIT 1", [id]);
  res.json({ expenseId: next[0].expense_id, amount: n(next[0].amount), description: next[0].description, dateSpent: d(next[0].date_spent), paymentMethod: next[0].payment_method });
}));

app.delete("/api/expenses/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM expenses WHERE expense_id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: "Expense not found" });
  res.json({ message: "Expense deleted" });
}));

// ROUTES_PLACEHOLDER
app.get("/api/categories", ah(async (_req, res) => {
  const rows = await q(`
    SELECT c.*,u.user_id,u.name user_name FROM categories c
    LEFT JOIN users u ON u.user_id=c.user_id
    ORDER BY c.category_name ASC
  `);
  res.json(rows.map(mapCategory));
}));

app.get("/api/categories/:id", ah(async (req, res) => {
  const rows = await q(`
    SELECT c.*,u.user_id,u.name user_name FROM categories c
    LEFT JOIN users u ON u.user_id=c.user_id
    WHERE c.category_id=? LIMIT 1
  `, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Category not found" });
  res.json(mapCategory(rows[0]));
}));

app.get("/api/categories/user/:userId", ah(async (req, res) => {
  const rows = await q(`
    SELECT c.*,u.user_id,u.name user_name FROM categories c
    LEFT JOIN users u ON u.user_id=c.user_id
    WHERE c.user_id=? ORDER BY c.category_name ASC
  `, [req.params.userId]);
  res.json(rows.map(mapCategory));
}));

app.get("/api/categories/type/:type", ah(async (req, res) => {
  const rows = await q(`
    SELECT c.*,u.user_id,u.name user_name FROM categories c
    LEFT JOIN users u ON u.user_id=c.user_id
    WHERE c.category_type=? ORDER BY c.category_name ASC
  `, [String(req.params.type || "").toUpperCase()]);
  res.json(rows.map(mapCategory));
}));

app.post("/api/categories", ah(async (req, res) => {
  const name = String(req.body?.categoryName || "").trim();
  const type = String(req.body?.categoryType || "EXPENSE").toUpperCase();
  if (!name) return res.status(400).json({ message: "categoryName is required" });
  try {
    const r = await q("INSERT INTO categories(user_id,category_name,category_type,is_custom) VALUES (?,?,?,?)", [userId(req.body), name, type, b(req.body?.isCustom ?? true)]);
    const rows = await q("SELECT * FROM categories WHERE category_id=? LIMIT 1", [r.insertId]);
    res.status(201).json(mapCategory(rows[0]));
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Category already exists" });
    throw e;
  }
}));

app.put("/api/categories/:id", ah(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await q("SELECT * FROM categories WHERE category_id=? LIMIT 1", [id]);
  if (!rows[0]) return res.status(404).json({ message: "Category not found" });
  const c = rows[0];
  await q("UPDATE categories SET category_name=?,category_type=?,is_custom=? WHERE category_id=?", [
    String(req.body?.categoryName || c.category_name).trim(),
    String(req.body?.categoryType || c.category_type).toUpperCase(),
    req.body?.isCustom === undefined ? !!c.is_custom : b(req.body.isCustom),
    id
  ]);
  const next = await q("SELECT * FROM categories WHERE category_id=? LIMIT 1", [id]);
  res.json(mapCategory(next[0]));
}));

app.delete("/api/categories/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM categories WHERE category_id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: "Category not found" });
  res.json({ message: "Category deleted" });
}));

app.get("/api/accounts", ah(async (_req, res) => {
  const rows = await q("SELECT * FROM accounts ORDER BY account_id DESC");
  res.json(rows.map(mapAccount));
}));

app.get("/api/accounts/:id", ah(async (req, res) => {
  const rows = await q("SELECT * FROM accounts WHERE account_id=? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Account not found" });
  res.json(mapAccount(rows[0]));
}));

app.get("/api/accounts/user/:userId", ah(async (req, res) => {
  const rows = await q("SELECT * FROM accounts WHERE user_id=? ORDER BY account_id DESC", [req.params.userId]);
  res.json(rows.map(mapAccount));
}));

app.get("/api/accounts/user/:userId/balance", ah(async (req, res) => {
  const rows = await q("SELECT COALESCE(SUM(current_balance),0) totalBalance FROM accounts WHERE user_id=?", [req.params.userId]);
  res.json({ totalBalance: n(rows[0]?.totalBalance) });
}));

app.post("/api/accounts", ah(async (req, res) => {
  const uid = Number(userId(req.body));
  if (!uid) return res.status(400).json({ message: "userId is required" });
  const name = String(req.body?.accountName || "").trim();
  if (!name) return res.status(400).json({ message: "accountName is required" });
  const r = await q("INSERT INTO accounts(user_id,account_name,account_type,initial_balance,current_balance,is_active) VALUES (?,?,?,?,?,?)", [
    uid, name, String(req.body?.accountType || "BANK"), n(req.body?.initialBalance), req.body?.currentBalance === "" ? n(req.body?.initialBalance) : n(req.body?.currentBalance, n(req.body?.initialBalance)), b(req.body?.isActive ?? true)
  ]);
  const rows = await q("SELECT * FROM accounts WHERE account_id=? LIMIT 1", [r.insertId]);
  res.status(201).json(mapAccount(rows[0]));
}));

app.put("/api/accounts/:id", ah(async (req, res) => {
  const id = Number(req.params.id);
  const rows = await q("SELECT * FROM accounts WHERE account_id=? LIMIT 1", [id]);
  const a = rows[0];
  if (!a) return res.status(404).json({ message: "Account not found" });
  await q("UPDATE accounts SET user_id=?,account_name=?,account_type=?,initial_balance=?,current_balance=?,is_active=?,updated_at=NOW() WHERE account_id=?", [
    Number(userId(req.body) || a.user_id),
    String(req.body?.accountName || a.account_name).trim(),
    String(req.body?.accountType || a.account_type),
    req.body?.initialBalance === undefined ? n(a.initial_balance) : n(req.body.initialBalance),
    req.body?.currentBalance === undefined ? n(a.current_balance) : n(req.body.currentBalance),
    req.body?.isActive === undefined ? !!a.is_active : b(req.body.isActive),
    id
  ]);
  const next = await q("SELECT * FROM accounts WHERE account_id=? LIMIT 1", [id]);
  res.json(mapAccount(next[0]));
}));

app.delete("/api/accounts/:id", ah(async (req, res) => {
  const r = await q("DELETE FROM accounts WHERE account_id=?", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ message: "Account not found" });
  res.json({ message: "Account deleted" });
}));

app.get("/api/incomes", ah(async (_req, res) => {
  const rows = await q(`
    SELECT i.*,a.account_name,a.account_type FROM incomes i
    LEFT JOIN accounts a ON a.account_id=i.account_id
    ORDER BY i.date_received DESC,i.income_id DESC
  `);
  res.json(rows.map((r) => ({
    incomeId: r.income_id, amount: n(r.amount), incomeType: r.income_type, description: r.description, dateReceived: d(r.date_received), isRecurring: !!r.is_recurring,
    account: r.account_id ? { accountId: r.account_id, accountName: r.account_name, accountType: r.account_type } : null
  })));
}));

app.get("/api/incomes/:id", ah(async (req, res) => {
  const rows = await q(`
    SELECT i.*,a.account_name,a.account_type FROM incomes i
    LEFT JOIN accounts a ON a.account_id=i.account_id WHERE i.income_id=? LIMIT 1
  `, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Income not found" });
  const r = rows[0];
  res.json({ incomeId: r.income_id, amount: n(r.amount), incomeType: r.income_type, description: r.description, dateReceived: d(r.date_received), isRecurring: !!r.is_recurring, account: r.account_id ? { accountId: r.account_id, accountName: r.account_name, accountType: r.account_type } : null });
}));

app.get("/api/incomes/user/:userId", ah(async (req, res) => {
  const rows = await q(`
    SELECT i.*,a.account_name,a.account_type FROM incomes i
    LEFT JOIN accounts a ON a.account_id=i.account_id WHERE i.user_id=?
    ORDER BY i.date_received DESC,i.income_id DESC
  `, [req.params.userId]);
  res.json(rows.map((r) => ({ incomeId: r.income_id, amount: n(r.amount), incomeType: r.income_type, description: r.description, dateReceived: d(r.date_received), isRecurring: !!r.is_recurring, account: r.account_id ? { accountId: r.account_id, accountName: r.account_name, accountType: r.account_type } : null })));
}));

app.get("/api/incomes/user/:userId/total", ah(async (req, res) => {
  const rows = await q("SELECT COALESCE(SUM(amount),0) total FROM incomes WHERE user_id=?", [req.params.userId]);
  res.json({ total: n(rows[0]?.total) });
}));

app.post("/api/incomes", ah(async (req, res) => {
  const uid = Number(userId(req.body));
  const aid = req.body?.account?.accountId || req.body?.accountId || null;
  if (!uid || n(req.body?.amount) <= 0 || !d(req.body?.dateReceived)) return res.status(400).json({ message: "Invalid income payload" });
  const r = await q("INSERT INTO incomes(user_id,account_id,amount,income_type,description,date_received,is_recurring) VALUES (?,?,?,?,?,?,?)", [uid, aid, n(req.body?.amount), String(req.body?.incomeType || "Other"), req.body?.description || null, d(req.body?.dateReceived), b(req.body?.isRecurring)]);
  const rows = await q("SELECT * FROM incomes WHERE income_id=? LIMIT 1", [r.insertId]);
  res.status(201).json({ incomeId: rows[0].income_id, amount: n(rows[0].amount), incomeType: rows[0].income_type, description: rows[0].description, dateReceived: d(rows[0].date_received), isRecurring: !!rows[0].is_recurring });
}));

// ROUTES_PLACEHOLDER

app.all("/api/*", (_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, _req, res, _next) => {
  console.error("API error:", err);
  res.status(500).json({ message: "Internal server error", details: err.message });
});

(async () => {
  for (let i = 1; i <= 30; i += 1) {
    try {
      await q("SELECT 1");
      break;
    } catch (e) {
      if (i === 30) throw e;
      console.log(`Waiting for MySQL (${i}/30): ${e.message}`);
      await sleep(2000);
    }
  }
  await init();
  app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
})().catch((e) => {
  console.error("Startup failed:", e);
  process.exit(1);
});
