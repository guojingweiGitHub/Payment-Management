import { NextRequest, NextResponse } from 'next/server';
import { db, asc } from '@/storage/database/supabase-client';
import { reviewers } from '@/storage/database/shared/schema';

// 获取审核推送人列表
export async function GET() {
  const data = db
    .select()
    .from(reviewers)
    .orderBy(asc(reviewers.name))
    .all();

  return NextResponse.json({ data: data || [] });
}

// 新增审核推送人
export async function POST(request: NextRequest) {
  const body = await request.json();

  const result = db
    .insert(reviewers)
    .values({ name: body.name })
    .returning()
    .get();

  return NextResponse.json({ data: result });
}
