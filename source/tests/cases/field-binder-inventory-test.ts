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
  upload: { source: 'upload' as const, kind: 'document' as const }
}
const Created = toWhen('2026-11-11T12:00:00Z')
const Later = toWhen('2026-11-11T12:00:00.001Z')

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
      { upload: undefined },
      { upload: { source: 'fax', kind: 'document' } },
      { upload: { source: 'upload', kind: 'spreadsheet' } },
      { upload: { source: 'upload', kind: 'document', url: 'https://example.test/manual.pdf' } },
      { upload: { source: 'url', kind: 'document', url: 'javascript:alert(1)' } },
      { upload: { source: 'url', kind: 'document', url: 'ftp://example.test/manual' } },
      { upload: { source: 'url', kind: 'document' } },
      { upload: { source: 'library', kind: 'document' } },
      { upload: { source: 'library', kind: 'document', record: { topic: 'Jobs', id: id() } } },
      { upload: { source: 'upload', kind: 'document', record: { topic: 'Assets', id: id() } } }
    ]
  ) assertThrows(() => FieldBinderMetadata.readEntry({ ...Entry, ...patch }), ValidatorError)
  const url = { source: 'url' as const, kind: 'document' as const, url: 'https://example.test/m.pdf' }
  assertEquals(FieldBinderMetadata.readEntry({ ...Entry, upload: url }).upload, url)
  const library = {
    source: 'library' as const,
    kind: 'photo' as const,
    record: { topic: 'Chemicals' as const, id: id() }
  }
  assertEquals(FieldBinderMetadata.readEntry({ ...Entry, upload: library }).upload, library)
  const minted = id()
  assertEquals(
    DocumentAddresses.id(FieldBinderMetadata.placed(minted)).document,
    minted
  )
  assertEquals(FieldBinderMetadata.id(FieldBinderMetadata.placed(minted)).document, minted)
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
  const earlier = { id: document, name: 'inventory.json', createdAt: Created, count: 1 }
  const later = { ...earlier, createdAt: Later }
  assertEquals(FieldBinderMetadata.compare(earlier, later) < 0, true)
  assertEquals(FieldBinderMetadata.compare(earlier, earlier), 0)
})
