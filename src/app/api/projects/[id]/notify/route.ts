import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 发送审核推送通知
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;
  
  const body = await request.json();
  const { reviewerName } = body;
  
  // 获取项目信息
  const { data: project, error: projectError } = await client
    .from('projects')
    .select('*')
    .eq('id', parseInt(id))
    .single();
  
  if (projectError || !project) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }
  
  // 获取审核推送人信息
  const { data: reviewer, error: reviewerError } = await client
    .from('reviewers')
    .select('*')
    .eq('name', reviewerName)
    .single();
  
  if (reviewerError || !reviewer) {
    return NextResponse.json({ error: '审核推送人不存在' }, { status: 400 });
  }
  
  // 在实际应用中，这里应该调用邮件/短信/消息推送服务
  // 目前仅返回模拟结果
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