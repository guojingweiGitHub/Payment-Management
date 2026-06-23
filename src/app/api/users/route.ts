import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/lib/auth';

export async function GET() {
  const data = getAllUsers();
  const safeData = (data || []).map(({ password_hash, ...rest }) => rest);
  return NextResponse.json({ data: safeData });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const result = createUser(username, password, role || '查看');
    if (!result) {
      return NextResponse.json({ error: '创建失败，用户名可能已存在' }, { status: 400 });
    }

    const { password_hash, ...safeResult } = result;
    return NextResponse.json({ data: safeResult });
  } catch (error) {
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 });
  }
}
