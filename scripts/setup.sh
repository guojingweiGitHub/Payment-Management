#!/bin/bash
# 初始化数据库 + 创建管理员
# 上传到 /opt/weijiaofei/ 运行: bash setup.sh
cd "$(dirname "$0")"
NODE=/usr/local/node/bin/node

$NODE -e "
var b = require('better-sqlite3'); var d = new b('data.db');
d.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT DEFAULT \"查看\" NOT NULL, created_at TEXT DEFAULT (datetime(\"now\")) NOT NULL)');
d.exec('CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, pickup_date TEXT NOT NULL, company_name TEXT NOT NULL, project_code TEXT NOT NULL UNIQUE, client_name TEXT NOT NULL, client_phone TEXT NOT NULL, branch_leader_signature TEXT, registrant TEXT NOT NULL, expected_payment_date TEXT NOT NULL, is_expired INTEGER DEFAULT 0 NOT NULL, project_manager TEXT, contract_amount REAL, final_amount REAL, payment_status TEXT DEFAULT \"未缴费\" NOT NULL, attachments TEXT, created_at TEXT DEFAULT (datetime(\"now\")) NOT NULL, updated_at TEXT)');
d.exec('CREATE TABLE IF NOT EXISTS contact_records (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, contact_time TEXT NOT NULL, delay_reason TEXT, notes TEXT, attachments TEXT, created_at TEXT DEFAULT (datetime(\"now\")) NOT NULL)');
d.close();
"

$NODE create-admin.js
echo "初始化完成"
