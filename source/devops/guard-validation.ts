/**
 * Guard against re-implementing domain invariants outside the domain layer.
 */

const ROOT = Deno.cwd().replaceAll('\\', '/')

const TARGET_DIRS = [
  `${ROOT}/source/back/supabase-edge/functions`,
  `${ROOT}/source/ux/app-admin`,
  `${ROOT}/source/ux/app-ops`,
  `${ROOT}/source/ux/app-customer`
]

const EXCLUDED_DIRS = new Set(['dist', 'node_modules'])

const VALIDATE_DECLARATION = /\b(function|const|let)\s+validate[A-Za-z0-9_]*\b/g

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
    const source = await Deno.readTextFile(file)
    let match: RegExpExecArray | null
    while ((match = VALIDATE_DECLARATION.exec(source)) !== null) {
      const line = lineNumber(source, match.index)
      const relative = file.replace(`${ROOT}/`, '')
      violations.push(`${relative}:${line} declares ${match[0]}`)
    }
  }

  if (violations.length > 0) {
    console.error('Validation guard failed:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    Deno.exit(1)
  }
}

await main()
