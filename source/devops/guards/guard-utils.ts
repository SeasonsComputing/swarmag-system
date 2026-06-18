/** Shared reporting utilities for guard scripts. */

/** Log a passing guard result to stdout. */
export const guardPass = (name: string): void => {
  console.log(`✓ ${name} guard passed`)
}

/** Log a failing guard result to stderr and exit with code 1. */
export const guardFail = (name: string, violations: string[], hint?: string): never => {
  console.error(`✗ ${name} guard failed:`)
  console.error('')
  for (const v of violations) console.error(`  ${v}`)
  console.error('')
  if (hint) {
    console.error(hint)
    console.error('')
  }
  Deno.exit(1)
}
