import { NextRequest, NextResponse } from 'next/server';
import { db, eq, desc } from '@/storage/database/supabase-client';
import { contactRecords } from '@/storage/database/shared/schema';

// 获取联系记录列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const data = db
    .select()
    .from(contactRecords)
    .where(eq(contactRecords.project_id, parseInt(id)))
    .orderBy(desc(contactRecords.contact_time))
    .all();

  return NextResponse.json({ data: data || [] });
}

// 新增联系记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = db
    .insert(contactRecords)
    .values({
      project_id: parseInt(id),
      contact_time: body.contact_time,
      delay_reason: body.delay_reason,
      notes: body.notes,
      attachments: body.attachments
    })
    .returning()
    .get();

  return NextResponse.json({ data: result });
}
