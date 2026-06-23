// 必须在导入 Next.js 之前禁用 Turbopack
process.env.TURBOPACK = '0';

import('./server').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
