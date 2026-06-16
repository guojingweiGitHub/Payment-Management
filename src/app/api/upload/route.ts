import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

// 允许的文件类型
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 上传目录
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// 上传文件
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: '未提供文件' }, { status: 400 });
    }
    
    // 检查文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: '不支持的文件类型，仅支持 PDF、图片、Word 文档' 
      }, { status: 400 });
    }
    
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: '文件大小超过限制（最大10MB）' 
      }, { status: 400 });
    }
    
    // 读取文件内容
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // 生成唯一文件名
    const key = `${Date.now()}_${file.name}`;
    const filePath = path.join(UPLOAD_DIR, key);
    
    // 写入文件到本地
    await writeFile(filePath, fileBuffer);
    
    // 文件访问 URL
    const url = `/uploads/${key}`;
    
    return NextResponse.json({
      key: key,
      name: file.name,
      type: file.type,
      size: file.size,
      url: url
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '上传失败' 
    }, { status: 500 });
  }
}

// 获取文件访问 URL
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: '未提供文件 key' }, { status: 400 });
  }
  
  // 本地文件直接返回相对路径
  return NextResponse.json({ url: `/uploads/${key}` });
}
