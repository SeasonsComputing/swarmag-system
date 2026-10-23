/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Seed ID generator                                                            ║
║ Rotates and populates genesis seed IDs using UUIDv7 contiguous ordering.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Implements the Seed ID Protocol from genesis-domain-sdk by removing legacy
seed-id file paths, replacing source/devops/genesis/seed-ids.txt, and writing
exactly the required UUIDv7 IDs in contiguous assignment order.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

import { id, StringSet } from '@core/std'

type SeedTopic = {
  name: string
  count: number
}

const SEED_TOPICS: SeedTopic[] = [
  { name: 'asset_types', count: 9 },
  { name: 'services', count: 12 },
  { name: 'internal_questions', count: 14 }
]

const TOTAL_SEED_IDS = SEED_TOPICS.reduce((total, topic) => total + topic.count, 0)

const REPO_ROOT = Deno.cwd()
const LEGACY_SEED_IDS_PATH = `${REPO_ROOT}/source/devops/seed-ids.txt`
const GENESIS_DIR = `${REPO_ROOT}/source/devops/genesis`
const GENESIS_SEED_IDS_PATH = `${GENESIS_DIR}/seed-ids.txt`

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await Deno.stat(path)
    return true
  } catch {
    return false
  }
}

const makeSeedIds = (count: number): string[] => {
  const ids: string[] = []
  const seen = new StringSet()
  while (ids.length < count) {
    const nextId = id()
    if (seen.has(nextId)) continue
    seen.add(nextId)
    ids.push(nextId)
  }
  return ids
}

if (await fileExists(LEGACY_SEED_IDS_PATH)) await Deno.remove(LEGACY_SEED_IDS_PATH)
await Deno.mkdir(GENESIS_DIR, { recursive: true })

const SEED_IDS = makeSeedIds(TOTAL_SEED_IDS)
await Deno.writeTextFile(GENESIS_SEED_IDS_PATH, `${SEED_IDS.join('\n')}\n`)

console.log(`seed_ids_path=${GENESIS_SEED_IDS_PATH}`)
console.log(`seed_ids_total=${TOTAL_SEED_IDS}`)
SEED_TOPICS.forEach(topic => console.log(`${topic.name}=${topic.count}`))
