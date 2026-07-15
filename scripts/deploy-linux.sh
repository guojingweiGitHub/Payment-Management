#!/bin/bash
# ==========================================
#  未缴费台账 - 服务器端完整部署（Linux 重建）
#  上传到 /opt/weijiaofei/ 后运行: bash deploy-linux.sh
# ==========================================
set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="5000"

echo "========================================="
echo "  未缴费台账 - Linux 部署"
echo "  ${APP_DIR}"
echo "========================================="

# ---- 1. 找 Node.js ----
echo ""
echo "[1/5] 查找 Node.js..."

NODE_BIN=""
for p in /home/ubuntu/node/bin/node /usr/local/node/bin/node /usr/bin/node; do
  [ -x "$p" ] && NODE_BIN="$p" && break
done
[ -z "$NODE_BIN" ] && command -v node &>/dev/null && NODE_BIN="$(which node)"
[ -z "$NODE_BIN" ] && echo "✗ 未找到 Node.js" && exit 1
echo "  ✓ $($NODE_BIN -v)"

# ---- 2. 找工具路径 ----
echo ""
echo "[2/5] 定位构建工具..."
cd "$APP_DIR"

# 找 next CLI
NEXT_CLI=$(find node_modules/.pnpm -path "*/next@*/node_modules/next/dist/bin/next" -type f 2>/dev/null | head -1)
NEXT_CLI=${NEXT_CLI:-$(find node_modules -path "*/next/dist/bin/next" -type f 2>/dev/null | head -1)}

# 找 tsup CLI  
TSUP_CLI=$(find node_modules/.pnpm -path "*/tsup@*/dist/cli-default.js" -type f 2>/dev/null | head -1)

# 找 better-sqlite3
BS3=$(find node_modules/.pnpm -name "better-sqlite3" -maxdepth 4 -type d 2>/dev/null | head -1)
BS3=${BS3:-$(find node_modules -name "better-sqlite3" -maxdepth 2 -type d 2>/dev/null | head -1)}

echo "  next: ${NEXT_CLI:-未找到}"
echo "  tsup: ${TSUP_CLI:-未找到}"
echo "  bs3:  ${BS3:-未找到}"

# ---- 3. 重建项目（匹配 Linux） ----
echo ""
echo "[3/5] 在服务器上重建（适配 Linux）..."

# 替换 better-sqlite3 Linux 二进制
BS_SRC="nodejs/better_sqlite3-linux.node"
if [ -f "$BS_SRC" ] && [ -n "$BS3" ]; then
  BSDST="${BS3}/build/Release"
  mkdir -p "$BSDST"
  cp "$BS_SRC" "${BSDST}/better_sqlite3.node"
  echo "  ✓ better-sqlite3 已替换"
fi

# 安装 Next.js SWC Linux 二进制
SWC_TGZ="nodejs/next-swc-linux-x64-gnu-16.1.1.tgz"
SWC_DIR="node_modules/.pnpm/@next+swc-linux-x64-gnu@16.1.1/node_modules/@next/swc-linux-x64-gnu"
if [ -f "$SWC_TGZ" ] && [ ! -f "${SWC_DIR}/package.json" ]; then
  mkdir -p "$SWC_DIR"
  mkdir -p nodejs/.tmp-swc
  tar -xzf "$SWC_TGZ" -C nodejs/.tmp-swc
  cp nodejs/.tmp-swc/package/next-swc.linux-x64-gnu.node "$SWC_DIR/" 2>/dev/null || true
  cp nodejs/.tmp-swc/package/package.json "$SWC_DIR/" 2>/dev/null || true
  rm -rf nodejs/.tmp-swc
  echo "  ✓ SWC Linux 二进制已安装"
fi

# 构建 .next
if [ -n "$NEXT_CLI" ]; then
  echo "  构建 Next.js..."
  "$NODE_BIN" "$NEXT_CLI" build 2>&1 | tail -3
  echo "  ✓ .next 构建完成"
else
  echo "  ⚠ 未找到 next CLI，使用已有 .next"
fi

# 构建 dist/server.js
if [ -n "$TSUP_CLI" ]; then
  echo "  构建 server..."
  "$NODE_BIN" "$TSUP_CLI" src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify 2>&1 | tail -2
  echo "  ✓ dist/server.js 构建完成"
elif [ -f "dist/server.js" ]; then
  echo "  ✓ 使用已有 dist/server.js"
fi

# ---- 4. 初始化数据库 ----
echo ""
echo "[4/5] 初始化数据库..."

if [ -f "scripts/init-db.js" ]; then
  "$NODE_BIN" scripts/init-db.js 2>&1
  echo "  ✓ 数据库就绪"
elif [ -n "$BS3" ]; then
  # 降级：用 node -e 建 users 表
  "$NODE_BIN" -e "
    var b=require('$BS3');var d=new b('data.db');
    d.exec(\"CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT DEFAULT '查看' NOT NULL, created_at TEXT DEFAULT (datetime('now')) NOT NULL)\");
    d.close()
  " && echo "  ✓ users 表就绪"
else
  echo "  ⚠ 跳过数据库初始化"
fi

# ---- 5. 启动 ----
echo ""
echo "[5/5] 启动服务..."

# 停掉旧进程
pkill -f "node.*dist/server" 2>/dev/null || true
sleep 1

# 启动
nohup env NODE_ENV=production HOSTNAME=0.0.0.0 PORT="$PORT" "$NODE_BIN" dist/server.js \
  > output.log 2>&1 &
PID=$!
echo "  ✓ 后台启动 (PID: $PID)"

sleep 3

# 验证
if curl -sI "http://127.0.0.1:${PORT}" 2>/dev/null | head -1 | grep -q "200\|302"; then
  echo ""
  echo "========================================="
  echo "  部署成功！ http://10.1.18.232:${PORT}"
  echo "  账号: admin / admin123"
  echo "========================================="
else
  echo ""
  echo "  启动失败，查看日志："
  tail -20 output.log
fi
