/**
 * Guard against namespace imports across the source tree.
 */

import { walk } from '@std/walk'
import { guardFail, guardPass } from '@devops/guards/guard-utils.ts'

const ROOT = Deno.cwd().replaceAll('\\', '/')
const SOURCE_DIR = `${ROOT}/source`
const ALLOWED: string[] = []
const NAMESPACE_IMPORT_REGEX = /import\s+\*\s+as\s+\w+\s+from\s+['"]([^'"]+)['"]/g

const main = async () => {
  const violations: string[] = []

  for await (
    const entry of walk(SOURCE_DIR, {
      includeDirs: false,
      exts: ['.ts', '.tsx'],
      skip: [/[/\\]dist[/\\]?/, /[/\\]node_modules[/\\]?/]
    })
  ) {
    const file = entry.path.replaceAll('\\', '/')
    const relative = file.replace(`${ROOT}/`, '')
    const source = await Deno.readTextFile(file)

    NAMESPACE_IMPORT_REGEX.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = NAMESPACE_IMPORT_REGEX.exec(source)) !== null) {
      const specifier = match[1]
      if (ALLOWED.includes(specifier)) continue
      violations.push(`${relative} -> namespace import: ${specifier}`)
    }
  }

  if (violations.length > 0) guardFail('Namespace import', violations)

  guardPass('Namespace import')
}

await main()
