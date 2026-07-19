/**
 * Guard against premature access to SessionState.user.
 * Enforces that any component or hook accessing the user object must also
 * reference the isDataReady flag to handle the hydration gap.
 */

import { guardFail, guardPass } from '@devops/guards/guard-utils.ts'

const ROOT = Deno.cwd().replaceAll('\\', '/')
const TARGET_DIRS = [
  `${ROOT}/source/front/app-admin`,
  `${ROOT}/source/front/app-ops`,
  `${ROOT}/source/front/app-customer`
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
    guardFail(
      'UX state',
      violations,
      'Rule: You must guard User access with isDataReady to prevent hydration-gap crashes.'
    )
  }

  guardPass('UX state')
}

await main()
