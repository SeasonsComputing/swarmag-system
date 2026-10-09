/** Draft copying isolates arbitrary nesting from plain values and Solid stores. */

import { createStore } from '@solid-js/store'
import { assertEquals, assertNotStrictEquals } from '@std/assert'
import { copyDraft } from '@ux/shell/workbench/workbench-draft.ts'

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
