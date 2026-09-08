#!/usr/bin/env bash
# Register a self-hosted GitHub Actions runner on THANOS (same pattern as Opsiva).
set -euo pipefail

RUNNER_VERSION="${RUNNER_VERSION:-2.337.0}"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner-kabpro}"
REPO_URL="${REPO_URL:-https://github.com/hellosabsolutions-rgb/cabs}"

if [[ -z "${RUNNER_TOKEN:-}" ]]; then
  echo "Set RUNNER_TOKEN from GitHub → Settings → Actions → Runners → New self-hosted runner"
  exit 1
fi

mkdir -p "${RUNNER_DIR}"
cd "${RUNNER_DIR}"

if [[ ! -f ./config.sh ]]; then
  curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz -L \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  tar xzf "./actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
fi

./config.sh \
  --url "${REPO_URL}" \
  --token "${RUNNER_TOKEN}" \
  --name thanos-kabpro \
  --labels self-hosted,linux,thanos,kabpro \
  --unattended

echo "Install service: sudo ./svc.sh install thanos && sudo ./svc.sh start"
