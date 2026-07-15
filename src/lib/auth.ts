import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import { db, eq } from '@/storage/database/supabase-client';
import { users } from '@/storage/database/shared/schema';

const SESSION_COOKIE = 'session_token';
const SECRET = process.env.AUTH_SECRET || 'default-secret-change-in-production';

export interface User {
  id: number;
  username: string;
  role: string;
}

// 哈希密码
function hashPassword(password: string): string {
  return createHash('sha256')
    .update(password + ':' + SECRET)
    .digest('hex');
}

// 生成 session token
function generateToken(userId: number, username: string, role: string): string {
  const payload = Buffer.from(`${userId}:${username}:${role}:${Date.now()}`).toString('base64');
  const signature = createHash('sha256')
    .update(`${payload}:${SECRET}`)
    .digest('hex');
  return `${payload}.${signature}`;
}

// 验证 token 并返回用户信息
export function verifyToken(token: string): User | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    
    const expectedSig = createHash('sha256')
      .update(`${payload}:${SECRET}`)
      .digest('hex');
    if (expectedSig !== signature) return null;
    
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length < 4) return null;
    
    return {
      id: parseInt(parts[0]),
      username: parts[1],
      role: parts[2]
    };
  } catch {
    return null;
  }
}

// 验证登录
export function verifyLogin(username: string, password: string): { user: User; token: string } | null {
  const passwordHash = hashPassword(password);
  const user = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!user || user.password_hash !== passwordHash) {
    return null;
  }

  const token = generateToken(user.id, user.username, user.role);
  return {
    user: { id: user.id, username: user.username, role: user.role },
    token
  };
}

// 设置 session cookie（用于 API route）
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false, // 内网 HTTP
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 天
  });
}

// 清除 session cookie
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: false, // 内网 HTTP
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

// 从 cookie 获取当前用户
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

// 创建用户
export function createUser(username: string, password: string, role: string = '查看') {
  const passwordHash = hashPassword(password);
  return db
    .insert(users)
    .values({ username, password_hash: passwordHash, role })
    .returning()
    .get();
}

// 更新用户
export function updateUser(id: number, data: { username?: string; password?: string; role?: string }) {
  const updateData: Record<string, any> = {};
  if (data.username) updateData.username = data.username;
  if (data.password) updateData.password_hash = hashPassword(data.password);
  if (data.role) updateData.role = data.role;
  return db.update(users).set(updateData).where(eq(users.id, id)).returning().get();
}

// 删除用户
export function deleteUser(id: number) {
  return db.delete(users).where(eq(users.id, id)).run();
}

// 获取所有用户
export function getAllUsers() {
  return db.select().from(users).orderBy(users.created_at).all();
}
