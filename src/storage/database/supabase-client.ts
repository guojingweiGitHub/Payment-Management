import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './shared/schema';
import { eq, like, and, or, gte, lte, sql, inArray, desc, asc } from 'drizzle-orm';

// 数据库文件存储在项目根目录
const sqlite = new Database('data.db');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export { eq, like, and, or, gte, lte, sql, inArray, desc, asc };
