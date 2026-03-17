#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/cms}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/runtime-env.sh"

load_runtime_env "${PROJECT_DIR}"
validate_runtime_env

cd "${PROJECT_DIR}"
exec pnpm --filter admin-app start
