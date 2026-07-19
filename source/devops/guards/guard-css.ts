import { StringSet } from '@core/std'
import { guardFail, guardPass } from '@devops/guards/guard-utils.ts'
import { walk } from '@std/walk'

const ROOT = Deno.cwd().replaceAll('\\', '/')
const COMMON_DIR = `${ROOT}/source/front/ux`
const CSS_DIR = `${ROOT}/source/front/ux/ui/css`
const APP_DIRS = [
  `${ROOT}/source/front/app-admin`,
  `${ROOT}/source/front/app-customer`,
  `${ROOT}/source/front/app-ops`,
  `${ROOT}/source/front/app-style-guide`
]

const CSS_FILES = ['tokens.css', 'roles.css', 'themes.css', 'base.css', 'ui.css']
const TOKEN_ONLY_FILES = new StringSet(['tokens.css', 'roles.css', 'themes.css'])

const SELECTOR_REGEX = /^([^/{\n]*)\{/
const DATA_ATTRIBUTE_REGEX = /\[(data-[a-zA-Z0-9_-]+)(?:=(['"]?)([^'"\]\s]+)\2)?\]/g
const TOKEN_DECLARATION_REGEX = /^\s*(--sa-[^:]+)\s*:/
const COMMENT_LINE_REGEX = /^\s*\/\//
const BLOCK_COMMENT_START = /\/\*/
const BLOCK_COMMENT_END = /\*\//

const IMMUTABLE_TOKEN_NAMES = new StringSet([
  '--sa-base-size'
])

const IMMUTABLE_TOKEN_PREFIXES = [
  '--sa-filter-',
  '--sa-font-size-',
  '--sa-font-weight-',
  '--sa-line-',
  '--sa-motion-',
  '--sa-radius-',
  '--sa-rhythm-',
  '--sa-size-',
  '--sa-space-',
  '--sa-touch-',
  '--sa-transition-',
  '--sa-z-'
]

const ALLOWED_DATA_ATTRIBUTES = new StringSet([
  'data-ui',
  'data-ui-align',
  'data-ui-decoration',
  'data-ui-drag',
  'data-ui-elevation',
  'data-ui-gap',
  'data-ui-icon',
  'data-ui-layout',
  'data-ui-overflow',
  'data-ui-state',
  'data-ui-variant',
  'data-checked',
  'data-disabled',
  'data-expanded',
  'data-highlighted',
  'data-placeholder-shown',
  'data-pressed',
  'data-selected'
])

const DATA_ATTRIBUTE_VALUE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FEATURE_ATTRIBUTE_REGEX = /^data-feat(?:-[a-z0-9]+)*$/

interface CSSLine {
  line: string
  lineNumber: number
  isComment: boolean
}

const parseLines = (content: string): CSSLine[] => {
  const lines = content.split('\n')
  const result: CSSLine[] = []
  let inBlockComment = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isCommentLine = COMMENT_LINE_REGEX.test(line)
    let isCommentBlock = false

    if (BLOCK_COMMENT_START.test(line)) {
      inBlockComment = true
      isCommentBlock = true
    }
    if (BLOCK_COMMENT_END.test(line)) {
      inBlockComment = false
      isCommentBlock = true
    }

    result.push({
      line,
      lineNumber: i + 1,
      isComment: isCommentLine || inBlockComment || isCommentBlock
    })
  }

  return result
}

const extractSelector = (line: string): string | null => {
  const match = line.match(SELECTOR_REGEX)
  return match ? match[1].trim() : null
}

const isAtRule = (selector: string): boolean => selector.startsWith('@')

const isImmutableToken = (name: string): boolean =>
  IMMUTABLE_TOKEN_NAMES.has(name)
  || IMMUTABLE_TOKEN_PREFIXES.some(prefix => name.startsWith(prefix))

const auditTokenDeclarations = (
  lines: CSSLine[],
  filePath: string,
  fileName: string
): string[] => {
  const violations: string[] = []

  for (const { line, lineNumber, isComment } of lines) {
    if (isComment) continue

    const match = line.match(TOKEN_DECLARATION_REGEX)
    if (!match) continue

    const name = match[1]

    if (name.startsWith('--sa-p-')) {
      violations.push(
        `${filePath}:${lineNumber} — legacy token prefix — ${name}`
      )
    }

    if (
      name.startsWith('--sa-lch-')
      && fileName !== 'roles.css'
      && fileName !== 'themes.css'
    ) {
      violations.push(
        `${filePath}:${lineNumber} — lch token declared outside roles.css/themes.css — ${name}`
      )
    }

    if (fileName === 'tokens.css' && !isImmutableToken(name)) {
      violations.push(
        `${filePath}:${lineNumber} — mutable token declared in tokens.css — ${name}`
      )
    }

    if (fileName !== 'tokens.css' && isImmutableToken(name)) {
      violations.push(
        `${filePath}:${lineNumber} — immutable token redeclared outside tokens.css — ${name}`
      )
    }
  }

  return violations
}

const auditTokenOnlyDeclarations = (
  lines: CSSLine[],
  filePath: string
): string[] => {
  const violations: string[] = []

  for (const { line, lineNumber, isComment } of lines) {
    if (isComment) continue

    const trimmed = line.trim()
    if (
      trimmed === ''
      || trimmed === '}'
      || trimmed.startsWith('@')
      || trimmed.endsWith('{')
      || !trimmed.includes(':')
    ) {
      continue
    }

    if (!trimmed.startsWith('--sa-')) {
      violations.push(
        `${filePath}:${lineNumber} — non-token declaration in token-only file — ${trimmed}`
      )
    }
  }

  return violations
}

const auditTokensCSS = (
  lines: CSSLine[],
  filePath: string,
  allowRoot: boolean,
  allowThemeSelectors: boolean
): string[] => {
  const violations: string[] = []

  for (const { line, lineNumber, isComment } of lines) {
    if (isComment || !line.includes('{')) continue

    const selector = extractSelector(line)
    if (!selector) continue

    if (isAtRule(selector)) continue

    if (!allowRoot && selector === ':root') {
      violations.push(
        `${filePath}:${lineNumber} — forbidden root selector — found: ${selector}`
      )
      continue
    }

    if (
      !allowThemeSelectors
      && (selector === '[data-theme]' || selector.startsWith('[data-theme='))
    ) {
      violations.push(
        `${filePath}:${lineNumber} — forbidden theme selector — found: ${selector}`
      )
      continue
    }

    if (selector !== ':root' && selector !== '[data-theme]' && !selector.startsWith('[data-theme=')) {
      violations.push(
        `${filePath}:${lineNumber} — forbidden selector — found: ${selector}`
      )
    }
  }

  return violations
}

const auditBaseCSS = (lines: CSSLine[], filePath: string): string[] => {
  const violations: string[] = []

  for (const { line, lineNumber, isComment } of lines) {
    if (isComment || !line.includes('{')) continue

    const selector = extractSelector(line)
    if (!selector) continue

    if (isAtRule(selector)) continue

    if (selector.includes('[')) {
      violations.push(
        `${filePath}:${lineNumber} — attribute selector in base.css — found: ${selector}`
      )
    }
  }

  return violations
}

const auditControlsCSS = (lines: CSSLine[], filePath: string): string[] => {
  const violations: string[] = []

  for (const { line, lineNumber, isComment } of lines) {
    if (isComment || !line.includes('{')) continue

    const selector = extractSelector(line)
    if (!selector) continue

    if (isAtRule(selector)) continue

    if (!selector.startsWith('[data-ui')) {
      violations.push(
        `${filePath}:${lineNumber} — selector not rooted at [data-ui — found: ${selector}`
      )
    }
  }

  return violations
}

const auditFeatureCSS = (lines: CSSLine[], filePath: string): string[] => {
  const violations: string[] = []

  for (const { line, lineNumber, isComment } of lines) {
    if (isComment || !line.includes('{')) continue

    const selector = extractSelector(line)
    if (!selector) continue

    if (isAtRule(selector)) continue

    if (!selector.startsWith('[data-feat')) {
      violations.push(
        `${filePath}:${lineNumber} — selector not rooted at [data-feat — found: ${selector}`
      )
    }

    DATA_ATTRIBUTE_REGEX.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = DATA_ATTRIBUTE_REGEX.exec(selector)) !== null) {
      const attribute = match[1]
      const value = match[3]

      if (!ALLOWED_DATA_ATTRIBUTES.has(attribute) && !FEATURE_ATTRIBUTE_REGEX.test(attribute)) {
        violations.push(
          `${filePath}:${lineNumber} — forbidden data attribute selector — found: ${attribute}`
        )
      }

      if (
        value
        && (
          attribute === 'data-ui'
          || attribute.startsWith('data-ui-')
          || attribute === 'data-feat'
          || attribute.startsWith('data-feat-')
        )
        && !DATA_ATTRIBUTE_VALUE_REGEX.test(value)
      ) {
        violations.push(
          `${filePath}:${lineNumber} — data attribute value not kebab-case — ${attribute}='${value}'`
        )
      }
    }
  }

  return violations
}

const isInFontFaceBlock = (lines: CSSLine[], currentIndex: number): boolean => {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const line = lines[i].line.trim()
    if (line.includes('@font-face')) return true
    if (line.includes('}') && !lines[i].isComment) break
  }
  return false
}

const auditValueRules = (
  lines: CSSLine[],
  filePath: string,
  skipTokensFile: boolean
): string[] => {
  const violations: string[] = []

  const exemptProps = new Set([
    'width',
    'height',
    'flex',
    'grid',
    'display',
    'position',
    'overflow',
    'align',
    'justify',
    'gap',
    'min-width',
    'max-width',
    'min-height',
    'max-height'
  ])

  for (let i = 0; i < lines.length; i++) {
    const { line, lineNumber, isComment } = lines[i]
    if (isComment) continue

    if (isInFontFaceBlock(lines, i)) continue

    const trimmed = line.trim()
    if (!trimmed.includes(':') || trimmed.startsWith('@')) continue

    const colonIdx = trimmed.indexOf(':')
    const propPart = trimmed.substring(0, colonIdx).trim()
    const valuePart = trimmed.substring(colonIdx + 1).trim()

    const isExempt = Array.from(exemptProps).some(
      prop => propPart === prop || propPart.startsWith(prop + '-')
    )
    if (isExempt) continue

    // Skip value rules for token-only files.
    if (skipTokensFile) continue

    // B1: LCH tuple token ref (skip in token-only files)
    if (valuePart.includes('var(--sa-lch-')) {
      violations.push(
        `${filePath}:${lineNumber} — lch token ref outside token layer — ${valuePart}`
      )
    }

    // B2: raw oklch() (skip in token-only files)
    if (valuePart.includes('oklch(')) {
      violations.push(
        `${filePath}:${lineNumber} — raw oklch() value — ${valuePart}`
      )
    }

    // B3: font-family
    if (propPart === 'font-family') {
      if (!valuePart.startsWith('var(')) {
        violations.push(
          `${filePath}:${lineNumber} — font-family literal — ${valuePart}`
        )
      }
    }

    // B4: font-size
    if (propPart === 'font-size') {
      if (/\d+\.?\d*(?:rem|px|em)/.test(valuePart)) {
        violations.push(
          `${filePath}:${lineNumber} — font-size literal — ${valuePart}`
        )
      }
    }

    // B5: font-weight
    if (propPart === 'font-weight') {
      if (/^\d+/.test(valuePart)) {
        violations.push(
          `${filePath}:${lineNumber} — font-weight numeric literal — ${valuePart}`
        )
      }
    }

    // B6: line-height
    if (propPart === 'line-height') {
      if (/\d+\.?\d*(?:rem|px|em)/.test(valuePart)) {
        violations.push(
          `${filePath}:${lineNumber} — line-height literal — ${valuePart}`
        )
      }
    }

    // B7: padding/margin
    if (propPart.startsWith('padding') || propPart.startsWith('margin')) {
      if (
        /\d+\.?\d*(?:rem|px|em)/.test(valuePart) && !valuePart.startsWith('var(')
      ) {
        violations.push(
          `${filePath}:${lineNumber} — spacing literal — ${valuePart}`
        )
      }
    }

    // B8: border-radius
    if (propPart.startsWith('border-radius')) {
      if (
        /\d+\.?\d*(?:rem|px|em)/.test(valuePart) && !valuePart.startsWith('var(')
      ) {
        violations.push(
          `${filePath}:${lineNumber} — border-radius literal — ${valuePart}`
        )
      }
    }

    // B9: box-shadow
    if (propPart === 'box-shadow') {
      const isKeyword = /^(?:none|unset|initial|inherit)/.test(valuePart)
      if (!valuePart.startsWith('var(') && !isKeyword) {
        violations.push(
          `${filePath}:${lineNumber} — raw box-shadow — ${valuePart}`
        )
      }
    }

    // B10: transition
    if (propPart === 'transition') {
      const isKeyword = /^(?:none|unset|initial|inherit)/.test(valuePart)
      if (!valuePart.startsWith('var(') && !isKeyword) {
        violations.push(
          `${filePath}:${lineNumber} — raw transition — ${valuePart}`
        )
      }
    }

    // B11: z-index
    if (propPart === 'z-index') {
      if (/^-?\d+/.test(valuePart)) {
        violations.push(
          `${filePath}:${lineNumber} — raw z-index number — ${valuePart}`
        )
      }
    }

    // B12: backdrop-filter
    if (propPart === 'backdrop-filter') {
      const isKeyword = /^(?:none|unset|initial|inherit)/.test(valuePart)
      if (!valuePart.startsWith('var(') && !isKeyword) {
        violations.push(
          `${filePath}:${lineNumber} — raw backdrop-filter — ${valuePart}`
        )
      }
    }

    // B13: border shorthand
    const isBorderShorthand = propPart === 'border'
      || propPart.startsWith('border-')
        && (propPart === 'border-top' || propPart === 'border-right'
          || propPart === 'border-bottom' || propPart === 'border-left'
          || propPart === 'border-block' || propPart === 'border-inline'
          || propPart === 'border-block-start'
          || propPart === 'border-block-end'
          || propPart === 'border-inline-start'
          || propPart === 'border-inline-end')

    if (isBorderShorthand) {
      const isKeyword = /^(?:none|unset|initial|inherit)/.test(valuePart)
      if (!valuePart.startsWith('var(') && !isKeyword) {
        violations.push(
          `${filePath}:${lineNumber} — raw border shorthand — ${valuePart}`
        )
      }
    }
  }

  return violations
}

const main = async () => {
  const violations: string[] = []
  const designSystemFiles = new StringSet()

  for (const fileName of CSS_FILES) {
    const filePath = `${CSS_DIR}/${fileName}`
    const relative = `source/front/ux/ui/css/${fileName}`
    designSystemFiles.add(filePath)

    const content = await Deno.readTextFile(filePath)
    const lines = parseLines(content)

    if (TOKEN_ONLY_FILES.has(fileName)) {
      violations.push(...auditTokenDeclarations(lines, relative, fileName))
      violations.push(...auditTokenOnlyDeclarations(lines, relative))
    }

    if (fileName === 'tokens.css') {
      violations.push(...auditTokensCSS(lines, relative, true, false))
      violations.push(...auditValueRules(lines, relative, true))
    } else if (fileName === 'roles.css') {
      violations.push(...auditTokensCSS(lines, relative, true, false))
      violations.push(...auditValueRules(lines, relative, true))
    } else if (fileName === 'themes.css') {
      violations.push(...auditTokensCSS(lines, relative, false, true))
      violations.push(...auditValueRules(lines, relative, true))
    } else if (fileName === 'base.css') {
      violations.push(...auditTokenDeclarations(lines, relative, fileName))
      violations.push(...auditBaseCSS(lines, relative))
      violations.push(...auditValueRules(lines, relative, false))
    } else if (fileName === 'ui.css') {
      violations.push(...auditTokenDeclarations(lines, relative, fileName))
      violations.push(...auditControlsCSS(lines, relative))
      violations.push(...auditValueRules(lines, relative, false))
    }
  }

  await auditFeatureCSSDirectory(COMMON_DIR, designSystemFiles, violations)
  for (const appDir of APP_DIRS) await auditFeatureCSSDirectory(appDir, designSystemFiles, violations)

  if (violations.length > 0) guardFail('CSS', violations)

  guardPass('CSS')
}

await main()

async function auditFeatureCSSDirectory(
  directory: string,
  skippedFiles: StringSet,
  violations: string[]
): Promise<void> {
  for await (
    const entry of walk(directory, {
      includeDirs: false,
      exts: ['.css'],
      skip: [/[/\\]dist[/\\]?/, /[/\\]node_modules[/\\]?/]
    })
  ) {
    const filePath = entry.path.replaceAll('\\', '/')
    if (skippedFiles.has(filePath)) continue

    const relative = filePath.replace(`${ROOT}/`, '')
    const content = await Deno.readTextFile(filePath)
    const lines = parseLines(content)

    violations.push(...auditTokenDeclarations(lines, relative, relative.split('/').at(-1) ?? ''))
    violations.push(...auditFeatureCSS(lines, relative))
    violations.push(...auditValueRules(lines, relative, false))
  }
}
