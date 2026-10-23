/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Workbench draft tests                                                        ║
║ Verify draft copying, store isolation, and baseline comparisons.             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Draft services isolate plain values and Solid stores and compare baseline snapshots.
*/

import { createStore } from '@solid-js/store'
import { assertEquals, assertNotStrictEquals } from '@std/assert'
import { copyDraft, isDraftChanged } from '@ux/shell/workbench/workbench-draft.ts'

Deno.test('Draft copy isolates nested objects and arrays in both directions', () => {
  const source = { entries: [{ details: { labels: ['Original'], optional: undefined } }] }
  const copied = copyDraft(source)
  assertEquals(copied, source)
  assertNotStrictEquals(copied, source)
  assertNotStrictEquals(copied.entries, source.entries)
  assertNotStrictEquals(copied.entries[0], source.entries[0])
  assertNotStrictEquals(copied.entries[0].details, source.entries[0].details)
  assertNotStrictEquals(copied.entries[0].details.labels, source.entries[0].details.labels)
  copied.entries[0].details.labels.push('Copy edit')
  source.entries[0].details.labels[0] = 'Source edit'
  assertEquals(copied.entries[0].details.labels, ['Original', 'Copy edit'])
  assertEquals(source.entries[0].details.labels, ['Source edit'])
  assertEquals(Object.hasOwn(copied.entries[0].details, 'optional'), true)
})

Deno.test('Draft copy accepts store data and isolates its nested values', () => {
  const [store, setStore] = createStore({ entries: [{ details: { labels: ['Original'] } }] })
  const copied = copyDraft(store)
  copied.entries[0].details.labels.push('Copy edit')
  assertEquals(store.entries[0].details.labels, ['Original'])
  setStore('entries', 0, 'details', 'labels', 0, 'Store edit')
  assertEquals(copied.entries[0].details.labels, ['Original', 'Copy edit'])
  assertEquals(store.entries[0].details.labels, ['Store edit'])
})

Deno.test('Draft comparison detects nested object edits and clears after reverting', () => {
  const draft = { entries: [{ details: { label: 'Original' } }] }
  const baseline = copyDraft(draft)
  assertEquals(isDraftChanged(draft, baseline), false)
  draft.entries[0].details.label = 'Edited'
  assertEquals(isDraftChanged(draft, baseline), true)
  draft.entries[0].details.label = 'Original'
  assertEquals(isDraftChanged(draft, baseline), false)
})

Deno.test('Draft comparison detects nested array edits and clears after reverting', () => {
  const draft = { details: { labels: ['Original'] } }
  const baseline = copyDraft(draft)
  draft.details.labels.push('Added')
  assertEquals(isDraftChanged(draft, baseline), true)
  draft.details.labels.pop()
  assertEquals(isDraftChanged(draft, baseline), false)
})

Deno.test('Draft comparison reads current Solid store values against a copied baseline', () => {
  const [draft, setDraft] = createStore({ entries: [{ label: 'Original' }] })
  const baseline = copyDraft(draft)
  assertEquals(isDraftChanged(draft, baseline), false)
  setDraft('entries', 0, 'label', 'Edited')
  assertEquals(isDraftChanged(draft, baseline), true)
  setDraft('entries', 0, 'label', 'Original')
  assertEquals(isDraftChanged(draft, baseline), false)
})

Deno.test('Draft comparison retains JSON property insertion order', () => {
  const baseline = { label: 'Original', enabled: true }
  const draft = { enabled: true, label: 'Original' }
  assertEquals(isDraftChanged(draft, baseline), true)
})

Deno.test('Draft comparison treats absent and undefined object properties alike', () => {
  const baseline = { label: 'Original' }
  const draft = { label: 'Original', optional: undefined }
  assertEquals(isDraftChanged(draft, baseline), false)
  assertEquals(isDraftChanged(baseline, draft), false)
})
