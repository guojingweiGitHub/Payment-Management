import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/storage/database/supabase-client';
import { projects, reviewers } from '@/storage/database/shared/schema';

// 发送审核推送通知
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { reviewerName } = body;

  // 获取项目信息
  const project = db
    .select()
    .from(projects)
    .where(eq(projects.id, parseInt(id)))
    .get();

  if (!project) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }

  // 获取审核推送人信息
  const reviewer = db
    .select()
    .from(reviewers)
    .where(eq(reviewers.name, reviewerName))
    .get();

  if (!reviewer) {
    return NextResponse.json({ error: '审核推送人不存在' }, { status: 400 });
  }

  const notification = {
    projectId: parseInt(id),
    projectCode: project.project_code,
    companyName: project.company_name,
    reviewerName: reviewerName,
    message: `项目 ${project.project_code} (${project.company_name}) 需要审核，请及时处理。`,
    sentAt: new Date().toISOString()
  };

  return NextResponse.json({
    success: true,
    notification
  });
}
