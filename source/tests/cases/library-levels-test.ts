/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Library levels tests                                                         ║
║ Verify topic navigation, ordered records, and document activation.           ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import '@tests/config/test-config.ts'
import { id, instantiable, toWhen } from '@core/std'
import type { Id } from '@core/std'
import type { Asset } from '@domain/abstractions/asset.ts'
import type { Chemical } from '@domain/abstractions/chemical.ts'
import type { Attachment, Note } from '@domain/abstractions/common.ts'
import type { Service } from '@domain/abstractions/service.ts'
import { api } from '@front/api/api.ts'
import { LIBRARY_TOPICS } from '@front/api/attachments.ts'
import type { LibraryTopic } from '@front/api/attachments.ts'
import { LibraryLevels } from '@front/app/shell/retrieval/library-levels.ts'
import { assert, assertEquals } from '@std/assert'

Deno.test('Library levels order topics and records, flatten notes, and activate documents', async () => {
  const originalAssets = api.Assets.list
  const originalChemicals = api.Chemicals.list
  const originalServices = api.Services.list
  const timestamp = toWhen('2026-11-14T12:00:00Z')
  const attachments: Attachment[] = [
    {
      filename: 'Manual.pdf',
      documentAddress: 'manual',
      contentType: 'application/pdf',
      kind: 'document',
      uploadedAt: timestamp
    },
    {
      filename: 'Site.jpg',
      documentAddress: 'site',
      contentType: 'image/jpeg',
      kind: 'photo',
      uploadedAt: timestamp
    }
  ]
  const notes: Note[] = [
    { content: 'First', createdAt: timestamp, attachments: [attachments[0]] },
    { content: 'Empty', createdAt: timestamp, attachments: [] },
    { content: 'Second', createdAt: timestamp, attachments: [attachments[1]] }
  ]
  const asset = instantiable<Asset>({ type: id(), label: 'Alpha', status: 'active', notes })
  const chemical = instantiable<Chemical>({
    name: 'Alpha',
    usage: 'herbicide',
    signalWord: 'caution',
    restrictedUse: false,
    labels: [],
    notes
  })
  const service = instantiable<Service>({
    name: 'Alpha',
    sku: 'A',
    category: 'aerial-drone-services',
    facets: [],
    notes
  })
  const CALLS: { attachment: Attachment; record: { topic: LibraryTopic; id: Id } }[] = []
  const root = LibraryLevels.root((attachment, record) => CALLS.push({ attachment, record }))
  api.Assets.list = () =>
    Promise.resolve({
      data: [{ ...asset, id: id(), label: 'Zulu', notes: [] }, asset],
      cursor: null,
      hasMore: false
    })
  api.Chemicals.list = () =>
    Promise.resolve({
      data: [{ ...chemical, id: id(), name: 'Zulu', notes: [] }, chemical],
      cursor: null,
      hasMore: false
    })
  api.Services.list = () =>
    Promise.resolve({
      data: [{ ...service, id: id(), name: 'Zulu', notes: [] }, service],
      cursor: null,
      hasMore: false
    })
  try {
    assertEquals(root.column, 'Topic')
    const topics = await root.load()
    assertEquals(topics.map(row => row.label), [...LIBRARY_TOPICS])
    for (const topic of topics) {
      assert('open' in topic)
      const level = topic.open()
      const Expected = {
        Assets: { column: 'Asset', id: asset.id },
        Chemicals: { column: 'Chemical', id: chemical.id },
        Services: { column: 'Service', id: service.id }
      }
      const name = LIBRARY_TOPICS.find(name => name === topic.label)!
      assertEquals(level.column, Expected[name].column)
      const records = await level.load()
      assertEquals(records.map(row => row.label), ['Alpha', 'Zulu'])
      assert('open' in records[0])
      const documents = records[0].open()
      assertEquals([documents.column, documents.detail, documents.empty], [
        'Document',
        'Kind',
        'This record has no documents.'
      ])
      const rows = await documents.load()
      assertEquals(rows.map(row => [row.label, row.detail]), [['Manual.pdf', 'Document'], [
        'Site.jpg',
        'Photo'
      ]])
      assertEquals(CALLS.length, 0)
      for (const row of rows) {
        assert('choose' in row)
        row.choose()
      }
      assertEquals(
        CALLS,
        attachments.map(attachment => ({ attachment, record: { topic: name, id: Expected[name].id } }))
      )
      CALLS.length = 0
      assert('open' in records[1])
      assertEquals(await records[1].open().load(), [])
    }
    api.Assets.list = () => Promise.resolve({ data: [], cursor: null, hasMore: false })
    const assets = topics.find(row => row.label === 'Assets')!
    assert('open' in assets)
    assertEquals(await assets.open().load(), [])
  } finally {
    api.Assets.list = originalAssets
    api.Chemicals.list = originalChemicals
    api.Services.list = originalServices
  }
})
