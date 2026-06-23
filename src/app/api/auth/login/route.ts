import { NextRequest, NextResponse } from 'next/server';
import { verifyLogin, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
    }

    const result = verifyLogin(username, password);
    if (!result) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    await setSessionCookie(result.token);

    return NextResponse.json({
      user: result.user
    });
  } catch (error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
