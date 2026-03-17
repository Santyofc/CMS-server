#!/usr/bin/env bash

runtime_log() {
  printf '[env] %s\n' "$*"
}

load_runtime_env() {
  local project_dir="${1:-/var/www/cms}"
  local env_file="${project_dir}/.env"

  if [[ ! -f "${env_file}" ]]; then
    if [[ "${NODE_ENV:-production}" == "production" ]]; then
      runtime_log "missing required env file: ${env_file}"
      return 1
    fi

    return 0
  fi

  if [[ ! -r "${env_file}" ]]; then
    runtime_log "env file is not readable: ${env_file}"
    return 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "${env_file}"
  set +a
}

require_runtime_vars() {
  local missing=()
  local key=""

  for key in "$@"; do
    if [[ -z "${!key:-}" ]]; then
      missing+=("${key}")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    runtime_log "missing required variables: ${missing[*]}"
    return 1
  fi
}

validate_runtime_env() {
  if [[ "${NODE_ENV:-production}" != "production" ]]; then
    return 0
  fi

  require_runtime_vars NODE_ENV APP_URL NEXT_PUBLIC_APP_URL DATABASE_URL REDIS_URL TRUST_PROXY

  if [[ "${NODE_ENV}" != "production" ]]; then
    runtime_log "NODE_ENV must be production, got '${NODE_ENV}'"
    return 1
  fi

  if [[ "${TRUST_PROXY}" != "true" && "${TRUST_PROXY}" != "false" ]]; then
    runtime_log "TRUST_PROXY must be 'true' or 'false'"
    return 1
  fi

  if [[ "${APP_URL}" != http://* && "${APP_URL}" != https://* ]]; then
    runtime_log "APP_URL must be an absolute http(s) URL"
    return 1
  fi

  if [[ "${NEXT_PUBLIC_APP_URL}" != http://* && "${NEXT_PUBLIC_APP_URL}" != https://* ]]; then
    runtime_log "NEXT_PUBLIC_APP_URL must be an absolute http(s) URL"
    return 1
  fi
}
