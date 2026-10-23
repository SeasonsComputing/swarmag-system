/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ CSS policy guard                                                             ║
║ Audits complete selectors and declarations under existing layer policies.    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Checks CSS ownership, attributes, token declarations, and values independently
of physical selector layout. Runs the repository sweep only as a CLI entry.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
auditCss(content, filePath)  Return located violations for one CSS source.
*/

import { StringSet } from '@core/std'
import { walk } from '@std/walk'
import { guardFail, guardPass } from './guard-utils.ts'

/**
 * Audit one CSS source without reading the repository or terminating the host.
 * @param content CSS source text.
 * @param filePath Repository-relative path selecting the existing layer policies.
 * @returns Located policy violations, or an empty list.
 */
export const auditCss = (content: string, filePath: string): string[] => {
  const { rules, declarations } = parseCss(content)
  // Selector parsing must not broaden the existing physical-line value audits.
  // Complete declarations remain attached to rules for icon association.
  const lines = declarations.flatMap(declaration =>
    declaration.line.split('\n').map((line, index) => ({
      line,
      lineNumber: declaration.lineNumber + index,
      fontFace: declaration.fontFace
    }))
  )
  const fileName = filePath.split('/').at(-1) ?? ''
  const designSystem = filePath.startsWith('source/ux/ui/css/') && CSS_FILES.includes(fileName)
  const tokenOnly = designSystem && TOKEN_ONLY_FILES.has(fileName)
  const violations = auditTokenDeclarations(lines, filePath, fileName)
  if (tokenOnly) violations.push(...auditTokenOnlyDeclarations(lines, filePath))

  if (!designSystem) violations.push(...auditFeatureCss(rules, filePath))
  else if (fileName === 'tokens.css' || fileName === 'roles.css') {
    violations.push(...auditTokensCss(rules, filePath, true, false))
  } else if (fileName === 'themes.css') {
    violations.push(...auditTokensCss(rules, filePath, false, true))
  } else if (fileName === 'base.css') violations.push(...auditBaseCss(rules, filePath))
  else if (fileName === 'ui.css') violations.push(...auditControlsCss(rules, filePath))
  else if (fileName === 'icons.css') violations.push(...auditIconCatalogCss(rules, filePath))

  violations.push(...auditValueRules(lines, filePath, tokenOnly))
  return violations
}

// ────────────────────────────────────────────────────────────────────────────
// POLICY DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

const CSS_FILES = ['tokens.css', 'roles.css', 'themes.css', 'base.css', 'ui.css', 'icons.css']
const TOKEN_ONLY_FILES = new StringSet(['tokens.css', 'roles.css', 'themes.css'])

