/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ list-supabase-targets                                                        ║
║ Query Supabase project topology and emit structured JSON.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Resolves Supabase project refs and URLs for swarmAg targets by querying
`supabase projects list --output-format json`. Writes a filtered or complete
topology map to stdout as JSON. Other scripts consume this output rather than
resolving Supabase topology independently.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

type Target = 'dev' | 'stage' | 'prod'

type SupabaseProject = {
  ref: string
  name: string
  status: string
}

type SupabaseProjectsResponse = {
  projects?: SupabaseProject[]
}

type ProjectEntry = { projectRef: string; url: string }
type TargetMap = { [target: string]: ProjectEntry }

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const TARGETS: Target[] = ['dev', 'stage', 'prod']

const TARGET_KEYWORDS: { [target in Target]: string[] } = {
  dev: ['dev', 'development'],
  stage: ['stage', 'staging'],
  prod: ['prod', 'production']
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────

const fail = (message: string): never => {
  console.error(`LIST_SUPABASE_FAIL: ${message}`)
  Deno.exit(1)
}

const usage = (): never => {
  console.error('Usage: deno task list-supabase-targets --target {dev|stage|prod}')
  Deno.exit(1)
}

const parseTargetValue = (value: string | undefined): Target => {
  if (value !== undefined && TARGETS.includes(value as Target)) return value as Target
  return usage()
}

const parseArgs = (): { target: Target } => {
  const args = Deno.args
  let target: Target | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--target') {
      target = parseTargetValue(args[++i])
      continue
    }
    usage()
  }

  const parsedTarget = target ?? usage()

  return { target: parsedTarget }
}

const fetchProjects = async (): Promise<SupabaseProject[]> => {
  let result: Deno.CommandOutput
  try {
    result = await new Deno.Command('supabase', {
      args: ['projects', 'list', '--output-format', 'json'],
      stderr: 'piped',
      stdout: 'piped'
    }).output()
  } catch {
    return fail('Supabase CLI unavailable')
  }

  if (!result.success) {
    const error = new TextDecoder().decode(result.stderr).trim()
    if (error.toLowerCase().includes('not logged in') || error.toLowerCase().includes('login')) {
      fail('not authenticated — run: supabase login')
    }
    fail(error || 'supabase projects list failed — run: supabase login')
  }

  const raw = new TextDecoder().decode(result.stdout).trim()
  try {
    const parsed = JSON.parse(raw) as SupabaseProjectsResponse
    return parsed.projects ?? []
  } catch {
    return fail('supabase projects list response was not valid JSON')
  }
}

const projectMatchesTarget = (project: SupabaseProject, target: Target): boolean => {
  const name = project.name.toLowerCase()
  if (!name.includes('swarmag')) return false
  return TARGET_KEYWORDS[target].some(keyword => name.includes(keyword))
}

const resolveProject = (projects: SupabaseProject[], target: Target): ProjectEntry => {
  const matches = projects.filter(p => projectMatchesTarget(p, target))

  if (matches.length === 0) fail(`no Supabase project found for target: ${target}`)
  if (matches.length > 1) {
    const names = matches.map(p => `${p.name} (${p.ref})`).join(', ')
    fail(`ambiguous Supabase projects for target ${target}: ${names}`)
  }

  const project = matches[0]
  return {
    projectRef: project.ref,
    url: `https://${project.ref}.supabase.co`
  }
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  const { target } = parseArgs()
  const projects = await fetchProjects()

  const result: TargetMap = {}
  result[target] = resolveProject(projects, target)

  console.log(JSON.stringify(result, null, 2))
}

await main()
