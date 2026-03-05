/**
 * Guard against style-guide/header drift in source/domain TypeScript files.
 *
 * Scope:
 * - Ensures domain ts files use functional-file style header sections
 * - Enforces EXPORTED APIs & TYPEs entries to be single-line symbol+description
 */

const ROOT = Deno.cwd().replaceAll('\\', '/')
const DOMAIN_DIR = `${ROOT}/source/domain`
const EXCLUDED_DIRS = new Set(['schema'])

const SECTION_BLOCK_REGEX = /^\/\*([\s\S]*?)\*\//m
const PURPOSE_REGEX = /\nPURPOSE\n─+\n/
const EXPORTED_REGEX = /\nEXPORTED APIs & TYPEs\n─+\n([\s\S]*?)\n\*\//m

const collectFiles = async (dir: string): Promise<string[]> => {
  const entries: string[] = []
  for await (const entry of Deno.readDir(dir)) {
    const entryPath = `${dir}/${entry.name}`
    if (entry.isDirectory) {
      if (EXCLUDED_DIRS.has(entry.name)) continue
      entries.push(...await collectFiles(entryPath))
    } else if (entry.isFile && entry.name.endsWith('.ts')) {
      entries.push(entryPath)
    }
  }
  return entries
}

const lineNumber = (source: string, index: number): number =>
  source.slice(0, index).split('\n').length

const main = async () => {
  const violations: string[] = []
  const files = await collectFiles(DOMAIN_DIR)

  for (const file of files) {
    const relative = file.replace(`${ROOT}/`, '')
    const source = await Deno.readTextFile(file)

    const headerMatch = SECTION_BLOCK_REGEX.exec(source)
    if (!headerMatch) {
      violations.push(`${relative} is missing top functional-file header block comment`)
      continue
    }

    if (!PURPOSE_REGEX.test(source)) {
      violations.push(`${relative} is missing PURPOSE section in header`)
    }

    const exportedMatch = EXPORTED_REGEX.exec(source)
    if (!exportedMatch) {
      violations.push(`${relative} is missing EXPORTED APIs & TYPEs section in header`)
      continue
    }

    const exportedBody = exportedMatch[1]
    const exportedBodyStart = exportedMatch.index + exportedMatch[0].indexOf(exportedBody)
    const lines = exportedBody.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      if (trimmed.length === 0) continue

      if (/^\s{2,}\S/.test(line)) {
        const lineNo = lineNumber(source, exportedBodyStart + exportedBody
          .split('\n')
          .slice(0, i)
          .join('\n').length + (i > 0 ? 1 : 0))
        violations.push(
          `${relative}:${lineNo} EXPORTED APIs & TYPEs entry uses continuation line; keep symbol and description on one line`
        )
        continue
      }

      if (!/\S\s{2,}\S/.test(line)) {
        const lineNo = lineNumber(source, exportedBodyStart + exportedBody
          .split('\n')
          .slice(0, i)
          .join('\n').length + (i > 0 ? 1 : 0))
        violations.push(
          `${relative}:${lineNo} EXPORTED APIs & TYPEs entry must contain symbol and description on the same line`
        )
      }
    }
  }

  if (violations.length > 0) {
    console.error('Domain style guard failed:')
    for (const violation of violations) {
      console.error(`- ${violation}`)
    }
    Deno.exit(1)
  }

  console.log('✓ Domain style guard passed')
}

await main()
