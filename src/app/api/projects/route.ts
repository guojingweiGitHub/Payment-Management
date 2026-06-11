import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取项目列表
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  
  const searchParams = request.nextUrl.searchParams;
  const projectCode = searchParams.get('project_code');
  const companyName = searchParams.get('company_name');
  const clientPhone = searchParams.get('client_phone');
  const paymentStatus = searchParams.get('payment_status');
  const isExpired = searchParams.get('is_expired');
  const pickupDateFrom = searchParams.get('pickup_date_from');
  const pickupDateTo = searchParams.get('pickup_date_to');
  const expectedDateFrom = searchParams.get('expected_date_from');
  const expectedDateTo = searchParams.get('expected_date_to');
  const daysBeforeExpired = searchParams.get('days_before_expired');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  
  let query = client
    .from('projects')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  
  // 精确查询
  if (projectCode) {
    query = query.ilike('project_code', `%${projectCode}%`);
  }
  if (companyName) {
    query = query.ilike('company_name', `%${companyName}%`);
  }
  if (clientPhone) {
    query = query.ilike('client_phone', `%${clientPhone}%`);
  }
  if (paymentStatus && paymentStatus !== 'all') {
    query = query.eq('payment_status', paymentStatus);
  }
  if (isExpired && isExpired !== 'all') {
    query = query.eq('is_expired', isExpired === 'true');
  }
  
  // 日期范围查询
  if (pickupDateFrom) {
    query = query.gte('pickup_date', pickupDateFrom);
  }
  if (pickupDateTo) {
    query = query.lte('pickup_date', pickupDateTo);
  }
  if (expectedDateFrom) {
    query = query.gte('expected_payment_date', expectedDateFrom);
  }
  if (expectedDateTo) {
    query = query.lte('expected_payment_date', expectedDateTo);
  }
  
  // 临近到期筛选（N天内到期）
  if (daysBeforeExpired) {
    const days = parseInt(daysBeforeExpired);
    const today = new Date();
    const targetDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    query = query.lte('expected_payment_date', targetDate.toISOString());
    query = query.gte('expected_payment_date', today.toISOString());
  }
  
  // 分页
  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + pageSize - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({
    data,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize)
  });
}

// 新增项目
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  const body = await request.json();
  
  // 工程编号唯一性校验
  const { data: existing, error: checkError } = await client
    .from('projects')
    .select('id')
    .eq('project_code', body.project_code)
    .maybeSingle();
  
  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }
  
  if (existing) {
    return NextResponse.json({ error: '工程编号已存在，请使用其他编号' }, { status: 400 });
  }
  
  // 计算是否到期
  const expectedDate = new Date(body.expected_payment_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expectedDate.setHours(0, 0, 0, 0);
  const isExpired = expectedDate <= today;
  
  const { data, error } = await client
    .from('projects')
    .insert({
      ...body,
      is_expired: isExpired,
      payment_status: '未缴费'
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}