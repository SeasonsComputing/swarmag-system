#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
APP_NAME="${2:-}"

if [[ -z "${TARGET}" || -z "${APP_NAME}" ]]; then
  echo "Usage: $0 <dev|stage> <admin|ops|customer>"
  exit 1
fi

case "${TARGET}" in
  dev|stage) ;;
  *)
    echo "Invalid target '${TARGET}'. Expected one of: dev, stage"
    exit 1
    ;;
esac

case "${APP_NAME}" in
  admin|ops|customer) ;;
  *)
    echo "Invalid app '${APP_NAME}'. Expected one of: admin, ops, customer"
    exit 1
    ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_ID="swarmag-app-${APP_NAME}"
APP_ROOT="${ROOT}/source/front/app-${APP_NAME}"
ENV_FILE="${ROOT}/source/front/config/app-${APP_NAME}-${TARGET}.env"
ENV_EXAMPLE_FILE="${ROOT}/source/front/config/app-${APP_NAME}-${TARGET}.env.example"
UX_CONFIG_FILE="${ROOT}/source/front/config/ux-config.ts"
VERSION_FILE="${ROOT}/VERSION"
SECRETS_FILE="${SECRETS_FILE:-${ROOT}/secrets.jsonc}"
PORT="${PORT:-5173}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing environment file: ${ENV_FILE}"
  echo "Create it from ${ENV_EXAMPLE_FILE}"
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

if [[ "${VITE_PACKAGE_APP_ID:-}" != "${APP_ID}" ]]; then
  echo "Invalid VITE_PACKAGE_APP_ID='${VITE_PACKAGE_APP_ID:-}'. Expected '${APP_ID}'"
  exit 1
fi

if [[ "${VITE_PACKAGE_TARGET:-}" != "${TARGET}" ]]; then
  echo "Invalid VITE_PACKAGE_TARGET='${VITE_PACKAGE_TARGET:-}'. Expected '${TARGET}'"
  exit 1
fi

if [[ ! -f "${VERSION_FILE}" ]]; then
  echo "Missing version file: ${VERSION_FILE}"
  exit 1
fi

MAJOR_MINOR_VERSION="$(tr -d '[:space:]' < "${VERSION_FILE}")"
if [[ ! "${MAJOR_MINOR_VERSION}" =~ ^[0-9]+[.][0-9]+$ ]]; then
  echo "Invalid VERSION='${MAJOR_MINOR_VERSION}'. Expected major.minor"
  exit 1
fi

BUILD_NUMBER="$(git -C "${ROOT}" rev-list --count HEAD)"
PACKAGE_VERSION="${MAJOR_MINOR_VERSION}.${BUILD_NUMBER}-${TARGET}"

if [[ ! -f "${SECRETS_FILE}" ]]; then
  echo "Missing secrets file: ${SECRETS_FILE}"
  exit 1
fi

for key in "${REQUIRED_KEYS[@]}"; do
  current="${!key:-}"
  if [[ "${current}" != "__SECRET__" ]]; then
    continue
  fi
  composed_key="${VITE_PACKAGE_APP_ID}.${TARGET}.${key}"
  resolved_secret="$(
    deno run --allow-read "${ROOT}/source/devops/scripts/read-secret.ts" \
      "${SECRETS_FILE}" \
      "${composed_key}"
  )"
  if [[ -z "${resolved_secret}" ]]; then
    echo "Missing secret for ${composed_key} in ${SECRETS_FILE}"
    exit 1
  fi
  export "${key}=${resolved_secret}"
done

export VITE_PACKAGE_VERSION="${PACKAGE_VERSION}-local"

MISSING_KEYS=()
for key in "${REQUIRED_KEYS[@]}"; do
  value="${!key:-}"
  if [[ -z "${value}" || "${value}" == "__SECRET__" || "${value}" == "__PACKAGE_VERSION__" ]]; then
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
deno run -A npm:vite --config vite.config.ts --host 0.0.0.0 --port "${PORT}" --mode "${TARGET}"
