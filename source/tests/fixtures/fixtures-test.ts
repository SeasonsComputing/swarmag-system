/**
 * Fixture integrity checks for shared sample data.
 */

import { isID, isWhen } from '@core-std'
import type { AssetStatus } from '@domain/abstractions/asset.ts'
import { assert, assertEquals } from '@std/assert'
import {
  assetSamples,
  assetTypeSamples,
  customerSamples,
  jobSamples,
  sharedQuestionSamples
} from '@tests-fixtures/samples.ts'

const allowedAssetStatuses: AssetStatus[] = ['active', 'maintenance', 'retired', 'reserved']

Deno.test('fixture integrity: asset fixtures respect domain constraints', () => {
  const seenAssetTypes = new Set<string>()

  for (const assetType of assetTypeSamples) {
    assert(isID(assetType.id))
    assert(!seenAssetTypes.has(assetType.id))
    seenAssetTypes.add(assetType.id)
    assertEquals(typeof assetType.label, 'string')
    assert(assetType.label.length > 0)
    assertEquals(typeof assetType.active, 'boolean')
    assert(isWhen(assetType.createdAt))
    assert(isWhen(assetType.updatedAt))
  }

  for (const asset of assetSamples) {
    assert(isID(asset.id))
    assert(allowedAssetStatuses.includes(asset.status))
    assert(isID(asset.type))
    assert(isWhen(asset.createdAt))
    assert(isWhen(asset.updatedAt))
  }
})

Deno.test('fixture integrity: job assessment fixture always carries locations and timestamps', () => {
  const { assessment } = jobSamples
  assert(isID(assessment.id))
  assert(isID(assessment.serviceId))
  assert(isID(assessment.customerId))
  if (assessment.contactId) assert(isID(assessment.contactId))
  assert(Array.isArray(assessment.locations))
  assert(assessment.locations.length > 0)
  assert(isWhen(assessment.assessedAt))
  assert(isWhen(assessment.createdAt))
  assert(isWhen(assessment.updatedAt))
})

Deno.test('fixture integrity: customer fixtures keep contact linkage intact', () => {
  for (const customer of customerSamples) {
    assert(isID(customer.id))
    assert(customer.contacts.length > 0)
    const primaryContactIds = customer.contacts.map(contact => contact.id)
    if (customer.primaryContactId) {
      assert(primaryContactIds.includes(customer.primaryContactId))
    }
    assert(customer.sites.every(site => site.customerId === customer.id))
    assert(customer.sites.every(site => isID(site.id)))
    assert(customer.contacts.every(contact => isID(contact.id)))
    assert(isWhen(customer.createdAt))
    assert(isWhen(customer.updatedAt))
  }
})

Deno.test('fixture integrity: shared questions include labels and values', () => {
  for (const question of sharedQuestionSamples) {
    assert(isID(question.id))
    assert(question.prompt.length > 0)
    if (question.options) {
      assert(question.options.every(option => option.value && option.label))
    }
  }
})
