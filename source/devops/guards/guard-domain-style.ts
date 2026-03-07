/**
 * Guard against style-guide/header drift and const-enum violations in domain files.
 *
 * Scope:
 * - Ensures domain ts files use functional-file style header sections
 * - Enforces EXPORTED APIs & TYPEs entries to be single-line symbol+description
 * - Enforces const-enum tuple/type adjacency in abstraction source-of-truth files
 * - Disallows inline multi-literal unions in abstraction files when const-enum is required
 */

const ROOT = Deno.cwd().replaceAll('\\', '/')
const DOMAIN_DIR = `${ROOT}/source/domain`
const DOMAIN_ABSTRACTIONS_DIR = `${DOMAIN_DIR}/abstractions`
const EXCLUDED_DIRS = new Set(['schema'])

const SECTION_BLOCK_REGEX = /^\/\*([\s\S]*?)\*\//m
const PURPOSE_REGEX = /\nPURPOSE\n─+\n/
const EXPORTED_REGEX = /\nEXPORTED APIs & TYPEs\n─+\n([\s\S]*?)\n\*\//m
const CONST_ENUM_DECLARATION_REGEX = /export const ([A-Z0-9_]+)\s*=\s*\[[\s\S]*?\]\s*as const/gm
const INLINE_LITERAL_UNION_REGEX = /:\s*'[^']+'\s*\|\s*'[^']+'/g
const INLINE_LITERAL_UNION_TYPE_ALIAS_REGEX = /export type [A-Za-z0-9_]+\s*=\s*'[^']+'\s*\|\s*'[^']+'/g

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

const lineNumber = (source: string, index: number): number => source.slice(0, index).split('\n').length

const checkConstEnumPair = (source: string, constantName: string, constEndIndex: number): boolean => {
  const suffix = source.slice(constEndIndex)
  const pairPattern = new RegExp(
    `^\\nexport type [A-Za-z0-9_]+\\s*=\\s*\\(typeof ${constantName}\\)\\[number\\]`,
    'm'
  )
  return pairPattern.test(suffix)
}

const auditAbstractionConstEnums = (source: string, relative: string): string[] => {
  const violations: string[] = []

  CONST_ENUM_DECLARATION_REGEX.lastIndex = 0
  let tupleMatch: RegExpExecArray | null
  while ((tupleMatch = CONST_ENUM_DECLARATION_REGEX.exec(source)) !== null) {
    const tupleName = tupleMatch[1]
    const tupleEndIndex = tupleMatch.index + tupleMatch[0].length
    if (!checkConstEnumPair(source, tupleName, tupleEndIndex)) {
      const lineNo = lineNumber(source, tupleMatch.index)
      violations
        .push(`${relative}:${lineNo} const-enum tuple ${tupleName} must be immediately followed by derived type alias with no blank line`)
    }
  }

  INLINE_LITERAL_UNION_REGEX.lastIndex = 0
  let unionMatch: RegExpExecArray | null
  while ((unionMatch = INLINE_LITERAL_UNION_REGEX.exec(source)) !== null) {
    const lineNo = lineNumber(source, unionMatch.index)
    violations
      .push(`${relative}:${lineNo} inline multi-literal union detected; use const-enum tuple + derived type alias`)
  }

  INLINE_LITERAL_UNION_TYPE_ALIAS_REGEX.lastIndex = 0
  while ((unionMatch = INLINE_LITERAL_UNION_TYPE_ALIAS_REGEX.exec(source)) !== null) {
    const lineNo = lineNumber(source, unionMatch.index)
    violations
      .push(`${relative}:${lineNo} type alias uses inline multi-literal union; use const-enum tuple + derived type alias`)
  }

  return violations
}

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
        const lineNo = lineNumber(
          source,
          exportedBodyStart + exportedBody
            .split('\n')
            .slice(0, i)
            .join('\n').length
            + (i > 0 ? 1 : 0)
        )
        violations
          .push(`${relative}:${lineNo} EXPORTED APIs & TYPEs entry uses continuation line; keep symbol and description on one line`)
        continue
      }

      if (!/\S\s{2,}\S/.test(line)) {
        const lineNo = lineNumber(
          source,
          exportedBodyStart + exportedBody
            .split('\n')
            .slice(0, i)
            .join('\n').length
            + (i > 0 ? 1 : 0)
        )
        violations
          .push(`${relative}:${lineNo} EXPORTED APIs & TYPEs entry must contain symbol and description on the same line`)
      }
    }

    if (file.startsWith(DOMAIN_ABSTRACTIONS_DIR)) {
      violations.push(...auditAbstractionConstEnums(source, relative))
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