const DataAttributeRegex = /\[(data-[a-zA-Z0-9_-]+)(?:=(['"]?)([^'"\]\s]+)\2)?\]/g
const TokenDeclarationRegex = /^\s*(--sa-[^:]+)\s*:/

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
  'data-ui-density',
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

const DataAttributeValueRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FeatureAttributeRegex = /^data-(?:shell|widget|app)(?:-[a-z0-9]+)*$/

// ────────────────────────────────────────────────────────────────────────────
// CSS SCANNING
// ────────────────────────────────────────────────────────────────────────────

/** A declaration statement and its source location. */
type CssDeclaration = {
  line: string
  lineNumber: number
  fontFace: boolean
}

/** One branch of a complete rule selector. */
type CssSelector = {
  selector: string
  lineNumber: number
}

/** A qualified rule with declarations owned by its own block. */
type CssRule = {
  selectors: CssSelector[]
  declarations: CssDeclaration[]
}

/** An open rule or at-rule block during bounded scanning. */
type CssBlock = {
  rule: CssRule | undefined
  fontFace: boolean
}

// Comments become whitespace so punctuation inside them cannot affect parsing.
// Newlines remain intact for branch and declaration diagnostics.
const stripComments = (content: string): string => {
  let result = ''
  let comment = false
  let quote = ''
  let escaped = false
  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    if (comment) {
      if (char === '*' && content[i + 1] === '/') {
        result += '  '
        i++
        comment = false
      } else result += char === '\n' ? '\n' : ' '
    } else if (escaped) {
      result += char
      escaped = false
    } else if (char === '\\') {
      result += char
      escaped = true
    } else if (quote) {
      result += char
      if (char === quote) quote = ''
    } else if (char === '\'' || char === '"') {
      result += char
      quote = char
    } else if (char === '/' && content[i + 1] === '*') {
      result += '  '
      i++
      comment = true
    } else result += char
  }
  return result
}

// Split only rule preludes: commas in declaration values and at-rules are not
// selector branches. Source lines advance even inside quoted selectors.
const splitSelectors = (text: string, firstLine: number): CssSelector[] => {
  const selectors: CssSelector[] = []
  let start = 0
  let lineNumber = firstLine
  let branchLine = firstLine
  let quote = ''
  let escaped = false
  let depth = 0
  let started = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (!started && !/\s/.test(char)) {
      branchLine = lineNumber
      started = true
    }
    if (escaped) escaped = false
    else if (char === '\\') escaped = true
    else if (quote) {
      if (char === quote) quote = ''
    } else if (char === '\'' || char === '"') quote = char
    else if (char === '[' || char === '(') depth++
    else if (char === ']' || char === ')') depth--
    else if (char === ',' && depth === 0) {
      selectors.push({ selector: text.slice(start, i).trim(), lineNumber: branchLine })
      start = i + 1
      started = false
    }
    if (char === '\n') lineNumber++
  }
  selectors.push({ selector: text.slice(start).trim(), lineNumber: branchLine })
  return selectors
}

// The same lexical boundaries govern blocks and selector-list commas. A branch's
// first non-whitespace character owns its diagnostic, even after a comment.
const parseCss = (content: string): { rules: CssRule[]; declarations: CssDeclaration[] } => {
  const rules: CssRule[] = []
  const declarations: CssDeclaration[] = []
  const blocks: CssBlock[] = []
  const source = stripComments(content)
  let text = ''
  let lineNumber = 1
  let startLine = 1
  let quote = ''
  let escaped = false
  let brackets = 0
  let parentheses = 0

  const reset = () => {
    text = ''
  }
  const declaration = (terminated: boolean) => {
    const block = blocks.at(-1)
    if (block && text.includes(':') && !text.trimStart().startsWith('@')) {
      const item = {
        line: text.trim() + (terminated ? ';' : ''),
        lineNumber: startLine,
        fontFace: block.fontFace
      }
      declarations.push(item)
      block.rule?.declarations.push(item)
    }
    reset()
  }

  for (const char of source) {
    if (text === '' && /\s/.test(char)) {
      if (char === '\n') lineNumber++
      continue
    }
    if (text === '') startLine = lineNumber
    if (escaped) {
      text += char
      escaped = false
    } else if (char === '\\') {
      text += char
      escaped = true
    } else if (quote) {
      text += char
      if (char === quote) quote = ''
    } else if (char === '\'' || char === '"') {
      text += char
      quote = char
    } else if (char === '[') {
      brackets++
      text += char
    } else if (char === ']') {
      brackets--
      text += char
    } else if (char === '(') {
      parentheses++
      text += char
    } else if (char === ')') {
      parentheses--
      text += char
    } else if (brackets === 0 && parentheses === 0 && char === '{') {
      const atRule = text.trimStart().startsWith('@')
      if (atRule) {
        blocks.push({ rule: undefined, fontFace: text.trimStart().startsWith('@font-face') })
      } else {
        const rule = { selectors: splitSelectors(text, startLine), declarations: [] }
        rules.push(rule)
        blocks.push({ rule, fontFace: false })
      }
      reset()
    } else if (brackets === 0 && parentheses === 0 && char === '}') {
      declaration(false)
      blocks.pop()
    } else if (brackets === 0 && parentheses === 0 && char === ';') {
      declaration(true)
    } else text += char
    if (char === '\n') lineNumber++
  }
  return { rules, declarations }
}

// ────────────────────────────────────────────────────────────────────────────
// POLICY AUDITS
// ────────────────────────────────────────────────────────────────────────────

const isImmutableToken = (name: string): boolean =>
  IMMUTABLE_TOKEN_NAMES.has(name)
  || IMMUTABLE_TOKEN_PREFIXES.some(prefix => name.startsWith(prefix))

const auditTokenDeclarations = (
  lines: CssDeclaration[],
  filePath: string,
  fileName: string
): string[] => {
  const violations: string[] = []

  for (const { line, lineNumber } of lines) {
    const match = line.match(TokenDeclarationRegex)
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
  lines: CssDeclaration[],
  filePath: string
): string[] => {
  const violations: string[] = []

  for (const { line, lineNumber } of lines) {
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

const auditTokensCss = (
  rules: CssRule[],
  filePath: string,
  allowRoot: boolean,
  allowThemeSelectors: boolean
): string[] => {
  const violations: string[] = []

  for (const { selector, lineNumber } of rules.flatMap(rule => rule.selectors)) {
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

const auditBaseCss = (rules: CssRule[], filePath: string): string[] => {
  const violations: string[] = []

  for (const { selector, lineNumber } of rules.flatMap(rule => rule.selectors)) {
    if (selector.includes('[')) {
      violations.push(
        `${filePath}:${lineNumber} — attribute selector in base.css — found: ${selector}`
      )
    }
  }

  return violations
}

const auditControlsCss = (rules: CssRule[], filePath: string): string[] => {
  const violations: string[] = []

  for (const { selector, lineNumber } of rules.flatMap(rule => rule.selectors)) {
    if (!selector.startsWith('[data-ui')) {
      violations.push(
        `${filePath}:${lineNumber} — selector not rooted at [data-ui — found: ${selector}`
      )
    }
  }

  return violations
}

const auditIconCatalogCss = (rules: CssRule[], filePath: string): string[] => {
  const violations: string[] = []
  const iconNames = new StringSet()

  for (const rule of rules) {
    const entries: { name: string; lineNumber: number }[] = []
    for (const { selector, lineNumber } of rule.selectors) {
      const iconMatch = selector.match(/^\[data-ui-icon='([^']+)'\]$/)
      if (!iconMatch) {
        violations.push(
          `${filePath}:${lineNumber} — icon catalog selector must be [data-ui-icon='{name}']`
            + ` — found: ${selector}`
        )
        continue
      }
      const name = iconMatch[1]
      if (iconNames.has(name)) {
        violations.push(`${filePath}:${lineNumber} — duplicate icon catalog name — ${name}`)
      }
      iconNames.add(name)
      entries.push({ name, lineNumber })
    }

    let hasIconDeclaration = false
    for (const { line, lineNumber } of rule.declarations) {
      if (entries.length === 0) continue
      const property = line.substring(0, line.indexOf(':')).trim()
      if (property !== '--sa-icon') {
        violations.push(
          `${filePath}:${lineNumber} — icon catalog declares non --sa-icon property — ${property}`
        )
      } else {
        hasIconDeclaration = true
        for (const { name } of entries) {
          const expected = `--sa-icon: url('../icons/${name}.svg');`
          if (line !== expected) {
            violations.push(
              `${filePath}:${lineNumber} — icon catalog name must match SVG asset`
                + ` — expected: ${expected}`
            )
          }
        }
      }
    }
    if (!hasIconDeclaration) {
      for (const { name, lineNumber } of entries) {
        violations.push(
          `${filePath}:${lineNumber} — icon catalog entry missing --sa-icon declaration — ${name}`
        )
      }
    }
  }
  return violations
}

const auditFeatureCss = (rules: CssRule[], filePath: string): string[] => {
  const violations: string[] = []
  const namespace = featureNamespace(filePath)

  for (const { selector, lineNumber } of rules.flatMap(rule => rule.selectors)) {
    if (!selector.startsWith(`[${namespace}`)) {
      violations.push(
        `${filePath}:${lineNumber} — selector not rooted at [${namespace} — found: ${selector}`
      )
    }

    DataAttributeRegex.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = DataAttributeRegex.exec(selector)) !== null) {
      const attribute = match[1]
      const value = match[3]

      if (!ALLOWED_DATA_ATTRIBUTES.has(attribute) && !FeatureAttributeRegex.test(attribute)) {
        violations.push(
          `${filePath}:${lineNumber} — forbidden data attribute selector — found: ${attribute}`
        )
      }

      if (
        value
        && (
          attribute === 'data-ui'
          || attribute.startsWith('data-ui-')
          || attribute === namespace
          || attribute.startsWith(`${namespace}-`)
        )
        && !DataAttributeValueRegex.test(value)
      ) {
        violations.push(
          `${filePath}:${lineNumber} — data attribute value not kebab-case — ${attribute}='${value}'`
        )
      }
    }
  }

  return violations
}

const featureNamespace = (filePath: string): string => {
  if (filePath.startsWith('source/ux/shell/')) return 'data-shell'
  if (filePath.startsWith('source/ux/widgets/')) return 'data-widget'
  return 'data-app'
}

const auditValueRules = (
  lines: CssDeclaration[],
  filePath: string,
  skipTokensFile: boolean
): string[] => {
  const violations: string[] = []

  const exemptProps = new StringSet([
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
    const { line, lineNumber } = lines[i]
    if (lines[i].fontFace) continue

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

// ────────────────────────────────────────────────────────────────────────────
// REPOSITORY SWEEP
// ────────────────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  const root = Deno.cwd().replaceAll('\\', '/')
  const cssDirectory = `${root}/source/ux/ui/css`
  const directories = [
    `${root}/source/ux`,
    `${root}/source/front/app-admin`,
    `${root}/source/front/app-customer`,
    `${root}/source/front/app-ops`,
    `${root}/source/front/app-style-guide`
  ]
  const violations: string[] = []
  const designSystemFiles = new StringSet()

  for (const fileName of CSS_FILES) {
    const filePath = `${cssDirectory}/${fileName}`
    designSystemFiles.add(filePath)
    const content = await Deno.readTextFile(filePath)
    violations.push(...auditCss(content, `source/ux/ui/css/${fileName}`))
  }

  for (const directory of directories) {
    for await (
      const entry of walk(directory, {
        includeDirs: false,
        exts: ['.css'],
        skip: [/[/\\]dist[/\\]?/, /[/\\]node_modules[/\\]?/]
      })
    ) {
      const filePath = entry.path.replaceAll('\\', '/')
      if (designSystemFiles.has(filePath)) continue
      const relative = filePath.replace(`${root}/`, '')
      const content = await Deno.readTextFile(filePath)
      violations.push(...auditCss(content, relative))
    }
  }

  if (violations.length > 0) guardFail('CSS', violations)
  guardPass('CSS')
}

if (import.meta.main) await main()
