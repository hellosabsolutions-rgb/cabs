#!/usr/bin/env bash
# Publish KABPRO admin + server from GitHub Actions (self-hosted runner on THANOS).
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/srv/apps/cabs}"
WORKSPACE="${GITHUB_WORKSPACE:-$(pwd)}"

echo "==> Publishing KABPRO to ${REPO_ROOT}"

mkdir -p "${REPO_ROOT}/admin" "${REPO_ROOT}/server" "${REPO_ROOT}/scripts/thanos"

# ── Admin SPA ────────────────────────────────────────────────────────────────
if [[ -d "${WORKSPACE}/admin/dist" ]]; then
  echo "==> Admin dist"
  rsync -a --delete "${WORKSPACE}/admin/dist/" "${REPO_ROOT}/admin/dist/"
fi

# ── THANOS helper scripts (nginx / cloudflared) ──────────────────────────────
if [[ -d "${WORKSPACE}/scripts/thanos" ]]; then
  echo "==> scripts/thanos"
  rsync -a "${WORKSPACE}/scripts/thanos/" "${REPO_ROOT}/scripts/thanos/"
  chmod +x "${REPO_ROOT}/scripts/thanos/"*.sh 2>/dev/null || true
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

# ── Resolve API port (THANOS: 5002 — Opsiva owns 5000–5005) ───────────────────
resolve_port() {
  local env_file="${REPO_ROOT}/server/.env.production"
  local port=""
  if [[ -f "${env_file}" ]]; then
    port="$(grep -E '^PORT=' "${env_file}" | head -1 | cut -d= -f2- | tr -d ' \r\"' || true)"
  fi
  echo "${port:-5002}"
}

# ── PM2 ──────────────────────────────────────────────────────────────────────
if command -v pm2 >/dev/null 2>&1; then
  cd "${REPO_ROOT}/server"
  if pm2 describe kabpro-api >/dev/null 2>&1; then
    echo "==> Restarting kabpro-api"
    NODE_ENV=production pm2 restart kabpro-api --update-env
  else
    echo "==> Starting kabpro-api"
    NODE_ENV=production pm2 start src/server.js --name kabpro-api --cwd "${REPO_ROOT}/server"
  fi
  pm2 save
else
  echo "WARN: pm2 not found — skipping process restart"
fi

# ── Wait for API to accept connections after restart ─────────────────────────
PORT="$(resolve_port)"
echo "==> Waiting for API on 127.0.0.1:${PORT}"
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/api/health" | grep -q '"status":"online"'; then
    echo "==> API healthy (attempt ${i})"
    echo "==> Done"
    exit 0
  fi
  sleep 2
done

echo "ERROR: API did not become healthy on port ${PORT}"
pm2 describe kabpro-api 2>/dev/null || true
pm2 logs kabpro-api --lines 40 --nostream 2>/dev/null || true
curl -sv "http://127.0.0.1:${PORT}/api/health" || true
exit 1
