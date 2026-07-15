#!/bin/bash
# 启动服务
# 上传到 /opt/weijiaofei/ 运行: bash start.sh
cd "$(dirname "$0")"
nohup env NODE_ENV=production HOSTNAME=0.0.0.0 PORT=5000 /usr/local/node/bin/node dist/server.js > output.log 2>&1 &
echo "已启动，查看日志: cat output.log"
#!/bin/bash
set -Eeuo pipefail

WORKSPACE_PATH="${WORKSPACE_PATH:-$(pwd)}"

PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"


start_service() {
    cd "${WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    PORT=${DEPLOY_RUN_PORT} node dist/server.js
}

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service
