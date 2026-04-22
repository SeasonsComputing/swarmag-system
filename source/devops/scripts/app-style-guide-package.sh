#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
if [[ -z "${TARGET}" ]]; then
  echo "Usage: $0 <local> [--init-env]"
  exit 1
fi
shift
INIT_ENV="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --init-env)
      INIT_ENV="true"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

case "${TARGET}" in
  local) ;;
  *)
    echo "Invalid target '${TARGET}'. Expected: local"
    exit 1
    ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_ROOT="${ROOT}/source/ux/app-style-guide"
ENV_FILE="${ROOT}/source/ux/config/app-style-guide-${TARGET}.env"
ENV_EXAMPLE_FILE="${ROOT}/source/ux/config/app-style-guide-${TARGET}.env.example"
BUILD_ROOT="${BUILD_ROOT:-${ROOT}/build}"
DIST_DIR="${BUILD_ROOT}/dist/app-style-guide"
PACKAGE_DIR="${BUILD_ROOT}/packages"

if [[ ! -f "${ENV_FILE}" && "${INIT_ENV}" == "true" ]]; then
  if [[ ! -f "${ENV_EXAMPLE_FILE}" ]]; then
    echo "Missing environment example file: ${ENV_EXAMPLE_FILE}"
    exit 1
  fi
  cp "${ENV_EXAMPLE_FILE}" "${ENV_FILE}"
  echo "Initialized environment file: ${ENV_FILE}"
fi

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

export VITE_PACKAGE_APP_ID="${VITE_PACKAGE_APP_ID:-swarmag-app-style-guide}"
export VITE_PACKAGE_TARGET="${VITE_PACKAGE_TARGET:-${TARGET}}"
export VITE_PACKAGE_VERSION="${VITE_PACKAGE_VERSION:-0.0.0-local}"

if [[ "${VITE_PACKAGE_APP_ID}" != "swarmag-app-style-guide" ]]; then
  echo "Invalid VITE_PACKAGE_APP_ID='${VITE_PACKAGE_APP_ID}'. Expected 'swarmag-app-style-guide'"
  exit 1
fi

if [[ "${VITE_PACKAGE_TARGET}" != "${TARGET}" ]]; then
  echo "Invalid VITE_PACKAGE_TARGET='${VITE_PACKAGE_TARGET}'. Expected '${TARGET}'"
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "Missing required command: zip"
  exit 1
fi

mkdir -p "${PACKAGE_DIR}"
rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"

(
  cd "${APP_ROOT}"
  deno run -A npm:vite build --config vite.config.ts --mode development --outDir "${DIST_DIR}" --emptyOutDir
)

REQUIRED_STATIC_FILES=("manifest.webmanifest" "sw.js" "icon.png" "favicon.ico")
for file in "${REQUIRED_STATIC_FILES[@]}"; do
  SOURCE_FILE="${APP_ROOT}/${file}"
  if [[ ! -f "${SOURCE_FILE}" ]]; then
    echo "Missing required app-style-guide static file: ${SOURCE_FILE}"
    exit 1
  fi
  cp "${SOURCE_FILE}" "${DIST_DIR}/${file}"
done

SECRET_MATCHES=()
while IFS= read -r match; do
  [[ -z "${match}" ]] && continue
  SECRET_MATCHES+=("${match}")
done < <(find "${DIST_DIR}" -type f -name 'secrets.jsonc')
if [[ "${#SECRET_MATCHES[@]}" -gt 0 ]]; then
  for match in "${SECRET_MATCHES[@]}"; do
    rm -f "${match}"
    echo "PACKAGE_GUARD: removed ${match} from package output"
  done
fi

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
GIT_SHA="$(git -C "${ROOT}" rev-parse --short HEAD)"
ARTIFACT_BASENAME="swarmag-app-style-guide-${TARGET}-${TIMESTAMP}-${GIT_SHA}"
ARTIFACT_PATH="${PACKAGE_DIR}/${ARTIFACT_BASENAME}.zip"
BUILD_META_PATH="${DIST_DIR}/build-meta.json"

cat > "${BUILD_META_PATH}" <<EOF
{
  "app": "${VITE_PACKAGE_APP_ID}",
  "target": "${TARGET}",
  "version": "${VITE_PACKAGE_VERSION}",
  "builtAtUtc": "${TIMESTAMP}",
  "gitSha": "${GIT_SHA}"
}
EOF

(
  cd "${DIST_DIR}"
  zip -r "${ARTIFACT_PATH}" . >/dev/null
)

if unzip -Z -1 "${ARTIFACT_PATH}" | grep -Eq '(^|/)secrets\.jsonc$'; then
  rm -f "${ARTIFACT_PATH}"
  echo "PACKAGE_GUARD: removed artifact containing secrets.jsonc"
  exit 1
fi

if command -v sha256sum >/dev/null 2>&1; then
  CHECKSUM="$(sha256sum "${ARTIFACT_PATH}" | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  CHECKSUM="$(shasum -a 256 "${ARTIFACT_PATH}" | awk '{print $1}')"
else
  echo "Missing required command: sha256sum or shasum"
  exit 1
fi
echo "PACKAGE_ARTIFACT=${ARTIFACT_PATH}"
echo "PACKAGE_SHA256=${CHECKSUM}"
