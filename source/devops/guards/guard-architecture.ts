/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Architecture boundary guard                                                  ║
║ Enforce layer direction and the closed core standard library                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Checks source imports for layer, application, configuration, and closed-std
boundary violations. Runs as a script; exposes the std check for focused tests.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
checkCoreStdBoundary(file, source)  Report imports escaping the std boundary.
*/

import { guardFail, guardPass } from '@devops/guards/guard-utils.ts'

/**
 * Report dependencies outside the closed core standard library.
 * @param file Absolute source file path.
 * @param source Source text to inspect.
 * @returns Violations with source line numbers; empty for files outside std.
 */
export const checkCoreStdBoundary = (file: string, source: string): string[] => {
  const directory = `${ROOT}/source/core/std/`
  const normalized = normalizePath(file)
  if (!normalized.startsWith(directory)) return []

  const violations: string[] = []
  for (const { specifier, index } of findImports(source)) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../')
    if (relative) {
      const target = new URL(specifier, new URL(`file://${normalized}`))
      if (decodeURIComponent(target.pathname).startsWith(directory)) continue
    }
    violations.push(
      `${normalized.replace(`${ROOT}/`, '')}:${lineNumber(source, index)} - `
        + `core/std requires relative imports within std (imports "${specifier}")`
    )
  }
  return violations
}

const ROOT = Deno.cwd().replaceAll('\\', '/')

/** Namespace to directory mapping */
const NamespaceDirs = {
  core: '/source/core',
  domain: '/source/domain',
  back: '/source/back',
  front: '/source/front',
  ux: '/source/ux',
  devops: '/source/devops',
  tests: '/source/tests'
} as const

/** Source namespace or external dependency classification. */
type Namespace =
  | keyof typeof NamespaceDirs
  | 'external'

/** Allowed dependencies per namespace (downward dependency flow) */
const AllowedDeps: Record<Namespace, Set<Namespace>> = {
  tests: new Set(['tests', 'devops', 'ux', 'front', 'back', 'domain', 'core', 'external']),
  devops: new Set(['devops', 'ux', 'front', 'back', 'domain', 'core', 'external']),
  ux: new Set(['ux', 'domain', 'core', 'external']),
  front: new Set(['front', 'ux', 'domain', 'core', 'external']),
  back: new Set(['back', 'domain', 'core', 'external']),
  domain: new Set(['domain', 'core', 'external']),
  core: new Set(['core', 'external']),
  external: new Set()
}

/** UX apps forbidden from importing these internals */
const UX_FORBIDDEN_IMPORTS = [
  '@core/cfg/',
  '@back',
  '@back-supabase-edge/'
]

/** Import detection regexes */
const IMPORT_REGEXES = [
  /\b(?:import|export)\s+(?:type\s+)?\{[^}]*\}\s*from\s+['"]([^'"]+)['"]/g,
  /\b(?:import|export)\s+(?:type\s+)?\*\s*(?:as\s+\w+)?\s*from\s+['"]([^'"]+)['"]/g,
  /\bimport\s+[\w$]+(?:\s*,\s*\{[^}]*\})?\s*from\s+['"]([^'"]+)['"]/g,
  /\bimport\s+[\w$]+\s*,\s*\*\s+as\s+\w+\s*from\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s*['"]([^'"]+)['"]/g
]

const EXCLUDED_DIRS = new Set(['dist', 'node_modules'])

const normalizePath = (value: string): string => value.replaceAll('\\', '/')

const namespaceForPath = (path: string): Namespace | null => {
  const normalized = normalizePath(path)
  for (const [namespace, dir] of Object.entries(NamespaceDirs)) {
    if (normalized.includes(dir)) return namespace as Namespace
  }
  return null
}

const namespaceForSpecifier = (specifier: string, fromFile: string): Namespace => {
  // Core
  if (specifier.startsWith('@core/') || specifier === '@core/std') return 'core'

  // Domain
  if (specifier.startsWith('@domain/')) return 'domain'

  // Back
  if (specifier.startsWith('@back') || specifier.startsWith('@back/supabase-edge/')) {
    return 'back'
  }

  // Generic UX toolkit
  if (specifier.startsWith('@ux/')) return 'ux'

  // Front applications
  if (specifier.startsWith('@front/') || specifier.startsWith('@front/app-')) {
    return 'front'
  }

  // DevOps
  if (specifier.startsWith('@devops')) return 'devops'

  // Tests
  if (specifier.startsWith('@tests')) return 'tests'
  if (specifier.startsWith('@tests-fixtures/') || specifier.startsWith('@tests-helpers/')) {
    return 'tests'
  }

  // Relative
  if (specifier.startsWith('.')) {
    const baseUrl = new URL(`file://${fromFile}`)
    const resolved = new URL(specifier, baseUrl).pathname
    return namespaceForPath(resolved) ?? 'external'
  }

  return 'external'
}

