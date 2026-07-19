#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Deploy one or more UX apps: check, package, verify, deploy, smoke-test.
#
# Usage: app-deploy.sh --app {admin|ops|customer} [app …] --target {dev|stage|prod}
# ──────────────────────────────────────────────────────────────────────────────

APPS=()
TARGET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      shift
      while [[ $# -gt 0 && "$1" != --* ]]; do
        APPS+=("$1")
        shift
      done
      ;;
    --target)
      TARGET="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 --app {admin|ops|customer} [app …] --target {dev|stage|prod}"
      exit 1
      ;;
  esac
done

if [[ ${#APPS[@]} -eq 0 || -z "${TARGET}" ]]; then
  echo "Usage: $0 --app {admin|ops|customer} [app …] --target {dev|stage|prod}"
  exit 1
fi

for app in "${APPS[@]}"; do
  case "$app" in
    admin|ops|customer) ;;
    *)
      echo "Invalid app '${app}'. Expected one of: admin, ops, customer"
      exit 1
      ;;
  esac
done

case "${TARGET}" in
  dev|stage|prod) ;;
  *)
    echo "Invalid target '${TARGET}'. Expected one of: dev, stage, prod"
    exit 1
    ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

fail() { echo ""; echo "DEPLOY_FAIL: $1"; exit 1; }
step() { echo ""; echo "[$1] $2"; }
pass() { echo "$1=PASS"; }

echo ""
echo "deploy --app ${APPS[*]} --target ${TARGET}"

# ── 1 of 5: check ─────────────────────────────────────────────────────────────
step "1/5" "Running checks..."
(cd "${ROOT}" && deno task check) || fail "check failed"
pass "CHECK"

# ── 2 of 5: git clean ─────────────────────────────────────────────────────────
step "2/5" "Verifying clean working tree..."
GIT_STATUS="$(git -C "${ROOT}" status --porcelain)"
if [[ -n "${GIT_STATUS}" ]]; then
  echo "${GIT_STATUS}"
  fail "working tree is not clean"
fi
pass "GIT_CLEAN"

# ── 3 of 5: Netlify auth + site resolution ────────────────────────────────────
step "3/5" "Resolving Netlify sites..."
SITES_JSON="$(netlify sites:list --json 2>/dev/null)" \
  || fail "netlify sites:list failed — authenticate with: netlify login"

if ! echo "${SITES_JSON}" | python3 -c \
    'import json,sys; v=json.load(sys.stdin); assert isinstance(v, list)' 2>/dev/null; then
  fail "netlify sites:list did not return a site list — authenticate with: netlify login"
fi

declare -A SITE_IDS
declare -A SITE_URLS

for app in "${APPS[@]}"; do
  SITE_NAME="swarmag-app-${app}-${TARGET}"
  PARSED="$(echo "${SITES_JSON}" | python3 -c "
import json, sys
sites = json.load(sys.stdin)
for s in sites:
    if s.get('name') == '${SITE_NAME}':
        url = s.get('ssl_url') or s.get('url') or ''
        print(s.get('id', '') + '|' + url)
        break
" 2>/dev/null || true)"

  [[ -n "${PARSED}" ]] || fail "Netlify site not found: ${SITE_NAME}"

  SITE_IDS["${app}"]="${PARSED%%|*}"
  SITE_URLS["${app}"]="${PARSED#*|}"
  echo "  ${SITE_NAME} → ${SITE_IDS[${app}]}"
done
pass "NETLIFY_SITES"

# ── 4 of 5: package, verify, deploy ───────────────────────────────────────────
step "4/5" "Packaging and deploying..."

for app in "${APPS[@]}"; do
  SITE_NAME="swarmag-app-${app}-${TARGET}"
  echo ""
  echo "  ${SITE_NAME}"

  # Package
  echo "  [package]"
  PACKAGE_OUT="$(bash "${ROOT}/source/devops/scripts/app-${app}-package.sh" "${TARGET}" \
    --secrets-file "${ROOT}/secrets.jsonc" 2>&1)" || {
    echo "${PACKAGE_OUT}"
    fail "${app} package failed"
  }
  echo "${PACKAGE_OUT}" | grep -E '^(PACKAGE_ARTIFACT|PACKAGE_SHA256|PACKAGE_GUARD)' || true
  ARTIFACT="$(echo "${PACKAGE_OUT}" | grep '^PACKAGE_ARTIFACT=' | cut -d= -f2-)"
  [[ -n "${ARTIFACT}" && -f "${ARTIFACT}" ]] || fail "${app} package did not produce an artifact"

  # Verify
  echo "  [verify]"
  VERIFY_OUT="$(bash "${ROOT}/source/devops/scripts/app-${app}-package-verify.sh" \
    "${TARGET}" "${ARTIFACT}" 2>&1)" || {
    echo "${VERIFY_OUT}"
    fail "${app} verify failed"
  }
  echo "${VERIFY_OUT}" | grep -E '^PACKAGE_VERIFY' || true
  echo "${VERIFY_OUT}" | grep -q '^PACKAGE_VERIFY=PASS' || fail "${app} verify did not pass"

  # Deploy
  echo "  [deploy] → ${SITE_URLS[${app}]}"
  DEPLOY_TMP="$(mktemp -d)"
  unzip -q "${ARTIFACT}" -d "${DEPLOY_TMP}"
  (cd "${DEPLOY_TMP}" && netlify deploy --dir . --site "${SITE_IDS[${app}]}" --prod) || {
    rm -rf "${DEPLOY_TMP}"
    fail "${app} deploy failed"
  }
  rm -rf "${DEPLOY_TMP}"
done
pass "DEPLOYED"

# ── 5 of 5: smoke test ────────────────────────────────────────────────────────
step "5/5" "Smoke testing..."
SMOKE_ARGS=("--target" "${TARGET}")
for app in "${APPS[@]}"; do
  SMOKE_ARGS+=("${app}=${SITE_URLS[${app}]}")
done
(cd "${ROOT}" && deno run \
  --allow-net --allow-read --allow-run --allow-write \
  source/devops/scripts/smoke-ux.ts \
  "${SMOKE_ARGS[@]}") || fail "smoke test failed"
pass "SMOKE"

echo ""
echo "DEPLOY=PASS target=${TARGET} apps=${APPS[*]}"
