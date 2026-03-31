/**
 * Guard against premature access to SessionState.user.
 * Enforces that any component or hook accessing the user object must also
 * reference the isDataReady flag to handle the hydration gap.
 */

const ROOT = Deno.cwd().replaceAll('\\', '/')
const TARGET_DIRS = [
  `${ROOT}/source/ux/app-admin`,
  `${ROOT}/source/ux/app-ops`,
  `${ROOT}/source/ux/app-customer`
]

const EXCLUDED_DIRS = new Set(['dist', 'node_modules'])

// Violation: Accessing properties on the user object
const USER_ACCESS_PATTERN = /SessionState\.store\.user\./g

// Safety signals: These indicate the developer is aware of the hydration state
const SAFETY_PATTERNS = [
  /\.isDataReady/,
  /<AuthGuard/,
  /if\s*\(!?SessionState\.store\.user\)/,
  /SessionState\.store\.user\s*\?\./ // Optional chaining as a secondary safety
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

const lineNumber = (source: string, index: number): number => source.slice(0, index).split('\n').length

const main = async () => {
  const files = (await Promise.all(TARGET_DIRS.map(collectFiles))).flat()
  const violations: string[] = []

  for (const file of files) {
    const source = await Deno.readTextFile(file)
    const relative = file.replace(`${ROOT}/`, '')

    let match: RegExpExecArray | null
    while ((match = USER_ACCESS_PATTERN.exec(source)) !== null) {
      if (!SAFETY_PATTERNS.some(pattern => pattern.test(source))) {
        const line = lineNumber(source, match.index)
        violations.push(
          `${relative}:${line} - Accesses SessionState.store.user without referencing isDataReady or AuthGuard.`
        )
        break // One violation per file is enough to fail the audit
      }
    }
  }

  if (violations.length > 0) {
    console.error('UX State guard failed:')
    console.error('')
    for (const v of violations) console.error(`  ${v}`)
    console.error('')
    console.error('Rule: You must guard User access with isDataReady to prevent hydration-gap crashes.')
    Deno.exit(1)
  }
}

await main()
