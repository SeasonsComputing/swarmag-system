/**
 * Guard against bypassing @core-std container primitives.
 */

const ROOT = Deno.cwd().replaceAll('\\', '/')
const TARGET_DIRS = [`${ROOT}/source`]
const EXCLUDED_DIRS = new Set(['dist', 'node_modules'])

const ALLOWED_FILES = new Set([
  'source/core/std/adt.ts',
  'source/devops/guard-core-std-types.ts'
])

const RULES = [
  {
    pattern: /\bRecord\s*<\s*string\s*,\s*unknown\s*>/g,
    message: 'Use Dictionary from @core-std instead of Record<string, unknown>'
  },
  {
    pattern: /\bRecord\s*<\s*string\s*,\s*string\s*>/g,
    message: 'Use StringDictionary from @core-std'
  },
  {
    pattern: /\bSet\s*<\s*string\s*>/g,
    message: 'Use StringSet from @core-std instead of Set<string>'
  }
] as const

const collectFiles = async (dir: string): Promise<string[]> => {
  const entries: string[] = []
  for await (const entry of Deno.readDir(dir)) {
    const entryPath = `${dir}/${entry.name}`
    if (entry.isDirectory) {
      if (EXCLUDED_DIRS.has(entry.name)) continue
      entries.push(...await collectFiles(entryPath))
    } else if (
      entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
    ) {
      entries.push(entryPath)
    }
  }
  return entries
}

const lineNumber = (source: string, index: number): number =>
  source.slice(0, index).split('\n').length

const exists = async (path: string): Promise<boolean> => {
  try {
    const info = await Deno.stat(path)
    return info.isDirectory
  } catch {
    return false
  }
}

const main = async () => {
  const roots = []
  for (const dir of TARGET_DIRS) {
    if (await exists(dir)) roots.push(dir)
  }

  const files = (await Promise.all(roots.map(collectFiles))).flat()
  const violations: string[] = []

  for (const file of files) {
    const relative = file.replace(`${ROOT}/`, '')
    if (ALLOWED_FILES.has(relative)) continue

    const source = await Deno.readTextFile(file)

    for (const rule of RULES) {
      let match: RegExpExecArray | null
      while ((match = rule.pattern.exec(source)) !== null) {
        const line = lineNumber(source, match.index)
        violations.push(`${relative}:${line} - ${rule.message}`)
      }
    }
  }

  if (violations.length > 0) {
    console.error('Core std types guard failed:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    Deno.exit(1)
  }

  console.log('✓ Core std types guard passed')
}

await main()
