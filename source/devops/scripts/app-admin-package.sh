#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
if [[ -z "${TARGET}" ]]; then
  echo "Usage: $0 <local|stage|prod> [--init-env] [--genesis] [--secrets-file <path>]"
  exit 1
fi
shift
INIT_ENV="false"
GENESIS_BUILD="false"
SECRETS_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --init-env)
      INIT_ENV="true"
      shift
      ;;
    --genesis)
      GENESIS_BUILD="true"
      shift
      ;;
    --secrets-file)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --secrets-file"
        exit 1
      fi
      SECRETS_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

case "${TARGET}" in
  local|stage|prod) ;;
  *)
    echo "Invalid target '${TARGET}'. Expected one of: local, stage, prod"
    exit 1
    ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_ROOT="${ROOT}/source/ux/app-admin"
ENV_FILE="${ROOT}/source/ux/config/app-admin-${TARGET}.env"
ENV_EXAMPLE_FILE="${ROOT}/source/ux/config/app-admin-${TARGET}.env.example"
UX_CONFIG_FILE="${ROOT}/source/ux/config/ux-config.ts"
BUILD_ROOT="${BUILD_ROOT:-${ROOT}/build}"
DIST_DIR="${BUILD_ROOT}/dist/app-admin"
PACKAGE_DIR="${BUILD_ROOT}/packages"

if [[ ! -f "${ENV_FILE}" ]]; then
  if [[ "${INIT_ENV}" == "true" ]]; then
    if [[ ! -f "${ENV_EXAMPLE_FILE}" ]]; then
      echo "Missing environment example file: ${ENV_EXAMPLE_FILE}"
      exit 1
    fi
    cp "${ENV_EXAMPLE_FILE}" "${ENV_FILE}"
    echo "Initialized environment file: ${ENV_FILE}"
  fi
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing environment file: ${ENV_FILE}"
  echo "Create it from ${ENV_EXAMPLE_FILE}"
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "Missing required command: zip"
  exit 1
fi

REQUIRED_KEYS=()
while IFS= read -r key; do
  [[ -z "${key}" ]] && continue
  REQUIRED_KEYS+=("${key}")
done < <(rg -o "VITE_[A-Z0-9_]+" "${UX_CONFIG_FILE}" | sort -u)
if [[ "${#REQUIRED_KEYS[@]}" -eq 0 ]]; then
  echo "Could not determine required VITE_ keys from ${UX_CONFIG_FILE}"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ "${VITE_PACKAGE_APP_ID:-}" != "swarmag-app-admin" ]]; then
  echo "Invalid VITE_PACKAGE_APP_ID='${VITE_PACKAGE_APP_ID:-}'. Expected 'swarmag-app-admin'"
  exit 1
fi

if [[ "${VITE_PACKAGE_TARGET:-}" != "${TARGET}" ]]; then
  echo "Invalid VITE_PACKAGE_TARGET='${VITE_PACKAGE_TARGET:-}'. Expected '${TARGET}'"
  exit 1
fi

if [[ -n "${SECRETS_FILE}" && ! -f "${SECRETS_FILE}" ]]; then
  echo "Missing secrets file: ${SECRETS_FILE}"
  exit 1
fi

if [[ "${GENESIS_BUILD}" == "true" ]]; then
  if [[ -z "${SECRETS_FILE}" ]]; then
    echo "Genesis build requires --secrets-file <path>"
    exit 1
  fi

  rm -rf "${DIST_DIR}"
  rm -f "${PACKAGE_DIR}/swarmag-app-admin-${TARGET}-"*.zip

  rotated_secret="$(deno run source/devops/scripts/gen-jwt-secret.ts)"
  deno run --allow-read --allow-write source/devops/scripts/set-secret.ts \
    "${SECRETS_FILE}" \
    "app-admin.${TARGET}.VITE_JWT_SECRET" \
    "${rotated_secret}"
  echo "GENESIS: rotated app-admin.${TARGET}.VITE_JWT_SECRET in ${SECRETS_FILE}"
fi

if [[ -n "${SECRETS_FILE}" ]]; then
  for key in "${REQUIRED_KEYS[@]}"; do
    current="${!key:-}"
    if [[ "${current}" != "__SECRET__" ]]; then
      continue
    fi
    composed_key="${VITE_PACKAGE_APP_ID}.${TARGET}.${key}"
    resolved_secret="$(
      deno run --allow-read source/devops/scripts/read-secret.ts "${SECRETS_FILE}" "${composed_key}"
    )"
    if [[ -z "${resolved_secret}" ]]; then
      echo "Missing secret for ${composed_key} in ${SECRETS_FILE}"
      exit 1
    fi
    export "${key}=${resolved_secret}"
  done
fi

MISSING_KEYS=()
for key in "${REQUIRED_KEYS[@]}"; do
  value="${!key:-}"
  if [[ -z "${value}" ]]; then
    MISSING_KEYS+=("${key}")
    continue
  fi
  if [[ "${TARGET}" == "prod" && "${value}" == "__SECRET__" ]]; then
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

mkdir -p "${PACKAGE_DIR}"
rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"

(
  cd "${APP_ROOT}"
  VITE_MODE="${TARGET}"
  if [[ "${TARGET}" == "local" ]]; then
    VITE_MODE="development"
  fi
  deno run -A npm:vite build --config vite.config.ts --mode "${VITE_MODE}" --outDir "${DIST_DIR}" --emptyOutDir
)

REQUIRED_STATIC_FILES=("manifest.webmanifest" "sw.js" "icon.png")
for file in "${REQUIRED_STATIC_FILES[@]}"; do
  SOURCE_FILE="${APP_ROOT}/${file}"
  if [[ ! -f "${SOURCE_FILE}" ]]; then
    echo "Missing required app-admin static file: ${SOURCE_FILE}"
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
ARTIFACT_BASENAME="swarmag-app-admin-${TARGET}-${TIMESTAMP}-${GIT_SHA}"
ARTIFACT_PATH="${PACKAGE_DIR}/${ARTIFACT_BASENAME}.zip"
BUILD_META_PATH="${DIST_DIR}/build-meta.json"

cat > "${BUILD_META_PATH}" <<EOF
{
  "app": "${VITE_PACKAGE_APP_ID}",
  "target": "${TARGET}",
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
