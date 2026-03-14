/**
 * Guard against style-guide/header drift and const-enum violations in domain files.
 *
 * Scope:
 * - Ensures domain ts files use functional-file style header sections
 * - Enforces PUBLIC entries to be single-line symbol+description
 * - Enforces const-enum tuple/type adjacency in abstraction source-of-truth files
 * - Disallows inline multi-literal unions in abstraction files when const-enum is required
 */

const ROOT = Deno.cwd().replaceAll('\\', '/')
const DOMAIN_DIR = `${ROOT}/source/domain`
const DOMAIN_ABSTRACTIONS_DIR = `${DOMAIN_DIR}/abstractions`
const EXCLUDED_DIRS = new Set(['schema'])

const SECTION_BLOCK_REGEX = /^\/\*([\s\S]*?)\*\//m
const CONST_ENUM_DECLARATION_REGEX =
  /export const ([A-Z0-9_]+)\s*=\s*\[[\s\S]*?\]\s*as const/gm
const INLINE_LITERAL_UNION_REGEX = /:\s*'[^']+'\s*\|\s*'[^']+'/g
const INLINE_LITERAL_UNION_TYPE_ALIAS_REGEX =
  /export type [A-Za-z0-9_]+\s*=\s*'[^']+'\s*\|\s*'[^']+'/g

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

const lineOffset = (lines: string[], lineIndex: number): number =>
  lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0)

const isDashRule = (line: string): boolean => /^─+$/.test(line.trim())

const auditHeaderStyleGuide63 = (
  source: string,
  relative: string,
  headerText: string,
  headerStartIndex: number
): string[] => {
  const violations: string[] = []
  const lines = headerText.split('\n')
  const headerStartLine = lineNumber(source, headerStartIndex)

  const boxTop = lines.findIndex(line => line.trim().startsWith('╔'))
  const boxBottom = lines.findIndex(line => line.trim().startsWith('╚'))
  if (boxTop === -1 || boxBottom === -1 || boxBottom <= boxTop) {
    violations.push(
      `${relative}:${headerStartLine} header box is missing aligned top/bottom borders`
    )
  } else {
    const top = lines[boxTop]
    const bottom = lines[boxBottom]
    if (!/^╔═+╗$/.test(top.trim())) {
      violations.push(
        `${relative}:${headerStartLine + boxTop} header top border must be ╔═...═╗`
      )
    }
    if (!/^╚═+╝$/.test(bottom.trim())) {
      violations.push(
        `${relative}:${headerStartLine + boxBottom} header bottom border must be ╚═...═╝`
      )
    }
    if (top.length !== bottom.length) {
      violations.push(
        `${relative}:${
          headerStartLine + boxBottom
        } header top and bottom borders must have equal length`
      )
    }

    for (let i = boxTop + 1; i < boxBottom; i++) {
      const line = lines[i]
      if (line.trim().length === 0) continue
      if (!line.startsWith('║') || !line.endsWith('║')) {
        violations.push(
          `${relative}:${
            headerStartLine + i
          } header body rows must be wrapped with matching ║ side borders`
        )
        continue
      }
      if (line.length !== top.length) {
        violations.push(
          `${relative}:${
            headerStartLine + i
          } header box side alignment mismatch with top border width`
        )
      }
    }
  }

  const sections = ['PURPOSE', 'PUBLIC']
  for (const section of sections) {
    const sectionLine = lines.findIndex(line => line.trim() === section)
    if (sectionLine === -1) {
      const caseInsensitiveLine = lines.findIndex(
        line => line.trim().toUpperCase() === section
      )
      if (caseInsensitiveLine !== -1) {
        violations.push(
          `${relative}:${
            headerStartLine + caseInsensitiveLine
          } subsection heading must be ALL CAPS: ${section}`
        )
      } else {
        violations.push(
          `${relative}:${headerStartLine} header is missing ${section} subsection`
        )
      }
      continue
    }

    if (sectionLine === 0 || lines[sectionLine - 1].trim() !== '') {
      violations.push(
        `${relative}:${
          headerStartLine + sectionLine
        } ${section} must have exactly one blank line prior`
      )
    }

    const ruleLine = sectionLine + 1
    if (ruleLine >= lines.length || !isDashRule(lines[ruleLine])) {
      violations.push(
        `${relative}:${
          headerStartLine + sectionLine
        } ${section} must be followed by a dash-rule line`
      )
    }
  }

  return violations
}

const getPublicBody = (headerText: string): { body: string; startLine: number } | null => {
  const lines = headerText.split('\n')
  const sectionLine = lines.findIndex(line => line.trim() === 'PUBLIC')
  if (sectionLine === -1) return null
  const ruleLine = sectionLine + 1
  if (ruleLine >= lines.length || !isDashRule(lines[ruleLine])) return null
  const bodyLines = lines.slice(ruleLine + 1)
  return { body: bodyLines.join('\n'), startLine: ruleLine + 1 }
}

const checkConstEnumPair = (
  source: string,
  constantName: string,
  constEndIndex: number
): boolean => {
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
      violations.push(
        `${relative}:${lineNo} const-enum tuple ${tupleName} must be immediately followed by derived type alias with no blank line`
      )
    }
  }

  INLINE_LITERAL_UNION_REGEX.lastIndex = 0
  let unionMatch: RegExpExecArray | null
  while ((unionMatch = INLINE_LITERAL_UNION_REGEX.exec(source)) !== null) {
    const lineNo = lineNumber(source, unionMatch.index)
    violations.push(
      `${relative}:${lineNo} inline multi-literal union detected; use const-enum tuple + derived type alias`
    )
  }

  INLINE_LITERAL_UNION_TYPE_ALIAS_REGEX.lastIndex = 0
  while ((unionMatch = INLINE_LITERAL_UNION_TYPE_ALIAS_REGEX.exec(source)) !== null) {
    const lineNo = lineNumber(source, unionMatch.index)
    violations.push(
      `${relative}:${lineNo} type alias uses inline multi-literal union; use const-enum tuple + derived type alias`
    )
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

    const headerText = headerMatch[1]
    violations.push(
      ...auditHeaderStyleGuide63(source, relative, headerText, headerMatch.index)
    )

    const publicBody = getPublicBody(headerText)
    if (!publicBody) {
      violations.push(`${relative} is missing PUBLIC section in header`)
      continue
    }

    const exportedBody = publicBody.body
    const headerLines = headerText.split('\n')
    const headerOffset = lineOffset(headerLines, publicBody.startLine)
    const exportedBodyStart = headerMatch.index + 2 + headerOffset
    const lines = exportedBody.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      if (trimmed.length === 0) continue

      if (/^\s{2,}\S/.test(line)) {
        const lineNo = lineNumber(
          source,
          exportedBodyStart + exportedBody.split('\n').slice(0, i).join('\n').length
            + (i > 0 ? 1 : 0)
        )
        violations.push(
          `${relative}:${lineNo} PUBLIC entry uses continuation line; keep symbol and description on one line`
        )
        continue
      }

      if (!/\S\s{2,}\S/.test(line)) {
        const lineNo = lineNumber(
          source,
          exportedBodyStart + exportedBody.split('\n').slice(0, i).join('\n').length
            + (i > 0 ? 1 : 0)
        )
        violations.push(
          `${relative}:${lineNo} PUBLIC entry must contain symbol and description on the same line`
        )
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
