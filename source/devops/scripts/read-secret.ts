/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Secret reader                                                                ║
║ Reads one secret value by composite key from a JSONC secrets file.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Returns the `secret` value for a composed key (`app.env.config`) from a JSONC
secrets file. Prints empty output when the key is absent.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

import type { Dictionary } from '@core/std'

type SecretRecord = { secret: string }

const stripJsoncComments = (source: string): string => {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '')
  return withoutBlockComments
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

const [FILE_PATH, COMPOSED_KEY] = Deno.args
if (!FILE_PATH || !COMPOSED_KEY) {
  console.error('Usage: deno run --allow-read source/devops/scripts/read-secret.ts <secrets-file> <key>')
  Deno.exit(1)
}

const SOURCE = await Deno.readTextFile(FILE_PATH)
const Parsed = JSON.parse(stripJsoncComments(SOURCE)) as Dictionary<SecretRecord>
const Value = Parsed[COMPOSED_KEY]
if (!Value || typeof Value.secret !== 'string') {
  console.log('')
  Deno.exit(0)
}

console.log(Value.secret)
