/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Secret setter                                                                ║
║ Updates one secret value by key in a JSONC secrets file.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Sets the `secret` field for one composed key (`app.env.config`) inside a JSONC
secrets file while preserving surrounding comments and structure.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

const [FILE_PATH, COMPOSED_KEY, SECRET_VALUE] = Deno.args
if (!FILE_PATH || !COMPOSED_KEY || !SECRET_VALUE) {
  console.error(
    'Usage: deno run --allow-read --allow-write source/devops/scripts/set-secret.ts <secrets-file> <key> <secret>'
  )
  Deno.exit(1)
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const SOURCE = await Deno.readTextFile(FILE_PATH)
const KEY_PATTERN = `"${escapeRegex(COMPOSED_KEY)}"\\s*:\\s*\\{[\\s\\S]*?"secret"\\s*:\\s*"([^"]*)"`
const KeyRegex = new RegExp(KEY_PATTERN)

const MATCH = SOURCE.match(KeyRegex)
if (!MATCH) {
  console.error(`Secret key not found: ${COMPOSED_KEY}`)
  Deno.exit(1)
}

const UPDATED = SOURCE.replace(
  KeyRegex,
  MATCH[0].replace(`"secret": "${MATCH[1]}"`, `"secret": "${SECRET_VALUE}"`)
)

await Deno.writeTextFile(FILE_PATH, UPDATED)
