import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;
  
  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('id', parseInt(id))
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!data) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }
  
  // 获取联系记录
  const { data: contacts, error: contactsError } = await client
    .from('contact_records')
    .select('*')
    .eq('project_id', parseInt(id))
    .order('contact_time', { ascending: false });
  
  if (contactsError) {
    return NextResponse.json({ error: contactsError.message }, { status: 500 });
  }
  
  return NextResponse.json({ 
    project: data,
    contacts: contacts || []
  });
}

// 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
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
  
  const { data, error } = await client
    .from('projects')
    .update(body)
    .eq('id', parseInt(id))
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;
  
  const { error } = await client
    .from('projects')
    .delete()
    .eq('id', parseInt(id));
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}