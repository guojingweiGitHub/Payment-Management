#!/bin/bash
set -Eeuo pipefail


PORT=5000
WORKSPACE_PATH="${WORKSPACE_PATH:-$(pwd)}"
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-${PORT}}"


cd "${WORKSPACE_PATH}"

kill_port_if_listening() {
    # macOS 使用 lsof，Linux 使用 ss
    if command -v lsof &> /dev/null; then
        local pids
        pids=$(lsof -ti :"${DEPLOY_RUN_PORT}" 2>/dev/null || true)
        if [[ -z "${pids}" ]]; then
          echo "Port ${DEPLOY_RUN_PORT} is free."
          return
        fi
        echo "Port ${DEPLOY_RUN_PORT} in use by PIDs: ${pids} (SIGKILL)"
        echo "${pids}" | xargs kill -9
        sleep 1
        pids=$(lsof -ti :"${DEPLOY_RUN_PORT}" 2>/dev/null || true)
        if [[ -n "${pids}" ]]; then
          echo "Warning: port ${DEPLOY_RUN_PORT} still busy after SIGKILL, PIDs: ${pids}"
        else
          echo "Port ${DEPLOY_RUN_PORT} cleared."
        fi
    elif command -v ss &> /dev/null; then
        local pids
        pids=$(ss -H -lntp 2>/dev/null | awk -v port="${DEPLOY_RUN_PORT}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
        if [[ -z "${pids}" ]]; then
          echo "Port ${DEPLOY_RUN_PORT} is free."
          return
        fi
        echo "Port ${DEPLOY_RUN_PORT} in use by PIDs: ${pids} (SIGKILL)"
        echo "${pids}" | xargs -I {} kill -9 {}
        sleep 1
        pids=$(ss -H -lntp 2>/dev/null | awk -v port="${DEPLOY_RUN_PORT}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
        if [[ -n "${pids}" ]]; then
          echo "Warning: port ${DEPLOY_RUN_PORT} still busy after SIGKILL, PIDs: ${pids}"
        else
          echo "Port ${DEPLOY_RUN_PORT} cleared."
        fi
    else
        echo "Warning: cannot check port, continuing..."
    fi
}

echo "Clearing port ${DEPLOY_RUN_PORT} before start."
kill_port_if_listening
echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for dev..."

PORT=${DEPLOY_RUN_PORT} pnpm tsx watch src/server-entry.ts
