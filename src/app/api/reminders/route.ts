import { NextRequest, NextResponse } from 'next/server';
import { db, eq, lte, and, asc } from '@/storage/database/supabase-client';
import { projects } from '@/storage/database/shared/schema';

// 获取到期提醒列表
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const daysThreshold = parseInt(searchParams.get('days') || '7');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(today.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  const data = db
    .select()
    .from(projects)
    .where(and(
      eq(projects.payment_status, '未缴费'),
      lte(projects.expected_payment_date, targetDate.toISOString())
    ))
    .orderBy(asc(projects.expected_payment_date))
    .all();

  const remindersByRegistrant: Record<string, {
    registrant: string;
    total: number;
    expired: number;
    upcoming: number;
    projects: Array<{
      id: number;
      project_code: string;
      company_name: string;
      expected_payment_date: string;
      is_expired: boolean;
    }>;
  }> = {};

  for (const project of data || []) {
    if (!remindersByRegistrant[project.registrant]) {
      remindersByRegistrant[project.registrant] = {
        registrant: project.registrant,
        total: 0,
        expired: 0,
        upcoming: 0,
        projects: []
      };
    }

    remindersByRegistrant[project.registrant].total++;
    if (project.is_expired) {
      remindersByRegistrant[project.registrant].expired++;
    } else {
      remindersByRegistrant[project.registrant].upcoming++;
    }

    remindersByRegistrant[project.registrant].projects.push({
      id: project.id,
      project_code: project.project_code,
      company_name: project.company_name,
      expected_payment_date: project.expected_payment_date,
      is_expired: project.is_expired
    });
  }

  return NextResponse.json({
    threshold: daysThreshold,
    total: data?.length || 0,
    reminders: Object.values(remindersByRegistrant)
  });
}
