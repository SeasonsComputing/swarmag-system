/**
 * Fixture integrity checks for shared sample data.
 */

import { isId, isWhen, StringSet } from '@core/std'
import type { AssetStatus } from '@domain/abstractions/asset.ts'
import { assert, assertEquals } from '@std/assert'
import {
  assetSamples,
  assetTypeSamples,
  customerSamples,
  customerUserSamples,
  jobSamples,
  sharedQuestionSamples
} from './samples.ts'

const allowedAssetStatuses: AssetStatus[] = [
  'active',
  'maintenance',
  'retired',
  'reserved'
]

Deno.test('fixture integrity: asset fixtures respect domain constraints', () => {
  const seenAssetTypes = new StringSet()

  for (const assetType of assetTypeSamples) {
    assert(isId(assetType.id))
    assert(!seenAssetTypes.has(assetType.id))
    seenAssetTypes.add(assetType.id)
    assertEquals(typeof assetType.label, 'string')
    assert(assetType.label.length > 0)
    assertEquals(typeof assetType.active, 'boolean')
    assert(isWhen(assetType.createdAt))
    assert(isWhen(assetType.updatedAt))
  }

  for (const asset of assetSamples) {
    assert(isId(asset.id))
    assert(allowedAssetStatuses.includes(asset.status))
    assert(isId(asset.type))
    assert(isWhen(asset.createdAt))
    assert(isWhen(asset.updatedAt))
  }
})

Deno.test('fixture integrity: job assessment fixture always carries locations and timestamps', () => {
  const { assessment } = jobSamples
  assert(isId(assessment.id))
  assert(isId(assessment.jobId))
  assert(isId(assessment.assessorId))
  assert(Array.isArray(assessment.locations))
  assert(assessment.locations.length > 0)
  assert(isWhen(assessment.createdAt))
  assert(isWhen(assessment.updatedAt))
})

Deno.test('fixture integrity: customer fixtures keep primary contact composition intact', () => {
  for (const customer of customerSamples) {
    assert(isId(customer.id))
    assert(customer.primaryContact.filter(Boolean).length === 1)
    assert(customer.sites.filter(Boolean).every(site => site!.customerId === customer.id))
    assert(isWhen(customer.createdAt))
    assert(isWhen(customer.updatedAt))
  }
})

Deno.test('fixture integrity: customer contact junction fixtures carry valid keys', () => {
  const customerIds = new StringSet(customerSamples.map(customer => customer.id))

  for (const contact of customerUserSamples) {
    assert(isId(contact.customerId))
    assert(isId(contact.userId))
    assert(customerIds.has(contact.customerId))
  }
})

Deno.test('fixture integrity: shared questions include labels and values', () => {
  for (const question of sharedQuestionSamples) {
    assert(isId(question.id))
    assert(question.prompt.length > 0)
    if (question.type === 'single-select' || question.type === 'multi-select') {
      assert(
        question.options.filter(Boolean).every((
          option: { value: string; label?: string }
        ) => option.value && option.label)
      )
    }
  }
})
