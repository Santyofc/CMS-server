#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/cms}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
TARGET_REF="${1:-${DEPLOY_REF:-origin/${DEPLOY_BRANCH}}}"
LOCAL_PORT="${LOCAL_PORT:-3001}"
LOCAL_HEALTH_URL="${LOCAL_HEALTH_URL:-http://127.0.0.1:${LOCAL_PORT}/api/health}"
LOCAL_READINESS_URL="${LOCAL_READINESS_URL:-http://127.0.0.1:${LOCAL_PORT}/api/readiness}"
PUBLIC_HEALTH_URL="${PUBLIC_HEALTH_URL:-}"
PM2_APP_NAME="${PM2_APP_NAME:-cms}"
PREVIOUS_COMMIT=""
ROLLED_BACK=0

log() {
  printf '[deploy] %s\n' "$*"
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

rollback_on_error() {
  local exit_code=$?
  if [[ -n "${PREVIOUS_COMMIT}" && "${ROLLED_BACK}" -eq 0 ]]; then
    ROLLED_BACK=1
    log "deploy failed, rolling back to ${PREVIOUS_COMMIT}"
    "${PROJECT_DIR}/scripts/rollback.sh" "${PREVIOUS_COMMIT}" || true
  fi

  exit "${exit_code}"
}

trap rollback_on_error ERR

cd "${PROJECT_DIR}"
source_env

log "fetching repository state"
git fetch origin --prune
PREVIOUS_COMMIT="$(git rev-parse HEAD)"

log "checking out ${TARGET_REF}"
git checkout "${DEPLOY_BRANCH}"
git reset --hard "${TARGET_REF}"

log "installing dependencies"
pnpm install --frozen-lockfile

log "building workspace"
pnpm build

log "running safe migrations"
pnpm db:migrate

log "reloading process ${PM2_APP_NAME}"
pnpm exec pm2 startOrReload ecosystem.config.cjs --only "${PM2_APP_NAME}" --update-env
pnpm exec pm2 save

log "waiting for local health checks"
curl --fail --silent --show-error --retry 10 --retry-delay 3 "${LOCAL_HEALTH_URL}" > /dev/null
curl --fail --silent --show-error --retry 10 --retry-delay 3 "${LOCAL_READINESS_URL}" > /dev/null

if [[ -n "${APP_URL:-}" && -z "${PUBLIC_HEALTH_URL}" ]]; then
  PUBLIC_HEALTH_URL="${APP_URL%/}/api/health"
fi

if [[ -n "${PUBLIC_HEALTH_URL}" ]]; then
  log "checking public health endpoint"
  curl --fail --silent --show-error --retry 10 --retry-delay 3 "${PUBLIC_HEALTH_URL}" > /dev/null
fi

log "deploy successful: $(git rev-parse --short HEAD)"
