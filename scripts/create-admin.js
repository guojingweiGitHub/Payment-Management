// 建表 + 创建管理员
var path = require('path');
var crypto = require('crypto');
var appDir = __dirname;

var bs3 = require(path.join(appDir, 'node_modules/better-sqlite3'));
var db = new bs3(path.join(appDir, 'data.db'));

// 先建表
db.exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT DEFAULT '查看' NOT NULL, created_at TEXT DEFAULT (datetime('now')) NOT NULL)");
db.exec("CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, pickup_date TEXT NOT NULL, company_name TEXT NOT NULL, project_code TEXT NOT NULL UNIQUE, client_name TEXT NOT NULL, client_phone TEXT NOT NULL, branch_leader_signature TEXT, registrant TEXT NOT NULL, expected_payment_date TEXT NOT NULL, is_expired INTEGER DEFAULT 0 NOT NULL, project_manager TEXT, contract_amount REAL, final_amount REAL, payment_status TEXT DEFAULT '未缴费' NOT NULL, attachments TEXT, created_at TEXT DEFAULT (datetime('now')) NOT NULL, updated_at TEXT)");
db.exec("CREATE TABLE IF NOT EXISTS contact_records (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, contact_time TEXT NOT NULL, delay_reason TEXT, notes TEXT, attachments TEXT, created_at TEXT DEFAULT (datetime('now')) NOT NULL)");

// 创建 admin
var secret = process.env.AUTH_SECRET || 'default-secret-change-in-production';
var hash = crypto.createHash('sha256').update('admin123:' + secret).digest('hex');

try {
  db.exec("INSERT INTO users (username, password_hash, role) VALUES ('admin', '" + hash + "', 'admin')");
  console.log('admin 用户已创建，密码: admin123');
} catch(e) {
  if (e.message.includes('UNIQUE')) {
    console.log('admin 用户已存在');
  } else {
    console.error('创建失败:', e.message);
  }
}
db.close();
