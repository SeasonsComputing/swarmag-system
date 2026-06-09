#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_ROOT="${ROOT}/source/ux/app-admin"
ENV_FILE="${ROOT}/source/ux/config/app-admin-stage.env"
SECRETS_FILE="${SECRETS_FILE:-${ROOT}/secrets.jsonc}"
PORT="${PORT:-5173}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing environment file: ${ENV_FILE}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

export VITE_SERVICE_WORKER_ENABLED=false

if [[ "${VITE_PACKAGE_APP_ID:-}" != "swarmag-app-admin" ]]; then
  echo "Invalid VITE_PACKAGE_APP_ID='${VITE_PACKAGE_APP_ID:-}'. Expected 'swarmag-app-admin'"
  exit 1
fi

if [[ "${VITE_PACKAGE_TARGET:-}" != "stage" ]]; then
  echo "Invalid VITE_PACKAGE_TARGET='${VITE_PACKAGE_TARGET:-}'. Expected 'stage'"
  exit 1
fi

if [[ "${VITE_SUPABASE_PUBLIC_KEY:-}" == "__SECRET__" ]]; then
  if [[ ! -f "${SECRETS_FILE}" ]]; then
    echo "Missing secrets file: ${SECRETS_FILE}"
    exit 1
  fi
  VITE_SUPABASE_PUBLIC_KEY="$(
    deno run --allow-read "${ROOT}/source/devops/scripts/read-secret.ts" \
      "${SECRETS_FILE}" \
      "${VITE_PACKAGE_APP_ID}.stage.VITE_SUPABASE_PUBLIC_KEY"
  )"
  export VITE_SUPABASE_PUBLIC_KEY
fi

cd "${APP_ROOT}"
deno run -A npm:vite --config vite.config.ts --host 0.0.0.0 --port "${PORT}" --mode stage