const collectFiles = async (dir: string): Promise<string[]> => {
  const entries: string[] = []
  for await (const entry of Deno.readDir(dir)) {
    const entryPath = `${dir}/${entry.name}`
    if (entry.isDirectory) {
      if (EXCLUDED_DIRS.has(entry.name)) continue
      entries.push(...await collectFiles(entryPath))
    } else if (entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      entries.push(entryPath)
    }
  }
  return entries
}

const findImports = (source: string): Array<{ specifier: string; index: number }> => {
  const imports: Array<{ specifier: string; index: number }> = []
  // Consume comments and quoted text before trying module-reference patterns.
  const ignored = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\//
  const scanner = new RegExp(
    [ignored.source, ...IMPORT_REGEXES.map(regex => regex.source)].join('|'),
    'g'
  )
  let match: RegExpExecArray | null
  while ((match = scanner.exec(source)) !== null) {
    const specifier = match.slice(1).find(value => value !== undefined)
    if (specifier !== undefined) imports.push({ specifier, index: match.index })
  }
  return imports
}

const lineNumber = (source: string, index: number): number => source.slice(0, index).split('\n').length

const isUxAppFile = (file: string): boolean => {
  const normalized = normalizePath(file)
  return normalized.includes('/source/front/app-admin/')
    || normalized.includes('/source/front/app-ops/')
    || normalized.includes('/source/front/app-customer/')
}

const isConfigModule = (file: string): boolean => {
  const normalized = normalizePath(file)
  return normalized.includes('/config/') && normalized.endsWith('config.ts')
}

const checkFrontImports = (file: string, imports: Array<{ specifier: string }>): string[] => {
  if (!isUxAppFile(file)) return []

  const violations: string[] = []
  for (const { specifier } of imports) {
    for (const forbidden of UX_FORBIDDEN_IMPORTS) {
      if (specifier.startsWith(forbidden)) {
        violations.push(
          `Forbidden import: ${specifier} `
            + '(use @front/api/api.ts, @domain, @core/std, or @core/stdx instead)'
        )
      }
    }
  }
  return violations
}

// Validate Config singleton usage
const checkConfigImports = (file: string, imports: Array<{ specifier: string }>): string[] => {
  const violations: string[] = []
  const configModule = isConfigModule(file)
  const fileNamespace = namespaceForPath(file)
  const enforceInFile = fileNamespace === 'back' || isUxAppFile(file)
  if (!enforceInFile) return violations

  for (const { specifier } of imports) {
    // Direct Config import only in config modules
    if (specifier === '@core/cfg/config.ts' && !configModule) {
      violations.push(
        'Direct Config import (use package config module: '
          + '@back-supabase-edge/config/... or @front/app-*/config/...)'
      )
    }

    // Provider imports only in config modules
    if (
      specifier.startsWith('@core/cfg/') && specifier.endsWith('provider.ts') && !configModule
    ) {
      violations.push('Direct provider import (only allowed in config modules)')
    }
  }

  return violations
}

const exists = async (path: string): Promise<boolean> => {
  try {
    const info = await Deno.stat(path)
    return info.isDirectory
  } catch {
    return false
  }
}

const main = async () => {
  const roots = Object.values(NamespaceDirs).map(dir => `${ROOT}${dir}`)
  const existingRoots = []
  for (const root of roots) {
    if (await exists(root)) existingRoots.push(root)
  }

  const files = (await Promise.all(existingRoots.map(collectFiles))).flat()
  const violations: string[] = []

  for (const file of files) {
    const namespace = namespaceForPath(file)
    if (!namespace || namespace === 'external') continue

    const source = await Deno.readTextFile(file)
    const imports = findImports(source)
    const relative = file.replace(`${ROOT}/`, '')

    // Check namespace dependency rules
    const allowed = AllowedDeps[namespace]
    for (const entry of imports) {
      const target = namespaceForSpecifier(entry.specifier, file)
      if (!allowed.has(target)) {
        const line = lineNumber(source, entry.index)
        violations.push(
          `${relative}:${line} - ${namespace} cannot import from ${target} `
            + `(imports "${entry.specifier}")`
        )
      }
    }

    violations.push(...checkCoreStdBoundary(file, source))

    // UX-specific rules
    const frontViolations = checkFrontImports(file, imports)
    for (const violation of frontViolations) {
      violations.push(`${relative} - ${violation}`)
    }

    // Config import rules
    const configViolations = checkConfigImports(file, imports)
    for (const violation of configViolations) {
      violations.push(`${relative} - ${violation}`)
    }
  }

  if (violations.length > 0) {
    guardFail('Architecture', violations, 'See documentation/architecture-core.md for dependency rules')
  }

  guardPass('Architecture')
}

if (import.meta.main) await main()
