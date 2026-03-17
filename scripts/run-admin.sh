#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/cms}"

if [[ -f "${PROJECT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${PROJECT_DIR}/.env"
  set +a
fi

cd "${PROJECT_DIR}"
exec pnpm --filter admin-app start
