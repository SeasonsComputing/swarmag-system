/**
 * Sync shared source trees into the Supabase functions mount boundary.
 *
 * Supabase Edge tooling mounts only `supabase/functions/` into its runtime
 * container, so function imports cannot reach `source/`. This script:
 *
 * 1. Copies the source trees the edge function graph needs into the
 *    generated, gitignored `supabase/functions/_shared/` directory.
 * 2. Generates each function's `deno.json` from the committed
 *    `supabase/functions/import_map.json` (single source of truth).
 * 3. Stamps `_shared` build metadata with VERSION, git build count, and SHA.
 *
 * Run before `supabase functions serve` or `supabase functions deploy` —
 * the `edge-serve` and `edge-deploy` tasks do this automatically.
 */

import { type StringDictionary } from '@core/std'

const ROOT = Deno.cwd().replaceAll('\\', '/')
const FUNCTIONS = `${ROOT}/supabase/functions`
const TARGET = `${FUNCTIONS}/_shared`
const IMPORT_MAP = `${FUNCTIONS}/import_map.json`
const BUILD_META = `${TARGET}/back/supabase-edge/config/build-meta.ts`

/** Source trees required by the edge function import graph. */
const TREES: [string, string][] = [
  ['source/core', 'core'],
  ['source/domain', 'domain'],
  ['source/back/supabase-edge', 'back/supabase-edge']
]

const copyTree = async (from: string, to: string): Promise<number> => {
  let copied = 0
  await Deno.mkdir(to, { recursive: true })
  for await (const entry of Deno.readDir(from)) {
    if (entry.name.startsWith('.')) continue
    const source = `${from}/${entry.name}`
    const target = `${to}/${entry.name}`
    if (entry.isDirectory) {
      copied += await copyTree(source, target)
    } else if (entry.isFile) {
      await Deno.copyFile(source, target)
      copied += 1
    }
  }
  return copied
}

/** Generate per-function deno.json manifests from the committed import map. */
const generateManifests = async (): Promise<number> => {
  const map = JSON.parse(await Deno.readTextFile(IMPORT_MAP)) as {
    imports: StringDictionary
  }
  const imports: StringDictionary = {}
  for (const [alias, path] of Object.entries(map.imports)) {
    // function dirs sit one level below the import map's base
    imports[alias] = path.startsWith('./') ? `.${path}` : path
  }
  const manifest = `${JSON.stringify({ imports }, null, 2)}\n`

  let generated = 0
  for await (const entry of Deno.readDir(FUNCTIONS)) {
    if (!entry.isDirectory || entry.name.startsWith('_')) continue
    await Deno.writeTextFile(`${FUNCTIONS}/${entry.name}/deno.json`, manifest)
    generated += 1
  }
  return generated
}

/** Stamp the synced build-meta module with the real build id. */
const stampBuildMeta = async (): Promise<string> => {
  const version = (await Deno.readTextFile(`${ROOT}/VERSION`)).trim()
  const count = (await git('rev-list', '--count', 'HEAD')).trim()
  const sha = (await git('rev-parse', '--short', 'HEAD')).trim()
  const build = `${version}.${count}+${sha}`
  await Deno.writeTextFile(
    BUILD_META,
    `/**
 * Edge build metadata stamped by edge-sync. Generated — do not edit.
 */

/** Response header carrying the edge build id. */
export const HEADER_BUILD = 'x-swarmag-build'

/** Build id stamped at edge-sync time. */
export const BUILD_META = '${build}'
`
  )
  return build
}

const git = async (...args: string[]): Promise<string> => {
  const { stdout } = await new Deno.Command('git', { args }).output()
  return new TextDecoder().decode(stdout)
}

const main = async (): Promise<void> => {
  await Deno.remove(TARGET, { recursive: true }).catch(() => {})

  let total = 0
  for (const [from, to] of TREES) {
    total += await copyTree(`${ROOT}/${from}`, `${TARGET}/${to}`)
  }
  const manifests = await generateManifests()
  const build = await stampBuildMeta()

  console.log(
    `✓ Edge sync complete: ${total} files → _shared, ${manifests} manifests, build ${build}`
  )
}

await main()
