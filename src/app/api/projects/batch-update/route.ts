import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 批量更新项目（批量打折）
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { ids, discount_rate, fields } = body;
    
    // ids: 要更新的项目ID数组
    // discount_rate: 折扣比例（如 0.95 表示95%，即打折5%）
    // fields: 要打折的字段数组 ['agreement_amount', 'actual_amount', 'final_amount']
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '未提供有效的项目ID' }, { status: 400 });
    }
    
    if (!discount_rate || discount_rate < 0 || discount_rate > 1) {
      return NextResponse.json({ error: '折扣比例无效，应为0-1之间的数值' }, { status: 400 });
    }
    
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: '未指定要打折的字段' }, { status: 400 });
    }
    
    // 验证字段名称
    const validFields = ['agreement_amount', 'actual_amount', 'final_amount'];
    const invalidFields = fields.filter(f => !validFields.includes(f));
    if (invalidFields.length > 0) {
      return NextResponse.json({ error: `无效的字段: ${invalidFields.join(', ')}` }, { status: 400 });
    }
    
    // 获取要更新的项目
    const { data: projects, error: fetchError } = await client
      .from('projects')
      .select('id, agreement_amount, actual_amount, final_amount')
      .in('id', ids);
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!projects || projects.length === 0) {
      return NextResponse.json({ error: '未找到要更新的项目' }, { status: 404 });
    }
    
    // 执行批量更新
    const updatePromises = projects.map(async (project) => {
      const updateData: Record<string, string> = {};
      
      for (const field of fields) {
        const currentAmount = project[field as keyof typeof project];
        if (currentAmount) {
          // 计算打折后的金额
          const newAmount = parseFloat(currentAmount as string) * discount_rate;
          updateData[field] = newAmount.toFixed(2);
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        const { error } = await client
          .from('projects')
          .update(updateData)
          .eq('id', project.id);
        
        return { id: project.id, success: !error, error: error?.message };
      }
      
      return { id: project.id, success: true, skipped: true };
    });
    
    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: true,
      updated: successCount,
      failed: failedCount,
      total: ids.length,
      discount_rate: discount_rate,
      details: results.filter(r => !r.success || r.skipped)
    });
  } catch (error) {
    console.error('批量更新失败:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '更新失败' 
    }, { status: 500 });
  }
}