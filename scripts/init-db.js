// 离线建表脚本 - 独立 JS 文件避免 shell 转义问题
const path = require('path');
const appDir = path.resolve(__dirname, '..');
const bs3 = require(path.join(appDir, 'node_modules/better-sqlite3'));
const db = new bs3(path.join(appDir, 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const sqls = [
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pickup_date TEXT NOT NULL,
    company_name TEXT NOT NULL,
    project_code TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    branch_leader_signature TEXT,
    registrant TEXT NOT NULL,
    expected_payment_date TEXT NOT NULL,
    is_expired INTEGER DEFAULT 0 NOT NULL,
    project_manager TEXT,
    contract_amount REAL,
    final_amount REAL,
    payment_status TEXT DEFAULT '未缴费' NOT NULL,
    attachments TEXT,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(project_code)`,
  `CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_name)`,
  `CREATE INDEX IF NOT EXISTS idx_projects_payment_date ON projects(expected_payment_date)`,
  `CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(payment_status)`,
  `CREATE INDEX IF NOT EXISTS idx_projects_registrant ON projects(registrant)`,
  `CREATE TABLE IF NOT EXISTS contact_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    contact_time TEXT NOT NULL,
    delay_reason TEXT,
    notes TEXT,
    attachments TEXT,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_contacts_project ON contact_records(project_id)`,
  `CREATE INDEX IF NOT EXISTS idx_contacts_time ON contact_records(contact_time)`,
  `CREATE TABLE IF NOT EXISTS reviewers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_reviewers_name ON reviewers(name)`,
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT '查看' NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`
];

for (const sql of sqls) {
  try { db.exec(sql); } catch(e) {
    if (!e.message.includes('already exists')) console.error(e.message);
  }
}
db.close();
