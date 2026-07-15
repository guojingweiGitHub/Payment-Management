#!/bin/bash
set -Eeuo pipefail

# ==========================================
#  未缴费台账 - 内网一键部署脚本
#  用法: bash install.sh [端口号] [域名/IP]
#  示例: bash install.sh 5000 192.168.1.100
# ==========================================

APP_NAME="weijiaofei"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-5000}"
HOST="${2:-_}"

echo "========================================="
echo "  未缴费台账 - 内网部署"
echo "  端口: ${PORT}"
echo "  主机: ${HOST}"
echo "========================================="

# ---- 检测系统 ----
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  echo "无法检测系统类型，退出"
  exit 1
fi
echo "系统: ${OS}"

# ---- 1. 环境检查（无需 build-essential，已预编译） ----
echo ""
echo "[1/5] 环境检查..."
echo "  ✓ 项目已预编译，无需安装编译工具"

echo ""
echo "[2/5] 安装 Node.js..."
if command -v node &>/dev/null; then
  NODE_VER=$(node -v)
  echo "  ✓ 系统 Node.js: ${NODE_VER}"
else
  # 使用内置的 Node.js
  if [ -f "${APP_DIR}/nodejs/node-v20.18.0-linux-x64.tar.xz" ]; then
    echo "  解压内置 Node.js..."
    sudo mkdir -p /usr/local/node
    sudo tar -xJf "${APP_DIR}/nodejs/node-v20.18.0-linux-x64.tar.xz" -C /usr/local/node --strip-components=1
    export PATH=/usr/local/node/bin:$PATH
    # 验证 node 和 npm 都可用
    if command -v node &>/dev/null && command -v npm &>/dev/null; then
      echo "  ✓ Node.js: $(node -v), npm: $(npm -v)"
    else
      echo "  ✗ Node.js 解压后 node/npm 仍不可用，请检查 /usr/local/node/bin/"
      ls -la /usr/local/node/bin/ 2>/dev/null
      exit 1
    fi
  else
    echo "  ✗ 未检测到 Node.js，且未找到内置安装包"
    echo "  请先在有网机器下载: https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.xz"
    exit 1
  fi
fi

# ---- 持久化 PATH（后续 SSH 登录也可用） ----
if ! grep -q '/usr/local/node/bin' /etc/profile 2>/dev/null; then
  echo 'export PATH=/usr/local/node/bin:$PATH' | sudo tee -a /etc/profile > /dev/null
fi

# ---- 3. 检查 pnpm ----
echo ""
echo "[3/5] 检查 pnpm..."
if command -v pnpm &>/dev/null; then
  echo "  ✓ pnpm: $(pnpm -v)"
else
  echo "  安装 pnpm..."
  sudo env PATH="$PATH" npm install -g pnpm@9 2>/dev/null || {
    echo "  ✗ pnpm 安装失败"
    echo "  手动安装: sudo /usr/local/node/bin/npm install -g pnpm@9"
    exit 1
  }
  # 确保 pnpm 在 PATH 中
  export PATH=/usr/local/node/bin:$PATH
  echo "  ✓ pnpm 安装完成"
fi

# ---- 4. 预编译二进制处理 ----
echo ""
echo "[4/5] 适配运行环境..."
cd "${APP_DIR}"

# 如果 node_modules 不存在（未打包），尝试离线安装
if [ ! -d "node_modules" ]; then
  echo "  node_modules 不存在，尝试离线安装..."
  pnpm install --offline 2>/dev/null || {
    echo "  ✗ 离线安装失败，请确保已打包 node_modules"
    exit 1
  }
fi

# 如果是 Linux，替换为 Linux 预编译的 better-sqlite3 二进制
if [ "$(uname -s)" = "Linux" ]; then
  BSDIR="node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3/build/Release"
  if [ -f "nodejs/better_sqlite3-linux.node" ]; then
    mkdir -p "${BSDIR}"
    cp "nodejs/better_sqlite3-linux.node" "${BSDIR}/better_sqlite3.node"
    echo "  ✓ Linux 二进制已替换"
  elif [ ! -f "${BSDIR}/better_sqlite3.node" ]; then
    echo "  ⚠ 未找到 better-sqlite3 预编译文件，尝试编译..."
    npm rebuild better-sqlite3 2>/dev/null || {
      echo "  ✗ 编译失败，请确认已安装 build-essential 和 python3"
      exit 1
    }
  else
    echo "  ✓ better-sqlite3 二进制已就绪"
  fi
else
  echo "  ✓ macOS 环境，跳过二进制替换"
fi
echo "  ✓ 环境适配完成"

# ---- 5. 数据库迁移 + 启动 ----
echo ""
echo "[5/5] 数据库迁移..."
npx drizzle-kit push --force
# 备份目录
mkdir -p "${APP_DIR}/backup"
echo "  ✓ 数据库迁移完成"

# ---- 7. 配置启动 ----
echo ""
echo "[7/7] 配置服务..."

# 检查 PM2
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
  pm2 startup systemd -u "$(whoami)" --hp "$HOME" 2>/dev/null || pm2 startup
fi

# 创建环境文件
cat > "${APP_DIR}/.env.production" << ENVEOF
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=${PORT}
ENVEOF

# 创建 PM2 配置
cat > "${APP_DIR}/pm2.config.cjs" << PM2EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'dist/server.js',
    cwd: '${APP_DIR}',
    env: {
      NODE_ENV: 'production',
      HOSTNAME: '0.0.0.0',
      PORT: '${PORT}'
    }
  }]
};
PM2EOF

# 启动服务
if pm2 list 2>/dev/null | grep -q "${APP_NAME}"; then
  pm2 restart "${APP_NAME}" --update-env
  echo "  ✓ 服务已重启"
else
  pm2 start pm2.config.cjs
  pm2 save
  echo "  ✓ 服务已启动"
fi

# ---- 8. 配置 Nginx（可选） ----
echo ""
if command -v nginx &>/dev/null; then
  if [ ! -f "/etc/nginx/conf.d/${APP_NAME}.conf" ]; then
    echo "检测到 Nginx，自动配置反向代理..."
    sudo tee "/etc/nginx/conf.d/${APP_NAME}.conf" > /dev/null << NGINX
server {
    listen 80;
    server_name ${HOST};

    client_max_body_size 20m;

    location /uploads/ {
        alias ${APP_DIR}/public/uploads/;
    }

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX
    sudo nginx -t && sudo systemctl reload nginx
    echo "  ✓ Nginx 配置完成"
  else
    echo "  Nginx 配置已存在，跳过"
  fi
else
  echo "  未检测到 Nginx，跳过反向代理配置"
  echo "  如需安装: sudo apt install nginx -y"
fi

# ---- 9. 健康检查 ----
echo ""
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "304" ]; then
  echo "========================================="
  echo "  部署成功！"
  echo "========================================="
  echo ""
  echo "  访问地址: http://${HOST}"
  echo "  直接访问: http://127.0.0.1:${PORT}"
  echo "  默认账号: admin / admin123"
  echo ""
else
  echo "========================================="
  echo "  部署完成，但健康检查异常 (HTTP ${HTTP_CODE})"
  echo "  请检查日志: pm2 logs ${APP_NAME}"
  echo "========================================="
fi

pm2 status
