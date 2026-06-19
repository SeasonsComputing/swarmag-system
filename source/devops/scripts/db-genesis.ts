/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Supabase database genesis runner                                            ║
║ Applies the canonical schema to the linked Supabase target after approval.  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Runs the canonical schema genesis operation through the Supabase CLI. The
requested target must exist, be the currently linked project, and be confirmed
by the operator before schema SQL is applied.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

import type { Dictionary } from '@core/std'

type Target = 'dev' | 'stage' | 'prod'

type SupabaseProject = {
  ref: string
  name: string
  status: string
  linked?: boolean
}

type SupabaseProjectsResponse = {
  projects?: SupabaseProject[]
}

const ROOT = Deno.cwd().replaceAll('\\', '/')
const SCHEMA_PATH = `${ROOT}/source/domain/schema/schema.sql`
const MIGRATIONS_DIR = `${ROOT}/source/back/migrations`
const PROJECT_REF_PATH = `${ROOT}/supabase/.temp/project-ref`

const usage = (): never => {
  console.error('Usage: deno task db-genesis --target {dev|stage|prod}')
  Deno.exit(1)
}

const fail = (message: string): never => {
  console.error(`DB_GENESIS_FAIL: ${message}`)
  Deno.exit(1)
}

const commandText = async (command: string, args: string[]): Promise<string> => {
  const result = await new Deno.Command(command, { args }).output()
  if (!result.success) {
    const error = new TextDecoder().decode(result.stderr).trim()
    fail(error || `${command} ${args.join(' ')} failed`)
  }
  return new TextDecoder().decode(result.stdout)
}

const parseTarget = (): Target => {
  const targetFlagIndex = Deno.args.indexOf('--target')
  if (targetFlagIndex === -1) usage()

  const target = Deno.args[targetFlagIndex + 1]
  if (target !== 'dev' && target !== 'stage' && target !== 'prod') usage()
  const parsedTarget = target as Target

  const allowedArgs = new Set(['--target', parsedTarget])
  for (const arg of Deno.args) {
    if (!allowedArgs.has(arg)) usage()
  }

  return parsedTarget
}

const requireFile = async (path: string): Promise<void> => {
  try {
    const stat = await Deno.stat(path)
    if (!stat.isFile) fail(`expected file: ${path}`)
  } catch {
    fail(`missing file: ${path}`)
  }
}

const migrationCount = async (): Promise<number> => {
  try {
    let count = 0
    for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
      if (entry.isFile && entry.name.endsWith('.sql')) count += 1
    }
    return count
  } catch {
    return 0
  }
}

const projectMatchesTarget = (project: SupabaseProject, target: Target): boolean => {
  const name = project.name.toLowerCase()
  if (!name.includes('swarmag')) return false

  if (target === 'dev') return name.includes('dev') || name.includes('development')
  if (target === 'stage') return name.includes('stage') || name.includes('staging')
  return name.includes('prod') || name.includes('production')
}

const findTargetProject = async (target: Target): Promise<SupabaseProject> => {
  const source = await commandText('supabase', ['projects', 'list', '--output-format', 'json'])
  const parsed = JSON.parse(source) as SupabaseProjectsResponse
  const projects = parsed.projects ?? []
  const matches = projects.filter(project => projectMatchesTarget(project, target))

  if (matches.length === 0) fail(`Supabase target does not exist: ${target}`)
  if (matches.length > 1) {
    const names = matches.map(project => `${project.name} (${project.ref})`).join(', ')
    fail(`Supabase target is ambiguous for ${target}: ${names}`)
  }

  return matches[0]
}

const linkedProjectRef = async (): Promise<string> => {
  try {
    return (await Deno.readTextFile(PROJECT_REF_PATH)).trim()
  } catch {
    return fail('Supabase project is not linked. Run supabase link for the target first.')
  }
}

const readConfirmation = (prompt: string): string => {
  const response = globalThis.prompt(prompt)
  return response?.trim() ?? ''
}

