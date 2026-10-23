/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Guard reporting utilities                                                    ║
║ Shared success and failure reporting for guard scripts.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Shared reporting utilities for guard scripts.

Report guard results consistently and terminate failed guards with exit code 1.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
guardPass(name)                   Report a passing guard to stdout.
guardFail(name, violations, hint)  Report failure details to stderr and exit.
*/

/**
 * Log a passing guard result to stdout.
 * @param name Guard display name.
 */
export const guardPass = (name: string): void => {
  console.log(`✓ ${name} guard passed`)
}

/**
 * Log a failing guard result to stderr and exit with code 1.
 * @param name Guard display name.
 * @param violations Reported failures.
 * @param hint Optional remediation guidance.
 * @returns Never returns; terminates with exit code 1.
 */
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
