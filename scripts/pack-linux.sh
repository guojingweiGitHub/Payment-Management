#!/bin/bash
# ==========================================
#  Linux 原生模块打包脚本（在 macOS 上运行）
#  生成 nodejs/linux-modules.tar.gz 上传到服务器
# ==========================================
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMPDIR="${APP_DIR}/nodejs/linux-pkgs"
DEST="${APP_DIR}/nodejs/linux-modules"

echo "=== 下载 Linux 原生模块 ==="
mkdir -p "$TMPDIR" "$DEST"
cd "$TMPDIR"

# 下载所有 Linux 包
for pkg in \
  "@next/swc-linux-x64-gnu@16.1.1" \
  "lightningcss-linux-x64-gnu" \
  "@tailwindcss/oxide-linux-x64-gnu" \
  "@unrs/resolver-binding-linux-x64-gnu" \
  "@img/sharp-linux-x64@0.34.5" \
  "@rollup/rollup-linux-x64-gnu@4.59.0"; do
  echo "  下载: $pkg"
  npm pack "$pkg" 2>&1 | tail -1
done

echo ""
echo "=== 解压并重组目录结构 ==="
for tgz in *.tgz; do
  rm -rf /tmp/linux-pkg
  mkdir -p /tmp/linux-pkg
  tar -xzf "$tgz" -C /tmp/linux-pkg
  
  # 读取 package.json 获取包名和版本
  PKG_NAME=$(node -e "console.log(require('/tmp/linux-pkg/package/package.json').name)")
  PKG_VER=$(node -e "console.log(require('/tmp/linux-pkg/package/package.json').version)")
  
  # 目标路径
  SAFE_NAME="${PKG_NAME//\//+}"  # @next/swc -> @next+swc
  TARGET="${DEST}/${SAFE_NAME}@${PKG_VER}/node_modules/${PKG_NAME}"
  mkdir -p "$TARGET"
  cp -r /tmp/linux-pkg/package/* "$TARGET/"
  
  echo "  ✓ ${SAFE_NAME}@${PKG_VER}"
done

echo ""
echo "=== 打包 ==="
cd "$APP_DIR"
tar -czf nodejs/linux-modules.tar.gz -C nodejs linux-modules 2>/dev/null || \
tar -czf nodejs/linux-modules.tar.gz nodejs/linux-modules

ls -lh nodejs/linux-modules.tar.gz
echo ""
echo "上传 nodejs/linux-modules.tar.gz 到服务器 /opt/weijiaofei/，然后执行:"
echo "  cd /opt/weijiaofei && tar -xzf nodejs/linux-modules.tar.gz --strip-components=1"
echo "  /usr/local/node/bin/node node_modules/.pnpm/next@16.1.1*/node_modules/next/dist/bin/next build"
echo "  nohup env NODE_ENV=production HOSTNAME=0.0.0.0 PORT=5000 /usr/local/node/bin/node dist/server.js > output.log 2>&1 &"
