import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取联系记录列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;
  
  const { data, error } = await client
    .from('contact_records')
    .select('*')
    .eq('project_id', parseInt(id))
    .order('contact_time', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data: data || [] });
}

// 新增联系记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;
  
  const body = await request.json();
  
  const { data, error } = await client
    .from('contact_records')
    .insert({
      project_id: parseInt(id),
      contact_time: body.contact_time,
      delay_reason: body.delay_reason,
      notes: body.notes,
      attachment_key: body.attachment_key
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}