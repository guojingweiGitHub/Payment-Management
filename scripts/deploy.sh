#!/bin/bash
set -Eeuo pipefail

APP_NAME="payment-app"
APP_DIR="${APP_DIR:-$(pwd)}"
BACKUP_DIR="${BACKUP_DIR:-${APP_DIR}/backup}"

echo "========================================="
echo "  未缴费台账 - 自动化部署"
echo "========================================="

cd "${APP_DIR}"

# 1. 备份数据库
echo ""
echo "[1/7] 备份数据库..."
mkdir -p "${BACKUP_DIR}"
if [ -f data.db ]; then
  cp data.db "${BACKUP_DIR}/data_$(date +%Y%m%d_%H%M%S).db"
  echo "  ✓ 数据库已备份"
else
  echo "  ⚠ data.db 不存在，跳过"
fi

# 2. 拉取最新代码
echo ""
echo "[2/7] 拉取代码（丢弃所有本地未提交修改）..."
git checkout .
git pull 2>/dev/null && echo "  ✓ 代码已更新" || echo "  ⚠ 未检测到 git 仓库或拉取失败，继续部署"

# 3. 安装依赖
echo ""
echo "[3/7] 安装依赖..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install --no-frozen-lockfile
echo "  ✓ 依赖安装完成"

# 4. 构建项目
echo ""
echo "[4/7] 构建项目..."
pnpm next build
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
echo "  ✓ 构建完成"

# 5. 数据库迁移
echo ""
echo "[5/7] 数据库迁移..."
npx drizzle-kit push 2>/dev/null || pnpm drizzle-kit push
echo "  ✓ 数据库迁移完成"

# 6. 重启服务
echo ""
echo "[6/7] 重启服务..."

# 加载 nvm 环境（确保 PM2 能找到 Node.js）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 获取 Node 解释器路径
NODE_BIN=$(which node 2>/dev/null || echo "node")

if pm2 list 2>/dev/null | grep -q "${APP_NAME}"; then
  pm2 restart "${APP_NAME}" --update-env
  echo "  ✓ 服务已重启"
else
  # 优先使用 pm2.config.cjs，否则直接启动
  if [ -f pm2.config.cjs ]; then
    pm2 start pm2.config.cjs
  else
    pm2 start dist/server.js --name "${APP_NAME}" --interpreter "${NODE_BIN}"
  fi
  pm2 save
  echo "  ✓ 服务已启动"
fi

# 7. 健康检查
echo ""
echo "[7/7] 健康检查..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
  echo "  ✓ 服务正常 (HTTP ${HTTP_CODE})"
else
  echo "  ✗ 服务异常 (HTTP ${HTTP_CODE})，请检查日志: pm2 logs ${APP_NAME}"
fi

echo ""
echo "========================================="
echo "  部署完成！"
echo "========================================="
pm2 status
