#!/usr/bin/env bash
set -euo pipefail

if [[ "${GIT_AUTO_PUSH:-false}" != "true" ]]; then
  echo "GIT_AUTO_PUSH disabled"
  exit 0
fi

if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "Not a git repository"
  exit 1
fi

current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "${current_branch}" != "main" ]]; then
  echo "Refusing to auto-push from branch ${current_branch}"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  git add .
  git commit -m "auto: control plane update"
  git push origin main
  echo "Changes pushed"
else
  echo "No changes to commit"
fi
