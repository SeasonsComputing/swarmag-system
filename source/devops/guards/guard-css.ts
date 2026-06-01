const ROOT = Deno.cwd().replaceAll('\\', '/')
const CSS_DIR = `${ROOT}/source/ux/common/components/css`

const CSS_FILES = ['tokens.css', 'themes.css', 'base.css', 'ui.css']

const SELECTOR_REGEX = /^([^/{\n]*)\{/
const COMMENT_LINE_REGEX = /^\s*\/\//
const BLOCK_COMMENT_START = /\/\*/
const BLOCK_COMMENT_END = /\*\//

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

    if (!allowThemeSelectors && selector.startsWith('[data-theme=')) {
      violations.push(
        `${filePath}:${lineNumber} — forbidden theme selector — found: ${selector}`
      )
      continue
    }

    if (selector !== ':root' && !selector.startsWith('[data-theme=')) {
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

    // Skip B1, B2 rules and remaining rules if in tokens.css
    if (skipTokensFile) continue

    // B1: primitive token ref (skip in tokens.css)
    if (valuePart.includes('var(--sa-p-')) {
      violations.push(
        `${filePath}:${lineNumber} — primitive token ref outside tokens.css — ${valuePart}`
      )
    }

    // B2: raw oklch() (skip in tokens.css)
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

  for (const fileName of CSS_FILES) {
    const filePath = `${CSS_DIR}/${fileName}`
    const relative = `source/ux/common/components/css/${fileName}`

    const content = await Deno.readTextFile(filePath)
    const lines = parseLines(content)

    if (fileName === 'tokens.css') {
      violations.push(...auditTokensCSS(lines, relative, true, false))
      violations.push(...auditValueRules(lines, relative, true))
    } else if (fileName === 'themes.css') {
      violations.push(...auditTokensCSS(lines, relative, false, true))
      violations.push(...auditValueRules(lines, relative, true))
    } else if (fileName === 'base.css') {
      violations.push(...auditBaseCSS(lines, relative))
      violations.push(...auditValueRules(lines, relative, false))
    } else if (fileName === 'ui.css') {
      violations.push(...auditControlsCSS(lines, relative))
      violations.push(...auditValueRules(lines, relative, false))
    }
  }

  if (violations.length > 0) {
    console.error('STYLE_AUDIT: FAIL')
    for (const violation of violations) {
      console.error(violation)
    }
    console.log(`\nViolations: ${violations.length}`)
    Deno.exit(1)
  }

  console.log('STYLE_AUDIT: PASS')
}

await main()
