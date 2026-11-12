/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder inventory tests                                                 ║
║ Validate metadata boundaries, identity references, and deterministic order.  ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { id, toWhen, ValidatorError } from '@core/std'
import { DocumentAddresses } from '@core/stdx'
import { FieldBinderMetadata } from '@front/api/field-binder-inventory.ts'
import { assertEquals, assertThrows } from '@std/assert'

const REFERENCE =
  `id:${FieldBinderMetadata.catalog.namespace.id}/id:${FieldBinderMetadata.catalog.bucket.id}/id:${id()}`
const Entry = {
  id: id(),
  description: 'Safety data sheet',
  documentAddress: REFERENCE,
  createdAt: toWhen('2026-11-11T12:00:00Z'),
  updatedAt: toWhen('2026-11-11T12:00:00.001Z')
}

Deno.test('Binder inventory validates membership, references, and schema versions', () => {
  assertEquals(FieldBinderMetadata.readEntry(Entry), Entry)
  assertEquals(FieldBinderMetadata.readInventory({ schemaVersion: 1, entries: [] }), {
    schemaVersion: 1,
    entries: []
  })
  assertEquals(FieldBinderMetadata.readInventory({ schemaVersion: 1, entries: [Entry] }).entries, [
    Entry
  ])
  assertThrows(() => FieldBinderMetadata.readJson('{', 'inventory'), ValidatorError, 'malformed')
  assertThrows(
    () => FieldBinderMetadata.readInventory({ schemaVersion: 2, entries: [] }),
    ValidatorError,
    'version'
  )
  assertThrows(
    () => FieldBinderMetadata.readInventory({ schemaVersion: 1, entries: [Entry, Entry] }),
    ValidatorError,
    'duplicate'
  )
  for (
    const patch of [
      { id: 'invalid' },
      { description: '' },
      { documentAddress: 'Binder/files/manual.pdf' },
      { createdAt: 'yesterday' },
      { updatedAt: '2026-11-10T12:00:00Z' },
      { url: 'javascript:alert(1)' },
      { url: 'ftp://example.test/manual' }
    ]
  ) assertThrows(() => FieldBinderMetadata.readEntry({ ...Entry, ...patch }), ValidatorError)
  assertEquals(
    FieldBinderMetadata.readEntry({ ...Entry, url: 'https://example.test/manual.pdf' }).url,
    'https://example.test/manual.pdf'
  )
})

Deno.test('Binder status preserves source identity and candidates sort by actual time then UUID', () => {
  const status = {
    schemaVersion: 1,
    inventoryAddress: REFERENCE,
    sourcePublication: REFERENCE,
    syncedAt: toWhen('2026-11-11T12:00:01Z')
  }
  assertEquals(FieldBinderMetadata.readStatus(status), status)
  assertThrows(
    () =>
      FieldBinderMetadata.readStatus({
        ...status,
        sourcePublication: `id:${id()}/id:${id()}/id:${id()}`
      }),
    ValidatorError
  )
  assertThrows(() => FieldBinderMetadata.readStatus({ ...status, schemaVersion: 2 }), ValidatorError)
  const document = DocumentAddresses.id(REFERENCE)
  assertEquals(FieldBinderMetadata.address(document), REFERENCE)
  const earlier = { id: document, name: 'inventory.json', createdAt: Entry.createdAt, count: 1 }
  const later = { ...earlier, createdAt: Entry.updatedAt }
  assertEquals(FieldBinderMetadata.compare(earlier, later) < 0, true)
  assertEquals(FieldBinderMetadata.compare(earlier, earlier), 0)
})
