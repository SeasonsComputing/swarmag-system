/**
 * Guard state module runtime dependencies and premature access to SessionState.user.
 * Enforces that any component or hook accessing the user object must also
 * reference the isDataReady flag to handle the hydration gap.
 */

import { StringSet } from '@core/std'
import { guardFail, guardPass } from '@devops/guards/guard-utils.ts'

const ROOT = Deno.cwd().replaceAll('\\', '/')
const TARGET_DIRS = [
  `${ROOT}/source/front/app-admin`,
  `${ROOT}/source/front/app-ops`,
  `${ROOT}/source/front/app-customer`
]

const STATE_DIRS = [`${ROOT}/source/front`, `${ROOT}/source/ux`]

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

// Follow local runtime imports and exports; type-only dependencies do not load JSX.
const runtimeDependencies = (source: string, file: string): string[] => {
  const pattern = /\b(?:import|export)\s+(?!type\b)(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/g
  const dynamicPattern = /\bimport\s*\(\s*['"]([^'"]+)['"]/g
  const matches = [...source.matchAll(pattern), ...source.matchAll(dynamicPattern)]
  return matches.flatMap(match => {
    const specifier = match[1]
    if (specifier === '@ux/ui') return [`${ROOT}/source/ux/ui/components/ui.ts`]
    if (specifier === '@ux/css') return [`${ROOT}/source/ux/ui/css/css.tsx`]
    if (specifier === '@core/std') return [`${ROOT}/source/core/std/std.ts`]
    if (specifier === '@core/stdx') return [`${ROOT}/source/core/std/stdx.ts`]
    if (/^@(front|ux|domain|core)\//.test(specifier)) {
      return [`${ROOT}/source/${specifier.slice(1)}`]
    }
    if (specifier.startsWith('.')) return [new URL(specifier, `file://${file}`).pathname]
    return []
  })
}

const findJsxDependency = async (
  file: string,
  visited: StringSet = new StringSet()
): Promise<string | null> => {
  if (file.endsWith('.tsx')) return file
  if (visited.has(file)) return null
  visited.add(file)
  const source = await Deno.readTextFile(file)
  for (const dependency of runtimeDependencies(source, file)) {
    const jsx = await findJsxDependency(dependency, visited)
    if (jsx) return jsx
  }
  return null
}

const main = async () => {
  const files = (await Promise.all(TARGET_DIRS.map(collectFiles))).flat()
  const violations: string[] = []

  const stateFiles = (await Promise.all(STATE_DIRS.map(collectFiles))).flat()
    .filter(file => /-(state|store)\.ts$/.test(file))
  for (const file of stateFiles) {
    const jsx = await findJsxDependency(file)
    if (jsx) {
      violations.push(
        `${file.replace(`${ROOT}/`, '')} - State runtime dependency loads ${
          jsx.replace(`${ROOT}/`, '')
        }.`
      )
    }
  }

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
      'Rules: State runtime dependencies must not load JSX; guard User access with isDataReady.'
    )
  }

  guardPass('UX state')
}

await main()
