#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Deploy the repository-owned hosted Supabase Auth configuration.
#
# Usage: app-deploy-auth-config.sh --target {dev|stage|prod}
# ──────────────────────────────────────────────────────────────────────────────

TARGET=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 --target {dev|stage|prod}"
      exit 1
      ;;
  esac
done

if [[ -z "${TARGET}" ]]; then
  echo "Usage: $0 --target {dev|stage|prod}"
  exit 1
fi

case "${TARGET}" in
  dev|stage|prod) ;;
  *)
    echo "Invalid target '${TARGET}'. Expected one of: dev, stage, prod"
    exit 1
    ;;
esac

fail() { echo "APP_DEPLOY_AUTH_CONFIG_FAIL: $1"; exit 1; }

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  fail "missing SUPABASE_ACCESS_TOKEN"
fi

if [[ -z "${BREVO_SMTP_KEY:-}" ]]; then
  fail "missing BREVO_SMTP_KEY"
fi

if ! command -v curl >/dev/null 2>&1; then
  fail "missing required command: curl"
fi

if ! command -v jq >/dev/null 2>&1; then
  fail "missing required command: jq"
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CONFIG_FILE="${ROOT}/supabase/auth/${TARGET}.jsonc"
TEMPLATE_FILE="${ROOT}/supabase/templates/magic-link.html"

if [[ ! -f "${CONFIG_FILE}" ]]; then
  fail "hosted Auth target not provisioned: ${TARGET}"
fi

if [[ ! -f "${TEMPLATE_FILE}" ]]; then
  fail "missing template file: ${TEMPLATE_FILE}"
fi

if ! jq -e 'type == "object"' "${CONFIG_FILE}" >/dev/null; then
  fail "invalid hosted Auth configuration: ${CONFIG_FILE}"
fi

TARGETS_JSON="$(
  cd "${ROOT}" && deno task list-supabase-targets --target "${TARGET}"
)" || fail "could not resolve Supabase target: ${TARGET}"

PROJECT_REF="$(
  echo "${TARGETS_JSON}" | jq -r --arg target "${TARGET}" '.[$target].projectRef // empty'
)"

if [[ -z "${PROJECT_REF}" ]]; then
  fail "Supabase target missing projectRef: ${TARGET}"
fi

if [[ "${TARGET}" == "prod" ]]; then
  echo ""
  echo "APP_DEPLOY_AUTH_CONFIG_TARGET"
  echo "TARGET=${TARGET}"
  echo "PROJECT_REF=${PROJECT_REF}"
  echo "CONFIG=${CONFIG_FILE}"
  read -r -p "Type 'PROD' to deploy hosted Auth configuration to production: " RESPONSE
  if [[ "${RESPONSE}" != "PROD" ]]; then
    fail "production confirmation did not match"
  fi
fi

AUTH_CONFIG_URL="https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth"
PAYLOAD="$(
  jq \
    --rawfile html "${TEMPLATE_FILE}" \
    '. + {
      mailer_templates_magic_link_content: $html,
      smtp_pass: env.BREVO_SMTP_KEY
    }' \
    "${CONFIG_FILE}"
)"

api_request() {
  local method="$1"
  local data="${2:-}"
  local response

  if [[ -n "${data}" ]]; then
    response="$(
      printf '%s' "${data}" | curl -sS -w $'\n%{http_code}' -X "${method}" "${AUTH_CONFIG_URL}" \
        -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        --data-binary @-
    )" || fail "Supabase auth config ${method} request failed"
  else
    response="$(
      curl -sS -w $'\n%{http_code}' -X "${method}" "${AUTH_CONFIG_URL}" \
        -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
        -H "Content-Type: application/json"
    )" || fail "Supabase auth config ${method} request failed"
  fi

  local status="${response##*$'\n'}"
  local body="${response%$'\n'*}"

  if [[ ! "${status}" =~ ^2[0-9][0-9]$ ]]; then
    fail "Supabase auth config ${method} failed (${status}): ${body}"
  fi

  printf '%s' "${body}"
}

api_request PATCH "${PAYLOAD}" >/dev/null

VERIFY_BODY="$(api_request GET)"
EXPECTED_BODY="$(
  jq \
    --rawfile html "${TEMPLATE_FILE}" \
    '. + {mailer_templates_magic_link_content: $html}' \
    "${CONFIG_FILE}"
)"

while IFS= read -r key; do
  EXPECTED_VALUE="$(printf '%s' "${EXPECTED_BODY}" | jq -c --arg key "${key}" '.[$key]')"
  VERIFY_VALUE="$(printf '%s' "${VERIFY_BODY}" | jq -c --arg key "${key}" '.[$key]')"
  if [[ "${key}" == "smtp_port" ]]; then
    EXPECTED_VALUE="$(printf '%s' "${EXPECTED_VALUE}" | jq -r 'tostring')"
    VERIFY_VALUE="$(printf '%s' "${VERIFY_VALUE}" | jq -r 'tostring')"
  fi
  if [[ "${VERIFY_VALUE}" != "${EXPECTED_VALUE}" ]]; then
    fail "remote hosted Auth configuration mismatch: ${key}"
  fi
done < <(printf '%s' "${EXPECTED_BODY}" | jq -r 'keys[]')

echo "APP_DEPLOY_AUTH_CONFIG=PASS target=${TARGET} projectRef=${PROJECT_REF}"
