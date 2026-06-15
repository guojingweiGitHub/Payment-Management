import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

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

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

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
    
    // 生成文件名（保留原始名称）
    const fileName = `attachments/${Date.now()}_${file.name}`;
    
    // 上传到对象存储
    const key = await storage.uploadFile({
      fileContent: fileBuffer,
      fileName: fileName,
      contentType: file.type,
    });
    
    // 生成访问 URL
    const url = await storage.generatePresignedUrl({
      key: key,
      expireTime: 86400 * 30 // 30天有效期
    });
    
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
  
  try {
    const url = await storage.generatePresignedUrl({
      key: key,
      expireTime: 86400 // 1天有效期
    });
    
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '获取URL失败' 
    }, { status: 500 });
  }
}