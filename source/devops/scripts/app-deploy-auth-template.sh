#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Deploy the repository-owned Supabase Auth magic-link email template.
#
# Usage: app-deploy-auth-template.sh --target {dev|stage|prod}
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

fail() { echo "APP_DEPLOY_AUTH_TEMPLATE_FAIL: $1"; exit 1; }

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  fail "missing SUPABASE_ACCESS_TOKEN"
fi

if ! command -v curl >/dev/null 2>&1; then
  fail "missing required command: curl"
fi

if ! command -v jq >/dev/null 2>&1; then
  fail "missing required command: jq"
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TEMPLATE_FILE="${ROOT}/supabase/templates/magic-link.html"
SUBJECT="Your swarmAg sign-in code"

if [[ ! -f "${TEMPLATE_FILE}" ]]; then
  fail "missing template file: ${TEMPLATE_FILE}"
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
  echo "APP_DEPLOY_AUTH_TEMPLATE_TARGET"
  echo "TARGET=${TARGET}"
  echo "PROJECT_REF=${PROJECT_REF}"
  echo "TEMPLATE=${TEMPLATE_FILE}"
  read -r -p "Type 'PROD' to deploy auth template to production: " RESPONSE
  if [[ "${RESPONSE}" != "PROD" ]]; then
    fail "production confirmation did not match"
  fi
fi

AUTH_CONFIG_URL="https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth"
PAYLOAD="$(
  jq -n \
    --arg subject "${SUBJECT}" \
    --rawfile html "${TEMPLATE_FILE}" \
    '{
      mailer_subjects_magic_link: $subject,
      mailer_templates_magic_link_content: $html
    }'
)"

api_request() {
  local method="$1"
  local data="${2:-}"
  local response

  if [[ -n "${data}" ]]; then
    response="$(
      curl -sS -w $'\n%{http_code}' -X "${method}" "${AUTH_CONFIG_URL}" \
        -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${data}"
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
VERIFY_SUBJECT="$(printf '%s' "${VERIFY_BODY}" | jq -r '.mailer_subjects_magic_link // empty')"
VERIFY_TEMPLATE_JSON="$(printf '%s' "${VERIFY_BODY}" | jq -c '.mailer_templates_magic_link_content // empty')"
EXPECTED_TEMPLATE_JSON="$(jq -Rs . < "${TEMPLATE_FILE}")"

if [[ "${VERIFY_SUBJECT}" != "${SUBJECT}" ]]; then
  fail "remote magic-link subject did not match expected value"
fi

if [[ "${VERIFY_TEMPLATE_JSON}" != "${EXPECTED_TEMPLATE_JSON}" ]]; then
  fail "remote magic-link template content did not match expected value"
fi

echo "APP_DEPLOY_AUTH_TEMPLATE=PASS target=${TARGET} projectRef=${PROJECT_REF}"
