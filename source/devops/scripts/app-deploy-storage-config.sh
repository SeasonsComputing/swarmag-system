#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║ Storage configuration deployment                                        ║
# ║ Apply and verify repository-owned namespace configuration.              ║
# ╚══════════════════════════════════════════════════════════════════════════╝
set -euo pipefail
deno run --allow-read --allow-env --allow-net --allow-run source/devops/scripts/app-deploy-storage-config.ts "$@"
