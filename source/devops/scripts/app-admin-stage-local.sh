#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_ROOT="${ROOT}/source/ux/app-admin"
ENV_FILE="${ROOT}/source/ux/config/app-admin-stage.env"
UX_CONFIG_FILE="${ROOT}/source/ux/config/ux-config.ts"
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

REQUIRED_KEYS=()
while IFS= read -r key; do
  [[ -z "${key}" ]] && continue
  REQUIRED_KEYS+=("${key}")
done < <(rg -o "VITE_[A-Z0-9_]+" "${UX_CONFIG_FILE}" | sort -u)

if [[ "${VITE_PACKAGE_APP_ID:-}" != "swarmag-app-admin" ]]; then
  echo "Invalid VITE_PACKAGE_APP_ID='${VITE_PACKAGE_APP_ID:-}'. Expected 'swarmag-app-admin'"
  exit 1
fi

if [[ "${VITE_PACKAGE_TARGET:-}" != "stage" ]]; then
  echo "Invalid VITE_PACKAGE_TARGET='${VITE_PACKAGE_TARGET:-}'. Expected 'stage'"
  exit 1
fi

if [[ ! -f "${SECRETS_FILE}" ]]; then
  echo "Missing secrets file: ${SECRETS_FILE}"
  exit 1
fi

for key in "${REQUIRED_KEYS[@]}"; do
  current="${!key:-}"
  if [[ "${current}" != "__SECRET__" ]]; then
    continue
  fi
  resolved_secret="$(
    deno run --allow-read "${ROOT}/source/devops/scripts/read-secret.ts" \
      "${SECRETS_FILE}" \
      "${VITE_PACKAGE_APP_ID}.stage.${key}"
  )"
  if [[ -z "${resolved_secret}" ]]; then
    echo "Missing secret for ${VITE_PACKAGE_APP_ID}.stage.${key} in ${SECRETS_FILE}"
    exit 1
  fi
  export "${key}=${resolved_secret}"
done

MISSING_KEYS=()
for key in "${REQUIRED_KEYS[@]}"; do
  value="${!key:-}"
  if [[ -z "${value}" || "${value}" == "__SECRET__" ]]; then
    MISSING_KEYS+=("${key}")
  fi
done

if [[ "${#MISSING_KEYS[@]}" -gt 0 ]]; then
  echo "Missing required environment variables in ${ENV_FILE}:"
  for key in "${MISSING_KEYS[@]}"; do
    echo "- ${key}"
  done
  exit 1
fi

cd "${APP_ROOT}"
deno run -A npm:vite --config vite.config.ts --host 0.0.0.0 --port "${PORT}" --mode stage
