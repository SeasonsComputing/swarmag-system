/**
 * Guard against direct Deno.env usage outside config providers.
 */

/** Absolute path to the repo root. */
const ROOT = Deno.cwd().replaceAll('\\', '/')

/** Directories to scan for guard violations. */
const TARGET_DIRS = [`${ROOT}/source`, `${ROOT}/devops`]

/** Directory names to skip during traversal. */
const EXCLUDED_DIRS = new Set(['dist', 'node_modules'])

/** Relative paths that are allowed to use Deno.env. */
const ALLOWED_FILES = new Set(['devops/scripts/env-guard.ts', 'source/utils/configure-deno.ts'])

/** Match direct Deno.env or Deno.test access. */
const DISALLOWED_USAGE = /\bDeno\.env\b/g

/** Collect all file paths under a directory. */
const collectFiles = async (dir: string): Promise<string[]> => {
  const entries: string[] = []
  for await (const entry of Deno.readDir(dir)) {
    const entryPath = `${dir}/${entry.name}`
    if (entry.isDirectory) {
      if (EXCLUDED_DIRS.has(entry.name)) continue
      entries.push(...await collectFiles(entryPath))
    } else if (entry.isFile && (entry.name.endsWith('') || entry.name.endsWith('.tsx'))) {
      entries.push(entryPath)
    }
  }
  return entries
}

/** Convert a zero-based index into a 1-based line number. */
const lineNumber = (source: string, index: number): number => source.slice(0, index).split('\n').length

const main = async () => {
  const files = (await Promise.all(TARGET_DIRS.map(collectFiles))).flat()
  const violations: string[] = []

  for (const file of files) {
    const relative = file.replace(`${ROOT}/`, '')
    if (ALLOWED_FILES.has(relative)) continue

    const source = await Deno.readTextFile(file)
    let match: RegExpExecArray | null
    while ((match = DISALLOWED_USAGE.exec(source)) !== null) {
      const line = lineNumber(source, match.index)
      violations.push(`${relative}:${line} uses ${match[0]}`)
    }
  }

  if (violations.length > 0) {
    console.error('Env guard failed:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    Deno.exit(1)
  }
}

await main()
