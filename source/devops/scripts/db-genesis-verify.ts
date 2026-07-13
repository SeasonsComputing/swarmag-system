/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Supabase database seed verification                                         ║
║ Verifies seed data integrity without modifying the database schema.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Verifies seed data integrity of a Supabase target after a genesis run.
Non-destructive — does not modify the database.

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
const PROJECT_REF_PATH = `${ROOT}/supabase/.temp/project-ref`

const usage = (): never => {
  console.error('Usage: deno task db-genesis-verify --target {dev|stage|prod}')
  Deno.exit(1)
}

const fail = (message: string): never => {
  console.error(`DB_GENESIS_VERIFY_FAIL: ${message}`)
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
    'SELECT user_has_access(\'devops-admin@swarmag.com\') AS registered, '
      + 'user_has_access(\'unregistered@example.com\') AS not_registered;'
  )
  if (rpcRows.length !== 1) fail('RPC function check failed')
  if (rpcRows[0].registered !== true) fail('RPC registered user check failed')
  if (rpcRows[0].not_registered !== false) fail('RPC unregistered user check failed')

  // auth.users.email is excluded from the seed upsert's ON CONFLICT SET clause
  // (protects a real, already-changed login email from being clobbered by an
  // unrelated genesis run); a seed email edit therefore never propagates to an
  // existing row on its own. Detect drift here rather than let it surface as
  // a silent login failure.
  const syncRows = await queryRows(
    'SELECT a.email AS auth_email, u.primary_email AS domain_email '
      + 'FROM auth.users a JOIN public.users u ON u.id = a.id '
      + 'WHERE a.email IS DISTINCT FROM u.primary_email;'
  )
  if (syncRows.length > 0) {
    fail(
      `auth/domain email drift detected: ${JSON.stringify(syncRows)}`
    )
  }

  console.log('DB_GENESIS_VERIFY=PASS')
}

const main = async (): Promise<void> => {
  const target = parseTarget()

  const project = await findTargetProject(target)
  const linkedRef = await linkedProjectRef()
  if (linkedRef !== project.ref) {
    fail(
      `linked Supabase project is ${linkedRef}; expected ${project.ref} for target ${target}`
    )
  }

  await verify(target)
}

await main()
