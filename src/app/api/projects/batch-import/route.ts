import { NextRequest, NextResponse } from 'next/server';
import { db, eq } from '@/storage/database/supabase-client';
import { projects } from '@/storage/database/shared/schema';

// 批量导入项目
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '未提供文件' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json({ error: 'Excel 文件无数据' }, { status: 400 });
    }

    const fieldMapping: Record<string, string> = {
      '拿图日期': 'pickup_date',
      '单位名称': 'company_name',
      '工程编号': 'project_code',
      '甲方姓名': 'client_name',
      '甲方电话': 'client_phone',
      '分院领导签字': 'branch_leader_signature',
      '登记人': 'registrant',
      '预计缴费日期': 'expected_payment_date',
      '项目负责人': 'project_manager',
      '合同总额': 'contract_amount',
      '决算金额': 'final_amount',
    };

    const projectsToInsert: Array<Record<string, unknown>> = [];
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as Record<string, unknown>;
      const rowNum = i + 2;

      const project: Record<string, unknown> = {};

      for (const [excelField, dbField] of Object.entries(fieldMapping)) {
        if (row[excelField] !== undefined && row[excelField] !== '') {
          if (['pickup_date', 'expected_payment_date'].includes(dbField)) {
            const dateValue = row[excelField];
            if (typeof dateValue === 'number') {
              const date = new Date((dateValue - 25569) * 86400 * 1000);
              project[dbField] = date.toISOString();
            } else if (typeof dateValue === 'string') {
              project[dbField] = new Date(dateValue).toISOString();
            }
          } else {
            project[dbField] = row[excelField];
          }
        }
      }

      const requiredFields = ['pickup_date', 'company_name', 'project_code', 'client_name', 'client_phone', 'registrant', 'expected_payment_date'];
      const missingFields = requiredFields.filter(f => !project[f]);

      if (missingFields.length > 0) {
        errors.push({ row: rowNum, message: `缺少必填字段: ${missingFields.join(', ')}` });
        continue;
      }

      // 检查工程编号是否已存在
      const existing = db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.project_code, project.project_code as string))
        .get();

      if (existing) {
        errors.push({ row: rowNum, message: `工程编号已存在: ${project.project_code}` });
        continue;
      }

      // 计算是否到期
      const expectedDate = new Date(project.expected_payment_date as string);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expectedDate.setHours(0, 0, 0, 0);
      project.is_expired = expectedDate <= today;
      project.payment_status = '未缴费';

      projectsToInsert.push(project);
    }

    let insertedCount = 0;
    if (projectsToInsert.length > 0) {
      const result = db.insert(projects).values(projectsToInsert as any).run();
      insertedCount = result.changes;
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      skipped: errors.length,
      total: jsonData.length,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('批量导入失败:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '导入失败' 
    }, { status: 500 });
  }
}
