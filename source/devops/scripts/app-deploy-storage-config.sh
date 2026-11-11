#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║ Storage configuration deployment                                         ║
# ║ Apply and verify repository-owned native root configuration.             ║
# ╚══════════════════════════════════════════════════════════════════════════╝
set -euo pipefail
deno run --allow-read --allow-env --allow-net --allow-run \
  source/devops/scripts/app-deploy-storage-config.ts "$@"
