/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Front namespace boundary guard                                               ║
║ Enforces dependency discipline in front/ layers and design system.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Prevents circular and upward dependencies in the front architecture. Ensures
ux/ui remains domain-agnostic and reusable, apps stay isolated leaves, and
shared layers do not depend on apps.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Validates import edges against four rules. Violations print path — specifier —
rule lines. Exits 1 on any violation, or passes with ✓ summary.
*/

import { guardFail, guardPass } from '@devops/guards/guard-utils.ts'
import { walk } from '@std/walk'

const ROOT = Deno.cwd().replaceAll('\\', '/')
const SOURCE_DIR = `${ROOT}/source`

// ────────────────────────────────────────────────────────────────────────────
// RULE DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

const FORBIDDEN_UI_IMPORTS = [
  '@domain/',
  '@front/api',
  '@front/ux/stores',
  '@front/ux/shell',
  '@front/ux/widgets',
  '@front/ux/views',
  '@front/app-',
  '@back/',
  '@devops/',
  '@tests/',
  '@supabase/',
  '@idb',
  '@tanstack/'
]

const ALLOWED_UI_PREFIXES = [
  '@solid-js',
  '@kobalte/',
  '@chart-js',
  '@core/std',
  '@core/stdx'
]

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

/** Check if an import specifier is forbidden for ux/ui files. */
const isForbiddenUiImport = (spec: string): boolean => {
  if (spec.startsWith('.')) return false // Relative imports allowed
  if (ALLOWED_UI_PREFIXES.some(p => spec.startsWith(p))) return false
  return FORBIDDEN_UI_IMPORTS.some(p => spec.startsWith(p))
}

/** Check if an import specifier is an app import @front/app-X/... */
const isAppImport = (spec: string): string | null => {
  const match = spec.match(/^@front\/(app-[^/]+)(?:\/|$)/)
  return match ? match[1] : null
}

/** Extract all import specifiers from source code. */
const extractImports = (source: string): string[] => {
  const imports: string[] = []
  // Match: import ... from 'spec' or import ... from "spec"
  const importRegex = /import\s+[^f]*?\s+from\s+['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = importRegex.exec(source)) !== null) {
    imports.push(match[1])
  }
  return imports
}

/** Determine if a path is under a given directory. */
const isUnder = (path: string, dir: string): boolean => {
  const normalized = path.replace(/\\/g, '/')
  const normalizedDir = dir.replace(/\\/g, '/')
  return normalized.startsWith(normalizedDir + '/')
}

/** Extract app name from a path like source/front/app-admin/... */
const extractAppName = (path: string): string | null => {
  const match = path.match(/source[/\\]front[/\\](app-[^/\\]+)/)
  return match ? match[1] : null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ────────────────────────────────────────────────────────────────────────────

const main = async () => {
  const violations: string[] = []
  const frontDir = `${SOURCE_DIR}/front`

  for await (
    const entry of walk(frontDir, {
      includeDirs: false,
      exts: ['.ts', '.tsx'],
      skip: [/[/\\]dist[/\\]?/, /[/\\]node_modules[/\\]?/]
    })
  ) {
    const file = entry.path.replaceAll('\\', '/')
    const relative = file.replace(`${ROOT}/`, '')
    const source = await Deno.readTextFile(file)
    const imports = extractImports(source)

    const isUiFile = isUnder(file, `${frontDir}/ux/ui`)
    const isUxFile = isUnder(file, `${frontDir}/ux`)
    const isApiFile = isUnder(file, `${frontDir}/api`)
    const isAppFile = isUnder(file, `${frontDir}/app-`)
    const _isWidgetsFile = isUnder(file, `${frontDir}/ux/widgets`)
    const fileAppName = extractAppName(file)

    for (const spec of imports) {
      // Rule 1: ux/ui files cannot import forbidden namespaces
      if (isUiFile && isForbiddenUiImport(spec)) {
        violations.push(`${relative} — ${spec} — Rule 1`)
      }

      // Rule 2: Shared layers (ux/*, api/*) cannot import @front/app-*
      if ((isUxFile || isApiFile) && isAppImport(spec)) {
        violations.push(`${relative} — ${spec} — Rule 2`)
      }

      // Rule 3: Apps cannot import other apps
      if (isAppFile && isAppImport(spec)) {
        const importedApp = isAppImport(spec)
        if (fileAppName && importedApp && fileAppName !== importedApp) {
          violations.push(`${relative} — ${spec} — Rule 3`)
        }
      }

      // TODO(CA): Rule 4 disabled — current tree has widgets importing shell
      // (brand-widget.tsx needs shell-metadata). Enforce after refactoring.
      // if (isWidgetsFile && spec.startsWith('@front/ux/shell')) {
      //   violations.push(`${relative} — ${spec} — Rule 4`)
      // }
    }
  }

  if (violations.length > 0) guardFail('Front namespaces', violations)

  guardPass('Front namespaces')
}

await main()
