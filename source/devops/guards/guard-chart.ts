/**
 * Guard Chart.js boundary usage.
 * Enforces Chart.js imports only within UX chart primitives.
 */

const ROOT = Deno.cwd().replaceAll('\\', '/')
const TARGET_DIR = `${ROOT}/source/ux`
const ALLOWED_DIR = '/source/ux/common/components/charts/'
const EXCLUDED_DIRS = new Set(['dist', 'node_modules'])

const CHART_SPECIFIERS = [
  '@chart-js',
  'chart.js'
]

const IMPORT_REGEXES = [
  /\bimport\s+(?:type\s+)?[\s\S]*?from\s+['"]([^'"]+)['"]/g,
  /\bexport\s+(?:type\s+)?[\s\S]*?from\s+['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
]

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

const lineNumber = (source: string, index: number): number => source.slice(0, index).split('\n').length

const isChartSpecifier = (specifier: string): boolean =>
  CHART_SPECIFIERS.some(prefix => specifier === prefix || specifier.startsWith(`${prefix}/`))

const main = async () => {
  const files = await collectFiles(TARGET_DIR)
  const violations: string[] = []

  for (const file of files) {
    const source = await Deno.readTextFile(file)
    const imports = findImports(source)
    const relative = file.replace(`${ROOT}/`, '')
    const inAllowedDir = file.replaceAll('\\', '/').includes(ALLOWED_DIR)

    for (const entry of imports) {
      if (!isChartSpecifier(entry.specifier)) continue
      if (inAllowedDir) continue
      const line = lineNumber(source, entry.index)
      violations.push(
        `${relative}:${line} imports ${entry.specifier} outside ${ALLOWED_DIR}`
      )
    }
  }

  if (violations.length > 0) {
    console.error('Chart guard failed:')
    console.error('')
    for (const violation of violations) console.error(`  ${violation}`)
    console.error('')
    console.error('Rule: Chart.js is an implementation detail of AppChart in chart primitives.')
    Deno.exit(1)
  }

  console.log('✓ Chart guard passed')
}

await main()
