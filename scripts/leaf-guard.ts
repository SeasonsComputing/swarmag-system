/**
 * Guard against files living in non-leaf directories.
 */

/** Absolute path to the repo root. */
const ROOT = Deno.cwd().replaceAll('\\', '/')

/** Directories to scan for leaf-only files. */
const TARGET_DIRS = [
  `${ROOT}/source`,
  `${ROOT}/docs`,
  `${ROOT}/scripts`
]

/** Directory names to skip during traversal. */
const EXCLUDED_DIRS = new Set(['dist', 'node_modules'])

/** Collect violations for files in non-leaf directories. */
const collectViolations = async (dir: string): Promise<string[]> => {
  const violations: string[] = []
  let hasSubdirs = false
  const files: string[] = []

  for await (const entry of Deno.readDir(dir)) {
    const entryPath = `${dir}/${entry.name}`
    if (entry.isDirectory) {
      if (EXCLUDED_DIRS.has(entry.name)) continue
      hasSubdirs = true
      violations.push(...await collectViolations(entryPath))
    } else if (entry.isFile) {
      files.push(entryPath)
    }
  }

  if (hasSubdirs && files.length > 0) {
    for (const file of files) {
      const relative = file.replace(`${ROOT}/`, '')
      violations.push(`${relative} lives in a non-leaf directory`)
    }
  }

  return violations
}

const main = async () => {
  const violations = (await Promise.all(TARGET_DIRS.map(collectViolations))).flat()

  if (violations.length > 0) {
    console.error('Leaf guard failed:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    Deno.exit(1)
  }
}

await main()
