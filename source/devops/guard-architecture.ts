/**
 * Guard against architectural boundary violations.
 * Enforces dependency rules: tests/devops -> ux -> back -> domain -> core
 */

const ROOT = Deno.cwd().replaceAll('\\', '/')

/** Namespace to directory mapping */
const NAMESPACE_DIRS = {
  core: '/source/core',
  domain: '/source/domain',
  back: '/source/back',
  ux: '/source/ux',
  devops: '/source/devops',
  tests: '/source/tests'
} as const

type Namespace = keyof typeof NAMESPACE_DIRS | 'external'

/** Allowed dependencies per namespace (downward dependency flow) */
const ALLOWED_DEPS: Record<Namespace, Set<Namespace>> = {
  tests: new Set(['tests', 'ux', 'back', 'domain', 'core', 'external']),
  devops: new Set(['devops', 'ux', 'back', 'domain', 'core', 'external']),
  ux: new Set(['ux', 'domain', 'core', 'external']),
  back: new Set(['back', 'domain', 'core', 'external']),
  domain: new Set(['domain', 'core', 'external']),
  core: new Set(['core', 'external']),
  external: new Set()
}

/** UX apps forbidden from importing these internals */
const UX_FORBIDDEN_IMPORTS = [
  '@core/api/',
  '@core/cfg/',
  '@back',
  '@back-supabase-edge/',
  '@domain/adapters/'
]

/** Import detection regexes */
const IMPORT_REGEXES = [
  /\bimport\s+(?:type\s+)?[\s\S]*?from\s+['"]([^'"]+)['"]/g,
  /\bexport\s+(?:type\s+)?[\s\S]*?from\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
]

const EXCLUDED_DIRS = new Set(['dist', 'node_modules'])

const normalizePath = (value: string): string => value.replaceAll('\\', '/')

const namespaceForPath = (path: string): Namespace | null => {
  const normalized = normalizePath(path)
  for (const [namespace, dir] of Object.entries(NAMESPACE_DIRS)) {
    if (normalized.includes(dir)) return namespace as Namespace
  }
  return null
}

const namespaceForSpecifier = (specifier: string, fromFile: string): Namespace => {
  // Core
  if (specifier.startsWith('@core/') || specifier === '@core-std') return 'core'

  // Domain
  if (specifier.startsWith('@domain/')) return 'domain'

  // Back
  if (specifier.startsWith('@back') || specifier.startsWith('@back-supabase-edge/')) {
    return 'back'
  }

  // UX
  if (
    specifier.startsWith('@ux/')
    || specifier === '@ux-api'
    || specifier.startsWith('@ux-app-')
  ) {
    return 'ux'
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
  for (const regex of IMPORT_REGEXES) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(source)) !== null) {
      imports.push({ specifier: match[1], index: match.index })
    }
  }
  return imports
}

const lineNumber = (source: string, index: number): number =>
  source.slice(0, index).split('\n').length

const isUxAppFile = (file: string): boolean => {
  const normalized = normalizePath(file)
  return normalized.includes('/source/ux/app-admin/')
    || normalized.includes('/source/ux/app-ops/')
    || normalized.includes('/source/ux/app-customer/')
}

const isConfigModule = (file: string): boolean => {
  const normalized = normalizePath(file)
  return normalized.includes('/config/')
    && normalized.endsWith('config.ts')
}

const checkUxImports = (file: string, imports: Array<{ specifier: string }>): string[] => {
  if (!isUxAppFile(file)) return []

  const violations: string[] = []
  for (const { specifier } of imports) {
    for (const forbidden of UX_FORBIDDEN_IMPORTS) {
      if (specifier.startsWith(forbidden)) {
        violations.push(
          `Forbidden import: ${specifier} (use @ux-api, @domain, or @core-std instead)`
        )
      }
    }
  }
  return violations
}

/** Validate Config singleton usage */
const checkConfigImports = (
  file: string,
  imports: Array<{ specifier: string }>
): string[] => {
  const violations: string[] = []
  const configModule = isConfigModule(file)
  const fileNamespace = namespaceForPath(file)
  const enforceInFile = fileNamespace === 'back' || isUxAppFile(file)
  if (!enforceInFile) return violations

  for (const { specifier } of imports) {
    // Direct Config import only in config modules
    if (specifier === '@core/cfg/config.ts' && !configModule) {
      violations.push(
        'Direct Config import (use package config module: @back-supabase-edge/config/... or @ux-app-*/config/...)'
      )
    }

    // Provider imports only in config modules
    if (
      specifier.startsWith('@core/cfg/')
      && specifier.endsWith('provider.ts')
      && !configModule
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
  const roots = Object.values(NAMESPACE_DIRS).map(dir => `${ROOT}${dir}`)
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
    const allowed = ALLOWED_DEPS[namespace]
    for (const entry of imports) {
      const target = namespaceForSpecifier(entry.specifier, file)
      if (!allowed.has(target)) {
        const line = lineNumber(source, entry.index)
        violations.push(
          `${relative}:${line} - ${namespace} cannot import from ${target} (imports "${entry.specifier}")`
        )
      }
    }

    // UX-specific rules
    const uxViolations = checkUxImports(file, imports)
    for (const violation of uxViolations) {
      violations.push(`${relative} - ${violation}`)
    }

    // Config import rules
    const configViolations = checkConfigImports(file, imports)
    for (const violation of configViolations) {
      violations.push(`${relative} - ${violation}`)
    }
  }

  if (violations.length > 0) {
    console.error('Architecture guard failed:')
    console.error('')
    for (const violation of violations) {
      console.error(`  ${violation}`)
    }
    console.error('')
    console.error('See documentation/foundation/architecture-core.md for dependency rules')
    Deno.exit(1)
  }

  console.log('✓ Architecture guard passed')
}

await main()
