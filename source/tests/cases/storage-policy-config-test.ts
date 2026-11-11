/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Storage policy configuration tests                                           ║
║ Verify materialized physical roots and retained logical namespace grants.    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import {
  materializeStoragePolicies,
  readStorageContract,
  readStorageContractValue,
  storageBuildRoot
} from '@devops/scripts/storage-contract.ts'
import { Attachments } from '@front/api/attachments.ts'
import { assert, assertEquals, assertThrows } from '@std/assert'

Deno.test('policy roots agree with build inputs and preserve namespace grants', async () => {
  const contract = await readStorageContract('stage')
  const template = await Deno.readTextFile('source/back/storage/storage-policies.sql')
  const sql = materializeStoragePolicies(template, contract)
  const root = storageBuildRoot(contract)
  assert(sql.includes(`id = '${root}'`))
  assertEquals((sql.match(/bucket_id = 'swarmag-attachments'/g) ?? []).length, 2)
  assert(!sql.includes('{{storage.'))
  assertEquals((sql.match(/split_part\(name, '\/', 1\)/g) ?? []).length, 2)
  const namespaces = new Set(sql.match(/019a6000-0000-7000-8000-[0-9]{12}/g))
  assertEquals(namespaces, new Set(Attachments.namespaces.map(entry => entry.id)))
  assert(sql.includes('ARRAY[\'administrator\', \'sales\', \'operations\']'))
  assert(sql.includes('status = \'active\' AND deleted_at IS NULL'))
  assertThrows(() => materializeStoragePolicies('{{storage.fieldBinder.root}}', contract))
  const unsafe = readStorageContractValue({
    stores: {
      attachments: {
        root: 'safe-root',
        fileSizeLimit: 1,
        public: false
      }
    }
  })
  // The materializer quotes literals even when passed an already-typed object.
  unsafe.stores.attachments.root = 'literal\'quote'
  assertEquals(
    materializeStoragePolicies('{{storage.attachments.root}}', unsafe),
    '\'literal\'\'quote\''
  )
})
