import { NextRequest, NextResponse } from 'next/server';
import { updateUser, deleteUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = updateUser(parseInt(id), body);
    if (!result) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    const { password_hash, ...safeResult } = result;
    return NextResponse.json({ data: safeResult });
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteUser(parseInt(id));
  return NextResponse.json({ success: true });
}
