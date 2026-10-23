/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Namespace import guard                                                       ║
║ Reject namespace imports outside the existing allowlist.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Guard against namespace imports across the source tree.
*/

import { guardFail, guardPass } from '@devops/guards/guard-utils.ts'
import { walk } from '@std/walk'

const ROOT = Deno.cwd().replaceAll('\\', '/')
const SOURCE_DIR = `${ROOT}/source`
const ALLOWED: string[] = []
const NamespaceImportRegex = /import\s+\*\s+as\s+\w+\s+from\s+['"]([^'"]+)['"]/g

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

    NamespaceImportRegex.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = NamespaceImportRegex.exec(source)) !== null) {
      const specifier = match[1]
      if (ALLOWED.includes(specifier)) continue
      violations.push(`${relative} -> namespace import: ${specifier}`)
    }
  }

  if (violations.length > 0) guardFail('Namespace import', violations)

  guardPass('Namespace import')
}

await main()
