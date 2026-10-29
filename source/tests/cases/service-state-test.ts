/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Service draft tests                                                          ║
║ Verify scope ownership, membership baselines, and isolated structured data.  ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { id, instantiable, toWhen } from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'
import type { Service } from '@domain/abstractions/service.ts'
import { scopes } from '@front/api/scopes.ts'
import { createServiceState, serviceDraft } from '@front/app-admin/services/service-state.ts'
import type { ServiceRecord } from '@front/app-admin/services/service-state.ts'
import { assertEquals } from '@std/assert'
import { copyDraft, isDraftChanged } from '@ux/shell/workbench/workbench-draft.ts'

Deno.test('Service scope defaults facets and never writes facets or membership on update', () => {
  const source = service()
  const state = createServiceState(source)
  state.setName('  Renamed  ')
  state.setSku('  SKU-2  ')
  state.setDescription(' ')
  const draft = { ...serviceDraft(state), category: source.category }
  const scope = scopes.Services.detail
  const create = scope.toCreate(draft)
  assertEquals(create.facets, [])
  assertEquals('requiredAssetTypes' in create, false)
  const richerDraft = { ...draft, facets: [] }
  const patch = scope.toUpdate(source.id, richerDraft)
  assertEquals(patch.name, 'Renamed')
  assertEquals(patch.sku, 'SKU-2')
  assertEquals(patch.description, null)
  assertEquals('facets' in patch, false)
  assertEquals('requiredAssetTypes' in patch, false)
  const storage = scope.adapter.fromDomain(patch)
  assertEquals('facets' in storage, false)
  assertEquals('required_asset_types' in storage, false)
  assertEquals(source.facets, ['work:aerial'])
})

Deno.test('Service category starts unchosen and opening snapshots remain valid', () => {
  const state = createServiceState()
  assertEquals(state.category(), undefined)
  const baseline = copyDraft(serviceDraft(state))
  assertEquals(baseline.category, undefined)
  assertEquals(isDraftChanged(serviceDraft(state), baseline), false)
  state.setCategory('ground-machinery-services')
  assertEquals(serviceDraft(state).category, 'ground-machinery-services')
  assertEquals(isDraftChanged(serviceDraft(state), baseline), true)
  const source = service()
  assertEquals(createServiceState(source).category(), source.category)
})

Deno.test('Service membership is in the opening baseline and detects only set changes', () => {
  const source = service()
  const state = createServiceState(source)
  const baseline = copyDraft(serviceDraft(state))
  assertEquals(baseline.requiredAssetTypes, [...source.requiredAssetTypes].sort())
  assertEquals(isDraftChanged(serviceDraft(state), baseline), false)
  state.setRequiredAssetTypes([...source.requiredAssetTypes].reverse())
  assertEquals(isDraftChanged(serviceDraft(state), baseline), false)
  state.setRequiredAssetTypes([])
  assertEquals(isDraftChanged(serviceDraft(state), baseline), true)
  assertEquals(state.storedAssetTypes, source.requiredAssetTypes)
  state.setRequiredAssetTypes(source.requiredAssetTypes)
  assertEquals(isDraftChanged(serviceDraft(state), baseline), false)
})

Deno.test('Service drafts copy source, accepted values, and projected arrays', () => {
  const source = service()
  const state = createServiceState(source)
  const originalPartners = [...source.requiredAssetTypes]
  source.notes[0].content = 'Changed source'
  source.requiredAssetTypes.length = 0
  assertEquals(state.notes()[0].content, 'Original note')
  assertEquals(state.requiredAssetTypes(), originalPartners)
  assertEquals(state.storedAssetTypes, originalPartners)
  const incoming = [note()]
  const members = [id()]
  state.setNotes(incoming)
  state.setRequiredAssetTypes(members)
  incoming[0].content = 'Changed accepted note'
  members.length = 0
  const projected = serviceDraft(state)
  projected.notes[0].content = 'Changed projection'
  projected.requiredAssetTypes.length = 0
  assertEquals(state.notes()[0].content, 'Original note')
  assertEquals(state.requiredAssetTypes().length, 1)
})

const note = (): Note => ({
  createdAt: toWhen('2026-10-28T12:00:00Z'),
  content: 'Original note',
  visibility: 'internal',
  attachments: []
})

const service = (): ServiceRecord => ({
  ...instantiable<Service>({
    name: 'Reference service',
    sku: 'SKU-1',
    category: 'aerial-drone-services' as const,
    description: 'Description',
    facets: ['work:aerial'],
    notes: [note()]
  }),
  requiredAssetTypes: [id(), id()]
})
