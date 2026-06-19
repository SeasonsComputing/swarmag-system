/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ list-netlify-targets                                                         ║
║ Query Netlify site topology and emit structured JSON.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Resolves Netlify site IDs and URLs for swarmAg app/target pairs by querying
`netlify sites:list --json`. Writes a filtered or complete topology map to
stdout as JSON. Other scripts consume this output rather than resolving Netlify
topology independently.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

type App = 'admin' | 'ops' | 'customer'
type Target = 'dev' | 'stage' | 'prod'

type NetlifySite = {
  id?: string
  name?: string
  ssl_url?: string
  url?: string
}

type SiteEntry = { siteId: string; url: string }
type AppTargetMap = { [app: string]: { [target: string]: SiteEntry } }

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const APPS: App[] = ['admin', 'ops', 'customer']
const TARGETS: Target[] = ['dev', 'stage', 'prod']

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────

const fail = (message: string): never => {
  console.error(`LIST_NETLIFY_FAIL: ${message}`)
  Deno.exit(1)
}

const usage = (): never => {
  console.error(
    'Usage: deno task list-netlify-targets [--app {admin|ops|customer}] --target {dev|stage|prod}'
  )
  Deno.exit(1)
}

const parseApp = (value: string | undefined): App => {
  if (value !== undefined && APPS.includes(value as App)) return value as App
  return usage()
}

const parseTargetValue = (value: string | undefined): Target => {
  if (value !== undefined && TARGETS.includes(value as Target)) return value as Target
  return usage()
}

const parseArgs = (): { apps: App[]; target: Target } => {
  const args = Deno.args
  let apps: App[] = APPS
  let target: Target | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--app') {
      apps = [parseApp(args[++i])]
      continue
    }
    if (arg === '--target') {
      target = parseTargetValue(args[++i])
      continue
    }
    usage()
  }

  const parsedTarget = target ?? usage()

  return { apps, target: parsedTarget }
}

const fetchSites = async (): Promise<NetlifySite[]> => {
  let result: Deno.CommandOutput
  try {
    result = await new Deno.Command('netlify', {
      args: ['sites:list', '--json'],
      stderr: 'piped',
      stdout: 'piped'
    }).output()
  } catch {
    return fail('Netlify CLI unavailable')
  }

  if (!result.success) {
    const error = new TextDecoder().decode(result.stderr).trim()
    if (error.toLowerCase().includes('not logged in') || error.toLowerCase().includes('login')) {
      fail('not authenticated — run: netlify login')
    }
    fail(error || 'netlify sites:list failed — run: netlify login')
  }

  const raw = new TextDecoder().decode(result.stdout).trim()
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) fail('netlify sites:list did not return a site list')
    return parsed as NetlifySite[]
  } catch {
    return fail('netlify sites:list response was not valid JSON')
  }
}

const siteName = (app: App, target: Target): string => `swarmag-app-${app}-${target}`

const resolveSite = (sites: NetlifySite[], app: App, target: Target): SiteEntry => {
  const name = siteName(app, target)
  const match = sites.find(s => s.name === name)
  if (!match) return fail(`Netlify site not found: ${name}`)
  const siteId = match.id ?? fail(`Netlify site missing id: ${name}`)
  const url = match.ssl_url ?? match.url ?? fail(`Netlify site missing url: ${name}`)
  return { siteId, url }
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────

const main = async (): Promise<void> => {
  const { apps, target } = parseArgs()
  const sites = await fetchSites()

  const result: AppTargetMap = {}
  for (const app of apps) {
    result[app] = {}
    result[app][target] = resolveSite(sites, app, target)
  }

  console.log(JSON.stringify(result, null, 2))
}

await main()
