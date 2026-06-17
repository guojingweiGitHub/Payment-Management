#!/bin/bash
set -Eeuo pipefail

APP_DIR="$(pwd)"
DOMAIN="${1:-}"

echo "========================================="
echo "  未缴费拿图 - 服务器环境搭建"
echo "========================================="

# 检测系统
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  echo "无法检测系统类型，请手动安装"
  exit 1
fi

echo ""
echo "检测到系统: ${OS}"

# ==== 1. 安装 Node.js ====
echo ""
echo "[1/6] 安装 Node.js 20..."
if command -v node &>/dev/null && node -v | grep -q "v20"; then
  echo "  ✓ Node.js 已安装: $(node -v)"
else
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
  echo "  ✓ Node.js 安装完成: $(node -v)"
fi

# ==== 2. 安装 pnpm ====
echo ""
echo "[2/6] 安装 pnpm..."
if command -v pnpm &>/dev/null; then
  echo "  ✓ pnpm 已安装: $(pnpm -v)"
else
  npm install -g pnpm@9
  echo "  ✓ pnpm 安装完成"
fi

# ==== 3. 安装 PM2 ====
echo ""
echo "[3/6] 安装 PM2..."
if command -v pm2 &>/dev/null; then
  echo "  ✓ PM2 已安装: $(pm2 -v)"
else
  npm install -g pm2
  pm2 startup systemd -u $(whoami) --hp $HOME 2>/dev/null || pm2 startup
  echo "  ✓ PM2 安装完成"
fi

# ==== 4. 安装 Nginx ====
echo ""
echo "[4/6] 安装 Nginx..."
if command -v nginx &>/dev/null; then
  echo "  ✓ Nginx 已安装: $(nginx -v 2>&1)"
else
  if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt update && sudo apt install nginx -y
  elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "alinux" ]; then
    sudo yum install nginx -y || sudo dnf install nginx -y
  fi
  sudo systemctl enable nginx
  sudo systemctl start nginx
  echo "  ✓ Nginx 安装完成"
fi

# ==== 5. 创建项目目录 ====
echo ""
echo "[5/6] 准备项目目录..."
sudo mkdir -p "${APP_DIR}"
sudo mkdir -p "${APP_DIR}/public/uploads"
sudo chown -R $(whoami):$(whoami) "${APP_DIR}"
echo "  ✓ 项目目录: ${APP_DIR}"

# ==== 6. 配置 Nginx ====
echo ""
echo "[6/6] 配置 Nginx..."
NGINX_CONF="/etc/nginx/conf.d/payment.conf"

sudo tee "${NGINX_CONF}" > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN:-_};

    client_max_body_size 20m;

    # 文件上传目录
    location /uploads/ {
        alias ${APP_DIR}/public/uploads/;
    }

    # 静态资源缓存
    location /_next/static/ {
        alias ${APP_DIR}/.next/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API & 页面代理到 Next.js
    location / {
        proxy_pass http://127.0.0.1:5000;
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
EOF

sudo nginx -t && sudo systemctl reload nginx
echo "  ✓ Nginx 配置完成"

echo ""
echo "========================================="
echo "  环境搭建完成！"
echo "========================================="
echo ""
echo "下一步:"
echo "  1. 上传代码到 ${APP_DIR}"
echo "  2. cd ${APP_DIR} && pnpm install --no-frozen-lockfile"
echo "  3. bash ./scripts/deploy.sh"
echo ""
if [ -z "${DOMAIN}" ]; then
  echo "提示: 如有域名，重新运行并传入域名: bash scripts/setup-server.sh your-domain.com"
fi
