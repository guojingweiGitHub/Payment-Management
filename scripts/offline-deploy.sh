#!/bin/bash
# ==========================================
#  未缴费台账 - 离线部署（零依赖，无网络）
#  用法: bash offline-deploy.sh
#  项目目录: /opt/weijiaofei
# ==========================================
set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="5000"

echo "========================================="
echo "  未缴费台账 - 离线部署"
echo "  ${APP_DIR}"
echo "========================================="

# ---- 1. 找到 Node.js ----
echo ""
echo "[1/3] 查找 Node.js..."

NODE_BIN=""
for p in /home/ubuntu/node/bin/node /usr/local/node/bin/node /usr/bin/node; do
  if [ -x "$p" ]; then
    NODE_BIN="$p"
    break
  fi
done
if [ -z "$NODE_BIN" ] && command -v node &>/dev/null; then
  NODE_BIN="$(which node)"
fi
if [ -z "$NODE_BIN" ]; then
  echo "  ✗ 未找到 Node.js"
  exit 1
fi
echo "  ✓ Node.js: $($NODE_BIN -v)"

# ---- 2. 替换 Linux 二进制 + 建表 + 启动 ----
echo ""
echo "[2/3] 初始化..."

cd "$APP_DIR"

# 替换 better-sqlite3 Linux 预编译二进制
BS_SRC="nodejs/better_sqlite3-linux.node"
BS_DIR="node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3/build/Release"
if [ -f "$BS_SRC" ]; then
  mkdir -p "$BS_DIR"
  cp "$BS_SRC" "${BS_DIR}/better_sqlite3.node"
  echo "  ✓ Linux 二进制已替换"
fi

# 直接建表（不走 drizzle-kit）
echo "  ✓ 初始化数据库..."
"$NODE_BIN" scripts/init-db.js
echo "  ✓ 数据库就绪"

# ---- 3. 启动 ----
echo ""
echo "[3/3] 启动服务..."

# 先停掉旧进程
pkill -f "node.*dist/server" 2>/dev/null || true

nohup env NODE_ENV=production HOSTNAME=0.0.0.0 PORT="$PORT" "$NODE_BIN" dist/server.js \
  > output.log 2>&1 &

echo "  ✓ 后台启动 (PID: $!)"
sleep 2

# 健康检查
if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}" 2>/dev/null | grep -qE "200|302"; then
  echo ""
  echo "========================================="
  echo "  部署成功！"
  echo "  访问: http://10.1.18.232:${PORT}"
  echo "  账号: admin / admin123"
  echo "========================================="
else
  echo ""
  echo "========================================="
  echo "  已启动，查看日志: tail -f ${APP_DIR}/output.log"
  echo "  访问: http://10.1.18.232:${PORT}"
  echo "  账号: admin / admin123"
  echo "========================================="
fi
