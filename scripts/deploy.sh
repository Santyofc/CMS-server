#!/usr/bin/env bash
set -euo pipefail

cd /var/www/cms
git pull origin main
pnpm install
pnpm build
pm2 restart cms

echo "Deploy completed"
