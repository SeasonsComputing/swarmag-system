#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
if [[ -z "${TARGET}" ]]; then
  echo "Usage: $0 <local|stage|prod> [artifact-path]"
  exit 1
fi

case "${TARGET}" in
  local|stage|prod) ;;
  *)
    echo "Invalid target '${TARGET}'. Expected one of: local, stage, prod"
    exit 1
    ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
BUILD_ROOT="${BUILD_ROOT:-${ROOT}/build}"
PACKAGE_DIR="${BUILD_ROOT}/packages"
ARTIFACT_PATH="${2:-}"

if [[ -z "${ARTIFACT_PATH}" ]]; then
  ARTIFACT_PATH="$(ls -1t "${PACKAGE_DIR}/swarmag-app-customer-${TARGET}-"*.zip 2>/dev/null | head -n 1 || true)"
fi

if [[ -z "${ARTIFACT_PATH}" || ! -f "${ARTIFACT_PATH}" ]]; then
  echo "Could not find package artifact for target '${TARGET}' in ${PACKAGE_DIR}"
  echo "Run: deno task app-customer-package-${TARGET}"
  exit 1
fi

REQUIRED_PATHS=(
  "index.html"
  "build-meta.json"
  "manifest.webmanifest"
)

ZIP_LIST="$(unzip -Z -1 "${ARTIFACT_PATH}")"

echo "Verifying ${ARTIFACT_PATH}"
for path in "${REQUIRED_PATHS[@]}"; do
  if ! grep -Fxq "${path}" <<<"${ZIP_LIST}"; then
    echo "Missing required packaged file: ${path}"
    exit 1
  fi
done

if ! grep -Eq '(^|/)sw\.(js|mjs)$|(^|/)service-worker\.(js|mjs)$' <<<"${ZIP_LIST}"; then
  echo "Missing required service worker file (sw.js/service-worker.js)"
  exit 1
fi

if ! grep -Eq '(^|/)icons?/.*\.(png|svg|webp|ico)$|(^|/)icon.*\.(png|svg|webp|ico)$' <<<"${ZIP_LIST}"; then
  echo "Missing icon assets (expected icon file or icons/ directory)"
  exit 1
fi

echo "PACKAGE_VERIFY=PASS"
echo "PACKAGE_ARTIFACT=${ARTIFACT_PATH}"
