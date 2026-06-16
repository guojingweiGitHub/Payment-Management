import { NextRequest, NextResponse } from 'next/server';
import { db, eq, like, gte, lte, and, sql, desc } from '@/storage/database/supabase-client';
import { projects } from '@/storage/database/shared/schema';

// 获取项目列表
export async function GET(request: NextRequest) {
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

  const conditions = [];

  if (projectCode) {
    conditions.push(like(projects.project_code, `%${projectCode}%`));
  }
  if (companyName) {
    conditions.push(like(projects.company_name, `%${companyName}%`));
  }
  if (clientPhone) {
    conditions.push(like(projects.client_phone, `%${clientPhone}%`));
  }
  if (paymentStatus && paymentStatus !== 'all') {
    conditions.push(eq(projects.payment_status, paymentStatus));
  }
  if (isExpired && isExpired !== 'all') {
    conditions.push(eq(projects.is_expired, isExpired === 'true'));
  }
  if (pickupDateFrom) {
    conditions.push(gte(projects.pickup_date, pickupDateFrom));
  }
  if (pickupDateTo) {
    conditions.push(lte(projects.pickup_date, pickupDateTo));
  }
  if (expectedDateFrom) {
    conditions.push(gte(projects.expected_payment_date, expectedDateFrom));
  }
  if (expectedDateTo) {
    conditions.push(lte(projects.expected_payment_date, expectedDateTo));
  }
  if (daysBeforeExpired) {
    const days = parseInt(daysBeforeExpired);
    const today = new Date();
    const targetDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    conditions.push(lte(projects.expected_payment_date, targetDate.toISOString()));
    conditions.push(gte(projects.expected_payment_date, today.toISOString()));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 查询总数
  const countResult = db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(whereClause)
    .get();
  const total = countResult?.count || 0;

  // 分页查询
  const offset = (page - 1) * pageSize;
  const data = db
    .select()
    .from(projects)
    .where(whereClause)
    .orderBy(desc(projects.created_at))
    .limit(pageSize)
    .offset(offset)
    .all();

  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  });
}

// 新增项目
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 工程编号唯一性校验
  const existing = db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.project_code, body.project_code))
    .get();

  if (existing) {
    return NextResponse.json({ error: '工程编号已存在，请使用其他编号' }, { status: 400 });
  }

  // 计算是否到期
  const expectedDate = new Date(body.expected_payment_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expectedDate.setHours(0, 0, 0, 0);
  const isExpired = expectedDate <= today;

  const insertResult = db
    .insert(projects)
    .values({
      ...body,
      is_expired: isExpired,
      payment_status: '未缴费'
    })
    .returning()
    .get();

  return NextResponse.json({ data: insertResult });
}
