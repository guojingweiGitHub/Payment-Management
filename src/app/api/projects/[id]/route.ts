import { NextRequest, NextResponse } from 'next/server';
import { db, eq, desc } from '@/storage/database/supabase-client';
import { projects, contactRecords } from '@/storage/database/shared/schema';

// 获取项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = db
    .select()
    .from(projects)
    .where(eq(projects.id, parseInt(id)))
    .get();

  if (!project) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }

  // 获取联系记录
  const contacts = db
    .select()
    .from(contactRecords)
    .where(eq(contactRecords.project_id, parseInt(id)))
    .orderBy(desc(contactRecords.contact_time))
    .all();

  return NextResponse.json({ 
    project,
    contacts: contacts || []
  });
}

// 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // 计算是否到期
  if (body.expected_payment_date) {
    const expectedDate = new Date(body.expected_payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expectedDate.setHours(0, 0, 0, 0);
    body.is_expired = expectedDate <= today;
  }

  const result = db
    .update(projects)
    .set(body)
    .where(eq(projects.id, parseInt(id)))
    .returning()
    .get();

  if (!result) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }

  return NextResponse.json({ data: result });
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  db.delete(projects)
    .where(eq(projects.id, parseInt(id)))
    .run();

  return NextResponse.json({ success: true });
}
