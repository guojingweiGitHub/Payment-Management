import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '未缴费台账管理系统',
    template: '%s | 未缴费台账',
  },
  description: '未缴费台账管理系统，支持项目登记、缴费跟踪、到期提醒、批量导入导出。',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        <Toaster position="top-center" richColors />
        {children}
      </body>
    </html>
  );
}
