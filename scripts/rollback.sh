#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/cms}"
ROLLBACK_REF="${1:-}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
LOCAL_PORT="${LOCAL_PORT:-3001}"
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-http://127.0.0.1:${LOCAL_PORT}/api/health}"
LOCAL_READINESS_URL="${LOCAL_READINESS_URL:-http://127.0.0.1:${LOCAL_PORT}/api/readiness}"
PM2_APP_NAME="${PM2_APP_NAME:-cms}"

if [[ -z "${ROLLBACK_REF}" ]]; then
  printf '[rollback] missing rollback ref\n' >&2
  exit 1
fi

log() {
  printf '[rollback] %s\n' "$*"
}

source_env() {
  local env_file="${PROJECT_DIR}/.env"
  if [[ -f "${env_file}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${env_file}"
    set +a
  fi
}

cd "${PROJECT_DIR}"
source_env

log "restoring ${ROLLBACK_REF}"
git fetch origin --prune
git checkout "${DEPLOY_BRANCH}"
git reset --hard "${ROLLBACK_REF}"

log "installing dependencies"
pnpm install --frozen-lockfile

log "rebuilding previous release"
pnpm build

log "reloading process ${PM2_APP_NAME}"
pnpm exec pm2 startOrReload ecosystem.config.cjs --only "${PM2_APP_NAME}" --update-env
pnpm exec pm2 save

curl --fail --silent --show-error --retry 10 --retry-delay 3 "${LOCAL_HEALTH_URL}" > /dev/null
curl --fail --silent --show-error --retry 10 --retry-delay 3 "${LOCAL_READINESS_URL}" > /dev/null

log "rollback successful: $(git rev-parse --short HEAD)"
