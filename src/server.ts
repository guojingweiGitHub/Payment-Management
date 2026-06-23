import { createServer } from 'http';
import { parse } from 'url';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import next from 'next';
import { db, eq } from '@/storage/database/supabase-client';
import { users } from '@/storage/database/shared/schema';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // 自动执行数据库迁移（仅开发模式，生产环境由 deploy.sh 处理）
  if (dev) {
    try {
      execSync('npx drizzle-kit push', { stdio: 'pipe', timeout: 30000 });
      console.log('Database migration completed.');
    } catch {
      console.warn('Database migration skipped (drizzle-kit may not be available).');
    }
  }
  
  // 创建默认管理员账号（如果不存在）
  try {
    const existingAdmin = db.select().from(users).where(eq(users.username, 'admin')).get();
    if (!existingAdmin) {
      const AUTH_SECRET = process.env.AUTH_SECRET || 'default-secret-change-in-production';
      const passwordHash = createHash('sha256')
        .update('admin123:' + AUTH_SECRET)
        .digest('hex');
      db.insert(users).values({
        username: 'admin',
        password_hash: passwordHash,
        role: 'admin'
      }).run();
      console.log('Default admin user created (admin/admin123).');
    }
  } catch (err) {
    console.warn('Admin user check skipped:', (err as Error).message);
  }
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });
  server.once('error', err => {
    console.error(err);
    process.exit(1);
  });
  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : 'production'
      }`,
    );
  });
});
