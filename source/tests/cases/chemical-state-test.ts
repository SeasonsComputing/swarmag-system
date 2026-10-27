/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical draft tests                                                         ║
║ Verify draft ownership, normalization, and whole-hour form constraints.      ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { id, instantiable } from '@core/std'
import type { Chemical } from '@domain/abstractions/chemical.ts'
import type { Note } from '@domain/abstractions/common.ts'
import { scopes } from '@front/api/scopes.ts'
import {
  chemicalDraft,
  createChemicalState,
  reEntryIntervalError
} from '@front/app-admin/chemicals/chemical-state.ts'
import { assert, assertEquals } from '@std/assert'

Deno.test('Chemical scope defaults new labels and excludes existing labels from all updates', () => {
  const source = chemical()
  const state = createChemicalState(source)
  state.setName('  Updated chemical  ')
  const draft = chemicalDraft(state)
  assertEquals('labels' in draft, false)
  assertEquals(scopes.Chemicals.detail.toCreate(draft).labels, [])
  const richerDraft = { ...draft, labels: [] }
  const patch = scopes.Chemicals.detail.toUpdate(source.id, richerDraft)
  assertEquals('labels' in patch, false)
  assertEquals('labels' in scopes.Chemicals.detail.adapter.fromDomain(patch), false)
  assertEquals(source.labels, [{ url: 'https://example.com/label.pdf', description: 'Original label' }])
})

Deno.test('Chemical state isolates source, accepted notes, and projections', () => {
  const source = chemical()
  const state = createChemicalState(source)
  source.notes[0].content = 'Changed source'
  assertEquals(state.notes()[0].content, 'Original note')
  const incoming = [note()]
  state.setNotes(incoming)
  incoming[0].content = 'Changed accepted input'
  const projected = chemicalDraft(state)
  projected.notes[0].content = 'Changed projection'
  assertEquals(state.notes()[0].content, 'Original note')
})

Deno.test('Chemical optional clearing preserves false and external reference text semantics', () => {
  const state = createChemicalState(chemical())
  state.setRestrictedUse(false)
  state.setEpaNumber(' ')
  state.setStorageLocation(' ')
  state.setSdsUrl('  external reference  ')
  state.setReEntryIntervalHours(undefined)
  const patch = scopes.Chemicals.detail.toUpdate(id(), chemicalDraft(state))
  assertEquals(patch.epaNumber, null)
  assertEquals(patch.storageLocation, null)
  assertEquals(patch.reEntryIntervalHours, null)
  assertEquals(patch.restrictedUse, false)
  assertEquals(patch.sdsUrl, 'external reference')
})

Deno.test('Re-entry form accepts blank or positive whole hours and rejects invalid numbers', () => {
  for (const value of [undefined, 1, 12, 48]) assertEquals(reEntryIntervalError(value), null)
  for (const value of [0, -1, 0.5, 12.5, NaN, Infinity, -Infinity]) {
    assert(reEntryIntervalError(value) !== null)
  }
})

const note = (): Note => ({
  createdAt: '2026-10-27T12:00:00Z',
  content: 'Original note',
  visibility: 'internal',
  attachments: []
})

const chemical = (): Chemical =>
  instantiable<Chemical>({
    name: 'Reference chemical',
    usage: 'herbicide',
    signalWord: 'caution',
    restrictedUse: true,
    reEntryIntervalHours: 24,
    epaNumber: 'ABC',
    storageLocation: 'Store',
    sdsUrl: 'https://example.com/sds.pdf',
    notes: [note()],
    labels: [{ url: 'https://example.com/label.pdf', description: 'Original label' }]
  })
