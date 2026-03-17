#!/usr/bin/env bash

runtime_log() {
  printf '[env] %s\n' "$*"
}

trim_whitespace() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "${value}"
}

strip_wrapping_quotes() {
  local value="$1"

  if [[ "${#value}" -ge 2 ]]; then
    if [[ "${value:0:1}" == "\"" && "${value: -1}" == "\"" ]]; then
      printf '%s' "${value:1:${#value}-2}"
      return
    fi

    if [[ "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
      printf '%s' "${value:1:${#value}-2}"
      return
    fi
  fi

  printf '%s' "${value}"
}

load_runtime_env() {
  local project_dir="${1:-/var/www/cms}"
  local env_file="${project_dir}/.env"
  local raw_line=""
  local line=""
  local separator_index=0
  local key=""
  local value=""

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

  while IFS= read -r raw_line || [[ -n "${raw_line}" ]]; do
    line="$(trim_whitespace "${raw_line}")"

    if [[ -z "${line}" || "${line}" == \#* ]]; then
      continue
    fi

    separator_index="$(expr index "${line}" '=')"
    if [[ "${separator_index}" -le 1 ]]; then
      runtime_log "invalid env line: ${raw_line}"
      return 1
    fi

    key="$(trim_whitespace "${line:0:separator_index-1}")"
    value="$(trim_whitespace "${line:separator_index}")"
    value="$(strip_wrapping_quotes "${value}")"

    if [[ ! "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      runtime_log "invalid env key: ${key}"
      return 1
    fi

    printf -v "${key}" '%s' "${value}"
    export "${key}"
  done < "${env_file}"
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
