/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Secrets validator                                                           ║
║ Enforces composed secret-key identity from app, env, and config attributes. ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates repository secrets metadata format in secrets.jsonc and enforces
that each key equals the composed identity "<app>.<env>.<config>" derived from
its attributes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

import type { Dictionary } from '@core/std'

type SecretRecord = {
  app: string
  env: string
  config: string
  tags: string[]
  secret: string
}

const ROOT = Deno.cwd().replaceAll('\\', '/')
const SECRETS_FILE = `${ROOT}/secrets.jsonc`
const VALID_ENVS = new Set(['local', 'stage', 'prod'])

const parseSecretsJsonc = (source: string): Dictionary<SecretRecord> => {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const withoutLineComments = withoutBlockComments
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
  return JSON.parse(withoutLineComments) as Dictionary<SecretRecord>
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string')

const main = async () => {
  let source = ''
  try {
    source = await Deno.readTextFile(SECRETS_FILE)
  } catch {
    console.error(`Secrets validation failed: missing ${SECRETS_FILE}`)
    Deno.exit(1)
  }

  let records: Dictionary<SecretRecord>
  try {
    records = parseSecretsJsonc(source)
  } catch (error) {
    console.error(`Secrets validation failed: invalid JSONC in ${SECRETS_FILE}`)
    console.error(String(error))
    Deno.exit(1)
    return
  }

  const violations: string[] = []
  for (const [key, record] of Object.entries(records)) {
    if (typeof record !== 'object' || record === null) {
      violations.push(`${key} must map to an object`)
      continue
    }

    if (typeof record.app !== 'string' || record.app.length === 0) {
      violations.push(`${key} has invalid app`)
    }
    if (typeof record.env !== 'string' || !VALID_ENVS.has(record.env)) {
      violations.push(`${key} has invalid env (expected local|stage|prod)`)
    }
    if (typeof record.config !== 'string' || record.config.length === 0) {
      violations.push(`${key} has invalid config`)
    }
    if (!isStringArray(record.tags)) {
      violations.push(`${key} has invalid tags (expected string[])`)
    }
    if (typeof record.secret !== 'string') {
      violations.push(`${key} has invalid secret (expected string)`)
    }

    const composedKey = `${record.app}.${record.env}.${record.config}`
    if (key !== composedKey) {
      violations.push(`${key} key mismatch (expected ${composedKey})`)
    }
  }

  if (violations.length > 0) {
    console.error('Secrets validation failed:')
    for (const violation of violations) console.error(`- ${violation}`)
    Deno.exit(1)
  }
}

await main()
