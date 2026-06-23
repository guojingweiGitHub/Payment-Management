import { NextResponse } from 'next/server';
import { getSessionToken, verifyToken } from '@/lib/auth';

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: '会话已过期' }, { status: 401 });
  }

  return NextResponse.json({ user });
}
