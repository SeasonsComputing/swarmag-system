/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage contract tests                                                       ║
║ Validate target roots, private limits, uniqueness, and absent targets.       ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { readStorageContract, readStorageContractValue } from '@devops/scripts/storage-contract.ts'
import { assertEquals, assertRejects, assertThrows } from '@std/assert'

Deno.test('target contracts validate all bindings before use', async () => {
  for (const target of ['local', 'stage']) {
    const contract = await readStorageContract(target)
    assertEquals(contract.stores.attachments, {
      root: 'swarmag-attachments',
      fileSizeLimit: 52428800,
      public: false
    })
  }
  for (const target of ['dev', 'prod', '../stage']) {
    await assertRejects(() => readStorageContract(target))
  }
  const binding = { root: 'test-root', fileSizeLimit: 20, public: false }
  for (const value of [null, {}, { stores: {} }, { stores: { attachments: null } }]) {
    assertThrows(() => readStorageContractValue(value))
  }
  for (
    const patch of [
      { root: '' },
      { root: '../escape' },
      { root: 'bad/root' },
      { root: ' root' },
      { root: 'quote\'root' },
      { fileSizeLimit: 0 },
      { fileSizeLimit: 1.5 },
      { fileSizeLimit: Number.MAX_SAFE_INTEGER + 1 },
      { public: true }
    ]
  ) {
    assertThrows(() => readStorageContractValue({ stores: { attachments: { ...binding, ...patch } } }))
  }
  assertThrows(() =>
    readStorageContractValue({
      stores: {
        attachments: binding,
        fieldBinder: binding
      }
    })
  )
  const contract = readStorageContractValue({
    stores: {
      attachments: binding,
      fieldBinder: { ...binding, root: 'separate-root' }
    }
  })
  assertEquals(contract.stores.fieldBinder.root, 'separate-root')
})
