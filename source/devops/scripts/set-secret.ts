/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Secret setter                                                               ║
║ Updates one secret value by key in a JSONC secrets file.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Sets the `secret` field for one composed key (`app.env.config`) inside a JSONC
secrets file while preserving surrounding comments and structure.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

const [filePath, composedKey, secretValue] = Deno.args
if (!filePath || !composedKey || !secretValue) {
  console.error(
    'Usage: deno run --allow-read --allow-write source/devops/scripts/set-secret.ts <secrets-file> <key> <secret>'
  )
  Deno.exit(1)
}

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const source = await Deno.readTextFile(filePath)
const keyPattern = `"${escapeRegex(composedKey)}"\\s*:\\s*\\{[\\s\\S]*?"secret"\\s*:\\s*"([^"]*)"`
const keyRegex = new RegExp(keyPattern)

const match = source.match(keyRegex)
if (!match) {
  console.error(`Secret key not found: ${composedKey}`)
  Deno.exit(1)
}

const updated = source.replace(
  keyRegex,
  match[0].replace(`"secret": "${match[1]}"`, `"secret": "${secretValue}"`)
)

await Deno.writeTextFile(filePath, updated)
