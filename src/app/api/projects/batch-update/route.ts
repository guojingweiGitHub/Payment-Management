import { NextRequest, NextResponse } from 'next/server';
import { db, eq, inArray } from '@/storage/database/supabase-client';
import { projects } from '@/storage/database/shared/schema';

// 批量更新项目（批量打折）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, discount_rate, fields } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '未提供有效的项目ID' }, { status: 400 });
    }

    if (!discount_rate || discount_rate < 0 || discount_rate > 1) {
      return NextResponse.json({ error: '折扣比例无效，应为0-1之间的数值' }, { status: 400 });
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: '未指定要打折的字段' }, { status: 400 });
    }

    const validFields = ['agreement_amount', 'actual_amount', 'final_amount'];
    const invalidFields = fields.filter((f: string) => !validFields.includes(f));
    if (invalidFields.length > 0) {
      return NextResponse.json({ error: `无效的字段: ${invalidFields.join(', ')}` }, { status: 400 });
    }

    const projectList = db
      .select()
      .from(projects)
      .where(inArray(projects.id, ids))
      .all();

    if (!projectList || projectList.length === 0) {
      return NextResponse.json({ error: '未找到要更新的项目' }, { status: 404 });
    }

    let successCount = 0;
    let failedCount = 0;

    for (const project of projectList) {
      const updateData: Record<string, number> = {};

      for (const field of fields as string[]) {
        const currentAmount = (project as any)[field];
        if (currentAmount) {
          const newAmount = parseFloat(String(currentAmount)) * discount_rate;
          updateData[field] = Math.round(newAmount * 100) / 100;
        }
      }

      if (Object.keys(updateData).length > 0) {
        try {
          db.update(projects)
            .set(updateData)
            .where(eq(projects.id, project.id))
            .run();
          successCount++;
        } catch {
          failedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated: successCount,
      failed: failedCount,
      total: ids.length,
      discount_rate: discount_rate,
    });
  } catch (error) {
    console.error('批量更新失败:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '更新失败' 
    }, { status: 500 });
  }
}
