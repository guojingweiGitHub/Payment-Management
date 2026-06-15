import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取审核推送人列表
export async function GET() {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('reviewers')
    .select('*')
    .order('name');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data: data || [] });
}

// 初始化审核推送人（高庆强、刘玉春、薛蛟）
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  const body = await request.json();
  
  const { data, error } = await client
    .from('reviewers')
    .insert({ name: body.name })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}