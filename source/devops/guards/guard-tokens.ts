/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Token authority guard                                                        ║
║ Documentation names tokens and states purpose; it never restates values.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
A design token's value lives in the token provider layer and nowhere else.
Documentation that also carries the value forks the design system: documents sit
above stylesheets in the precedence chain, so a drifted table is formally
authoritative while the stylesheet is actually in effect.

This guard prohibits the PAIRING rather than comparing values. A line naming a
`--sa-*` token may not also carry a literal measure. Lexical and deterministic —
it never has to resolve a `clamp()` chain, so it cannot report false confidence.

Fenced code blocks are exempt: examples legitimately show real declarations.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
main()  Audit documentation for token-value restatement.
*/

const DOCS_ROOT = 'documentation'
const Token = /--sa-[a-z0-9-]+/
const Fence = /^\s*(```|~~~)/

/** A literal measure: a number carrying a CSS unit, or a bare integer cell. */
const Literal = /(?<![\w-])\d+(\.\d+)?(rem|px|em|%|s|ms|dvh|dvw|vh|vw|ch|fr)(?![\w-])/

/** Bare numeric table cell, e.g. a z-index ordering column. */
const BareNumberCell = /\|\s*-?\d+(\.\d+)?\s*\|/

/** One reported violation. */
type Violation = {
  file: string
  line: number
  text: string
}

// Collect markdown files under a directory.
async function collectMarkdown(root: string): Promise<string[]> {
  const found: string[] = []
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`
    if (entry.isDirectory) found.push(...await collectMarkdown(path))
    else if (entry.name.endsWith('.md')) found.push(path)
  }
  return found
}

// Audit one file for token lines that also carry a literal value.
function auditFile(file: string, source: string): Violation[] {
  const violations: Violation[] = []
  let fenced = false
  const lines = source.split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index]
    if (Fence.test(text)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    if (!Token.test(text)) continue
    if (!Literal.test(text) && !BareNumberCell.test(text)) continue
    violations.push({ file, line: index + 1, text: text.trim() })
  }
  return violations
}

// Audit documentation for token-value restatement.
async function main(): Promise<void> {
  const files = await collectMarkdown(DOCS_ROOT)
  const violations = files
    .map(file => auditFile(file, Deno.readTextFileSync(file)))
    .flat()

  if (violations.length > 0) {
    console.error('✗ Token authority guard failed')
    console.error('  Documentation may name a token or state a value, never both.')
    console.error('  Move the value to the token provider layer and keep the purpose.\n')
    for (const violation of violations) {
      console.error(`  ${violation.file}:${violation.line}`)
      console.error(`    ${violation.text}`)
    }
    Deno.exit(1)
  }

  console.log('✓ Token authority guard passed')
}

await main()
