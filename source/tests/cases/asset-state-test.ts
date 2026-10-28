/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Asset draft tests                                                            ║
║ Verify Asset Type and Asset draft ownership and normalization.               ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { id, toWhen } from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'
import { scopes } from '@front/api/scopes.ts'
import { assetTypeDraft, createAssetTypeState } from '@front/app-admin/asset-types/asset-type-state.ts'
import { assetDraft, createAssetState } from '@front/app-admin/assets/asset-state.ts'
import { assertEquals } from '@std/assert'
import { AssetSamples } from '@tests/fixtures/asset-samples.ts'

Deno.test('Asset Type scope keeps inactive distinct from deletion and trims labels', () => {
  const state = createAssetTypeState({ ...AssetSamples.types[0], active: false })
  state.setLabel('  Retired catalog entry  ')
  const draft = assetTypeDraft(state)
  assertEquals(draft, { label: 'Retired catalog entry', active: false })
  assertEquals(scopes.AssetTypes.detail.toUpdate(AssetSamples.types[0].id, draft), {
    id: AssetSamples.types[0].id,
    label: 'Retired catalog entry',
    active: false
  })
})

Deno.test('Asset creation has no silently assigned type and projects before validation', () => {
  const state = createAssetState()
  assertEquals(state.type(), '')
  assertEquals(assetDraft(state).type, '')
  assertEquals(state.storedType, undefined)
})

Deno.test('Asset edits retain the original reference independently of editable selection', () => {
  const source = { ...AssetSamples.drone, notes: [note()] }
  const state = createAssetState(source)
  state.setType(id())
  assertEquals(state.storedType, source.type)
  assertEquals(source.type, AssetSamples.drone.type)
  source.notes[0].content = 'Changed source'
  assertEquals(state.notes()[0].content, 'Original note')
  const incoming = [note()]
  state.setNotes(incoming)
  incoming[0].content = 'Changed accepted input'
  const projected = assetDraft(state)
  projected.notes[0].content = 'Changed projection'
  assertEquals(state.notes()[0].content, 'Original note')
})

Deno.test('Asset projection trims text and explicitly clears optional fields', () => {
  const state = createAssetState(AssetSamples.drone)
  state.setLabel('  Aircraft  ')
  state.setDescription('   ')
  state.setSerialNumber('  Serial  ')
  const draft = assetDraft(state)
  assertEquals(draft.label, 'Aircraft')
  assertEquals(draft.description, undefined)
  assertEquals(draft.serialNumber, 'Serial')
  assertEquals(scopes.Assets.detail.toUpdate(AssetSamples.drone.id, draft).description, null)
  assertEquals(state.label(), '  Aircraft  ')
})

const note = (): Note => ({
  createdAt: toWhen('2026-10-27T12:00:00Z'),
  content: 'Original note',
  visibility: 'internal',
  attachments: []
})
