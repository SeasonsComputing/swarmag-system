/**
 * Architecture guard to enforce import boundaries.
 */

type Namespace = 'domain' | 'utils' | 'serverless' | 'apps' | 'api' | 'tests' | 'external'

const ROOT = Deno.cwd().replaceAll('\\', '/')

const NAMESPACE_DIRS: Record<Exclude<Namespace, 'external'>, string> = {
  domain: '/source/domain/',
  utils: '/source/utils/',
  serverless: '/source/serverless/',
  apps: '/source/apps/',
  api: '/source/api/',
  tests: '/source/tests/'
}

const ALLOWED_DEPS: Record<Exclude<Namespace, 'external'>, Set<Namespace>> = {
  domain: new Set(['domain', 'utils', 'external']),
  utils: new Set(['utils', 'external']),
  serverless: new Set(['serverless', 'domain', 'utils', 'external']),
  apps: new Set(['apps', 'domain', 'utils', 'serverless', 'api', 'external']),
  api: new Set(['api', 'domain', 'utils', 'serverless', 'external']),
  tests: new Set(['tests', 'apps', 'api', 'domain', 'utils', 'serverless', 'external'])
}

const IMPORT_REGEXES = [
  /\bimport\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
  /\bexport\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
]

const normalizePath = (value: string): string => value.replaceAll('\\', '/')

const namespaceForPath = (path: string): Exclude<Namespace, 'external'> | null => {
  const normalized = normalizePath(path)
  if (normalized.includes(NAMESPACE_DIRS.domain)) return 'domain'
  if (normalized.includes(NAMESPACE_DIRS.utils)) return 'utils'
  if (normalized.includes(NAMESPACE_DIRS.serverless)) return 'serverless'
  if (normalized.includes(NAMESPACE_DIRS.apps)) return 'apps'
  if (normalized.includes(NAMESPACE_DIRS.api)) return 'api'
  if (normalized.includes(NAMESPACE_DIRS.tests)) return 'tests'
  return null
}

const namespaceForSpecifier = (specifier: string, filePath: string): Namespace => {
  if (specifier.startsWith('@domain/')) return 'domain'
  if (specifier.startsWith('@utils/')) return 'utils'
  if (specifier.startsWith('@tests-fixtures/') || specifier.startsWith('@tests-helpers/')) {
    return 'tests'
  }
  if (
    specifier.startsWith('@serverless-lib/')
    || specifier.startsWith('@serverless-functions/')
  ) {
    return 'serverless'
  }
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const baseUrl = new URL(`file://${filePath}`)
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
      if (entry.name === 'dist' || entry.name === 'node_modules') continue
      entries.push(...await collectFiles(entryPath))
    } else if (entry.isFile && (entry.name.endsWith('') || entry.name.endsWith('.tsx'))) {
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

const lineNumber = (source: string, index: number): number => source.slice(0, index).split('\n').length

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
    if (!namespace) continue
    const allowed = ALLOWED_DEPS[namespace]
    const source = await Deno.readTextFile(file)
    const imports = findImports(source)

    for (const entry of imports) {
      const target = namespaceForSpecifier(entry.specifier, file)
      if (!allowed.has(target)) {
        const line = lineNumber(source, entry.index)
        const relative = file.replace(`${ROOT}/`, '')
        violations.push(
          `${relative}:${line} imports "${entry.specifier}" (${target}) which is not allowed for ${namespace}`
        )
      }
    }
  }

  if (violations.length > 0) {
    console.error('Architecture guard failed:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    Deno.exit(1)
  }
}

await main()
