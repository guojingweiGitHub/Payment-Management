import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';

// 生成 Word 文档
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    // 获取项目详情
    const { data: project, error } = await client
      .from('projects')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    
    if (error || !project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }
    
    // 格式化日期
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN');
    };
    
    // 格式化金额
    const formatAmount = (amount: string | number | null) => {
      if (!amount) return '-';
      return `¥${parseFloat(amount as string).toFixed(2)}`;
    };
    
    // 创建 Word 文档
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // 标题
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '项目收款管理单',
                bold: true,
                size: 28
              })
            ]
          }),
          // 空行
          new Paragraph({ children: [] }),
          // 基本信息
          new Paragraph({
            children: [
              new TextRun({
                text: '基本信息',
                bold: true,
                size: 24
              })
            ]
          }),
          // 信息表格
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '工程编号', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.project_code || '-' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '单位名称', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.company_name || '-' })] })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '拿图日期', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatDate(project.pickup_date) })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '预计缴费日期', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatDate(project.expected_payment_date) })] })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '甲方姓名', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.client_name || '-' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '甲方电话', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.client_phone || '-' })] })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '项目负责人', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.project_manager || '-' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '登记人', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.registrant || '-' })] })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '分院领导签字', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.branch_leader_signature || '-' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '缴费状态', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: project.payment_status || '-' })] })] }),
                ]
              }),
            ]
          }),
          // 空行
          new Paragraph({ children: [] }),
          // 金额信息
          new Paragraph({
            children: [
              new TextRun({
                text: '金额信息',
                bold: true,
                size: 24
              })
            ]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '合同总额', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatAmount(project.contract_amount) })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '协议金额', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatAmount(project.agreement_amount) })] })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '实际金额', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatAmount(project.actual_amount) })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '决算金额', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatAmount(project.final_amount) })] })] }),
                ]
              }),
            ]
          }),
          // 空行
          new Paragraph({ children: [] }),
          // 状态信息
          new Paragraph({
            children: [
              new TextRun({
                text: `到期状态: ${project.is_expired ? '已到期' : '未到期'}`,
                color: project.is_expired ? 'FF0000' : '000000'
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `创建时间: ${formatDate(project.created_at)}`,
              })
            ]
          }),
        ]
      }]
    });
    
    // 生成文档 buffer
    const buffer = await Packer.toBuffer(doc);
    
    // 返回文件下载 (将 Buffer 转换为 Uint8Array)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="项目_${project.project_code}_收款单.docx"`,
      }
    });
  } catch (error) {
    console.error('生成文档失败:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '生成失败' 
    }, { status: 500 });
  }
}