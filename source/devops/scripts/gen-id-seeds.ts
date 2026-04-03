/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Seed ID generator                                                           ║
║ Rotates and populates genesis seed IDs using UUIDv7 contiguous ordering.    ║
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

const seedTopics: SeedTopic[] = [
  { name: 'asset_types', count: 9 },
  { name: 'services', count: 12 },
  { name: 'internal_questions', count: 14 }
]

const totalSeedIds = seedTopics.reduce((total, topic) => total + topic.count, 0)

const repoRoot = Deno.cwd()
const legacySeedIdsPath = `${repoRoot}/source/devops/seed-ids.txt`
const genesisDir = `${repoRoot}/source/devops/genesis`
const genesisSeedIdsPath = `${genesisDir}/seed-ids.txt`

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

if (await fileExists(legacySeedIdsPath)) await Deno.remove(legacySeedIdsPath)
await Deno.mkdir(genesisDir, { recursive: true })

const seedIds = makeSeedIds(totalSeedIds)
await Deno.writeTextFile(genesisSeedIdsPath, `${seedIds.join('\n')}\n`)

console.log(`seed_ids_path=${genesisSeedIdsPath}`)
console.log(`seed_ids_total=${totalSeedIds}`)
seedTopics.forEach(topic => console.log(`${topic.name}=${topic.count}`))
