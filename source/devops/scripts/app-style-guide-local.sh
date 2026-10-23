#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║ Style guide local serving                                                ║
# ║ Serves the style guide through the local Vite host.                      ║
# ╚══════════════════════════════════════════════════════════════════════════╝

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
APP_ROOT="${ROOT}/source/front/app-style-guide"
PORT="${PORT:-5174}"

cd "${APP_ROOT}"
deno run -A npm:vite --config vite.config.ts --host 0.0.0.0 --port "${PORT}"
