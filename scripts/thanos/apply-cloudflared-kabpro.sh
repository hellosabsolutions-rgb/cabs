#!/usr/bin/env bash
# Apply / merge KABPRO kabpro.pro hostnames into the EXISTING cloudflared tunnel
# on THANOS. Does not create a new tunnel.
#
# Usage (on THANOS):
#   sudo bash /srv/apps/cabs/scripts/thanos/apply-cloudflared-kabpro.sh
#   sudo bash /srv/apps/cabs/scripts/thanos/apply-cloudflared-kabpro.sh --dry-run
#
set -euo pipefail

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

CONFIG="${CLOUDFLARED_CONFIG:-/etc/cloudflared/config.yml}"
BACKUP_DIR="/etc/cloudflared/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"

HOSTS=(
  "api.kabpro.pro"
  "admin.kabpro.pro"
  "www.kabpro.pro"
  "kabpro.pro"
)

if [[ ! -f "${CONFIG}" ]]; then
  echo "ERROR: ${CONFIG} not found."
  echo "If you manage routes only in Zero Trust UI, add Public Hostnames there instead:"
  echo "  api / admin / @ / www  →  kabpro.pro  →  http://127.0.0.1:80"
  exit 1
fi

echo "==> Using config: ${CONFIG}"
echo "==> Ensuring KABPRO hostnames → http://127.0.0.1:80"

MISSING=()
for h in "${HOSTS[@]}"; do
  if grep -qE "hostname:[[:space:]]*${h}([[:space:]]|$)" "${CONFIG}"; then
    echo "  OK already present: ${h}"
  else
    echo "  MISSING: ${h}"
    MISSING+=("${h}")
  fi
done

if [[ ${#MISSING[@]} -eq 0 ]]; then
  echo "==> All kabpro.pro hostnames already in config."
else
  echo "==> Will insert ${#MISSING[@]} hostname rule(s) before the catch-all 404."

  BLOCK=$'\n  # ── kabpro.pro (added '"${STAMP}"$') ──\n'
  for h in "${MISSING[@]}"; do
    BLOCK+="  - hostname: ${h}"$'\n'
    BLOCK+="    service: http://127.0.0.1:80"$'\n'
    BLOCK+="    originRequest:"$'\n'
    BLOCK+="      httpHostHeader: ${h}"$'\n'
  done

  if [[ "${DRY_RUN}" -eq 1 ]]; then
    echo "==> DRY RUN — block that would be inserted:"
    printf '%s' "${BLOCK}"
    exit 0
  fi

  mkdir -p "${BACKUP_DIR}"
  cp -a "${CONFIG}" "${BACKUP_DIR}/config.yml.${STAMP}"
  echo "==> Backup: ${BACKUP_DIR}/config.yml.${STAMP}"

  TMP="$(mktemp)"
  # Insert KABPRO block immediately before the final catch-all "- service: http_status:404"
  if grep -qE '^[[:space:]]*-[[:space:]]*service:[[:space:]]*http_status:404' "${CONFIG}"; then
    awk -v block="${BLOCK}" '
      BEGIN { inserted=0 }
      /^[[:space:]]*-[[:space:]]*service:[[:space:]]*http_status:404/ && !inserted {
        printf "%s", block
        inserted=1
      }
      { print }
      END {
        if (!inserted) {
          printf "%s", block
          print "  - service: http_status:404"
        }
      }
    ' "${CONFIG}" > "${TMP}"
  else
    cat "${CONFIG}" > "${TMP}"
    printf '%s' "${BLOCK}" >> "${TMP}"
    echo "  - service: http_status:404" >> "${TMP}"
  fi

  mv "${TMP}" "${CONFIG}"
  chmod 644 "${CONFIG}"
  echo "==> Config updated."
fi

echo "==> Validating ingress…"
if command -v cloudflared >/dev/null 2>&1; then
  cloudflared tunnel ingress validate --config "${CONFIG}"
else
  echo "WARN: cloudflared binary not in PATH — skipped validate"
fi

if [[ "${DRY_RUN}" -eq 1 ]]; then
  exit 0
fi

echo "==> Restarting cloudflared…"
if systemctl list-unit-files | grep -q '^cloudflared\.service'; then
  systemctl restart cloudflared
  systemctl --no-pager --full status cloudflared || true
elif systemctl list-unit-files | grep -q 'cloudflared'; then
  UNIT="$(systemctl list-unit-files 'cloudflared*' --no-legend | awk 'NR==1{print $1}')"
  systemctl restart "${UNIT}"
  systemctl --no-pager --full status "${UNIT}" || true
else
  echo "WARN: cloudflared systemd unit not found — restart manually."
fi

echo ""
echo "==> DNS / Zero Trust checklist"
echo "  In Cloudflare Zero Trust → Tunnels → this tunnel → Public Hostname, ensure:"
for h in "${HOSTS[@]}"; do
  echo "    - ${h} → http://127.0.0.1:80"
done
echo "  Zone kabpro.pro DNS records should be Proxied (orange cloud)."
echo ""
echo "==> Quick local nginx test (after nginx reload):"
echo "  curl -sS -H 'Host: api.kabpro.pro' http://127.0.0.1/api/health"
echo "  curl -sS -o /dev/null -w '%{http_code}\\n' -H 'Host: admin.kabpro.pro' http://127.0.0.1/"
echo "Done."