const confirmTarget = (target: Target, project: SupabaseProject): void => {
  console.log('')
  console.log('DB_GENESIS_TARGET')
  console.log(`TARGET=${target}`)
  console.log(`PROJECT_NAME=${project.name}`)
  console.log(`PROJECT_REF=${project.ref}`)
  console.log(`PROJECT_STATUS=${project.status}`)
  console.log(`SCHEMA=${SCHEMA_PATH}`)

  const response = readConfirmation(`Type '${target}' to apply schema.sql to this target:`)
  if (response !== target) fail('target confirmation did not match')

  if (target === 'prod') {
    const prodResponse = readConfirmation('Type \'PROD\' to confirm production database maintenance:')
    if (prodResponse !== 'PROD') fail('production confirmation did not match')
  }
}

const parseQueryRows = (output: string): Dictionary[] => {
  const parsed = JSON.parse(output) as unknown
  if (Array.isArray(parsed)) return parsed as Dictionary[]

  if (typeof parsed === 'object' && parsed !== null) {
    const payload = parsed as Dictionary
    if (Array.isArray(payload.data)) return payload.data as Dictionary[]
    if (Array.isArray(payload.rows)) return payload.rows as Dictionary[]
  }

  return fail('unexpected Supabase query output')
}

const queryRows = async (sql: string): Promise<Dictionary[]> => {
  const output = await commandText(
    'supabase',
    ['db', 'query', '--linked', '--output', 'json', sql]
  )
  return parseQueryRows(output)
}

const verify = async (_target: Target): Promise<void> => {
  console.log('')
  console.log('Verifying seed data integrity...')

  const seedUserId = '0195b5b0-3c09-79f0-8d7c-0a1b2c3d4e5f'

  const authRows = await queryRows(
    'SELECT confirmation_token = \'\' AS token_ok, '
      + 'email_confirmed_at IS NOT NULL AS confirmed FROM auth.users '
      + `WHERE id = '${seedUserId}';`
  )
  if (authRows.length !== 1) fail('auth.users seed user not found')
  if (authRows[0].token_ok !== true || authRows[0].confirmed !== true) {
    fail('auth.users seed user confirmation state invalid')
  }

  const userRows = await queryRows(
    'SELECT status = \'active\' AS active FROM public.users '
      + `WHERE id = '${seedUserId}';`
  )
  if (userRows.length !== 1) fail('public.users seed user not found')
  if (userRows[0].active !== true) fail('public.users seed user not active')

  const countRows = await queryRows(
    'SELECT (SELECT COUNT(*)::int FROM asset_types) AS asset_types, '
      + '(SELECT COUNT(*)::int FROM services) AS services, '
      + '(SELECT COUNT(*)::int FROM questions) AS questions;'
  )
  if (countRows.length !== 1) fail('seed table counts query failed')
  if (countRows[0].asset_types !== 9) fail('asset_types count mismatch')
  if (countRows[0].services !== 12) fail('services count mismatch')
  if (countRows[0].questions !== 14) fail('questions count mismatch')

  const rpcRows = await queryRows(
    'SELECT user_has_access(\'tedvkremer@gmail.com\') AS registered, '
      + 'user_has_access(\'unregistered@example.com\') AS not_registered;'
  )
  if (rpcRows.length !== 1) fail('RPC function check failed')
  if (rpcRows[0].registered !== true) fail('RPC registered user check failed')
  if (rpcRows[0].not_registered !== false) fail('RPC unregistered user check failed')

  console.log('DB_GENESIS_VERIFY=PASS')
}

const main = async (): Promise<void> => {
  const target = parseTarget()

  await requireFile(SCHEMA_PATH)

  const project = await findTargetProject(target)
  const linkedRef = await linkedProjectRef()
  if (linkedRef !== project.ref) {
    fail(`linked Supabase project is ${linkedRef}; expected ${project.ref} for target ${target}`)
  }

  const migrations = await migrationCount()
  if (migrations > 0) {
    console.warn(`WARNING: MIGRATIONS FOUND (${migrations})`)
    console.warn('Genesis applies schema.sql only. Run required migrations after genesis.')
  }

  confirmTarget(target, project)

  console.log('')
  console.log('Applying schema.sql through Supabase CLI...')
  await commandText('supabase', ['db', 'query', '--linked', '--file', SCHEMA_PATH])

  await verify(target)

  console.log('DB_GENESIS=PASS')
}

await main()
