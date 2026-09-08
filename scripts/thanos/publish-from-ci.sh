#!/usr/bin/env bash
# Publish KABPRO admin + server from GitHub Actions (self-hosted runner on THANOS).
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/srv/apps/cabs}"
WORKSPACE="${GITHUB_WORKSPACE:-$(pwd)}"

echo "==> Publishing KABPRO to ${REPO_ROOT}"

mkdir -p "${REPO_ROOT}/admin" "${REPO_ROOT}/server"

# ── Admin SPA ────────────────────────────────────────────────────────────────
if [[ -d "${WORKSPACE}/admin/dist" ]]; then
  echo "==> Admin dist"
  rsync -a --delete "${WORKSPACE}/admin/dist/" "${REPO_ROOT}/admin/dist/"
fi

# ── Server (source + built deps stay in server/) ─────────────────────────────
if [[ -d "${WORKSPACE}/server" ]]; then
  echo "==> Server"
  rsync -a \
    --exclude node_modules \
    --exclude '.env.production' \
    "${WORKSPACE}/server/" "${REPO_ROOT}/server/"

  cd "${REPO_ROOT}/server"
  npm ci --omit=dev
fi

# ── PM2 ──────────────────────────────────────────────────────────────────────
if command -v pm2 >/dev/null 2>&1; then
  cd "${REPO_ROOT}/server"
  if pm2 describe kabpro-api >/dev/null 2>&1; then
    NODE_ENV=production pm2 restart kabpro-api --update-env
  else
    NODE_ENV=production pm2 start src/server.js --name kabpro-api --cwd "${REPO_ROOT}/server"
  fi
  pm2 save
fi

echo "==> Done"
