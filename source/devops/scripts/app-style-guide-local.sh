#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_ROOT="${ROOT}/source/ux/app-style-guide"
PORT="${PORT:-5174}"

cd "${APP_ROOT}"
deno run -A npm:vite --config vite.config.ts --host 127.0.0.1 --port "${PORT}"
