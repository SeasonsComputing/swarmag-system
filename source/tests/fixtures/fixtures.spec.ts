import { describe, expect, it } from 'vitest'
import type { AssetStatus } from '@domain/asset'
import { isWhen } from '@utils/datetime'
import { isID } from '@utils/identifier'
import {
  assetSamples,
  assetTypeSamples,
  customerSamples,
  jobSamples,
  sharedQuestionSamples,
} from './samples'

const allowedAssetStatuses: AssetStatus[] = [
  'active',
  'maintenance',
  'retired',
  'reserved',
]

describe('fixture integrity', () => {
  it('asset fixtures respect domain constraints', () => {
    const seenAssetTypes = new Set<string>()

    for (const assetType of assetTypeSamples) {
      expect(isID(assetType.id)).toBe(true)
      expect(seenAssetTypes.has(assetType.id)).toBe(false)
      seenAssetTypes.add(assetType.id)
      expect(typeof assetType.name).toBe('string')
      expect(assetType.name.length).toBeGreaterThan(0)
    }

    for (const asset of assetSamples) {
      expect(isID(asset.id)).toBe(true)
      expect(allowedAssetStatuses).toContain(asset.status)
      expect(isID(asset.type)).toBe(true)
      expect(isWhen(asset.createdAt)).toBe(true)
      expect(isWhen(asset.updatedAt)).toBe(true)
    }
  })

  it('job assessment fixture always carries locations and timestamps', () => {
    const { assessment } = jobSamples
    expect(isID(assessment.id)).toBe(true)
    expect(isID(assessment.serviceId)).toBe(true)
    expect(isID(assessment.customerId)).toBe(true)
    if (assessment.contactId) expect(isID(assessment.contactId)).toBe(true)
    expect(Array.isArray(assessment.locations)).toBe(true)
    expect(assessment.locations.length).toBeGreaterThan(0)
    expect(isWhen(assessment.assessedAt)).toBe(true)
    expect(isWhen(assessment.createdAt)).toBe(true)
    expect(isWhen(assessment.updatedAt)).toBe(true)
  })

  it('customer fixtures keep contact linkage intact', () => {
    for (const customer of customerSamples) {
      expect(isID(customer.id)).toBe(true)
      expect(customer.contacts.length).toBeGreaterThan(0)
      const primaryContactIds = customer.contacts.map((contact) => contact.id)
      expect(primaryContactIds).toContain(customer.primaryContactId)
      expect(customer.sites.every((site) => site.customerId === customer.id)).toBe(true)
      expect(customer.sites.every((site) => isID(site.id))).toBe(true)
      expect(customer.contacts.every((contact) => isID(contact.id))).toBe(true)
      expect(isWhen(customer.createdAt)).toBe(true)
      expect(isWhen(customer.updatedAt)).toBe(true)
    }
  })

  it('shared questions include labels and values', () => {
    for (const question of sharedQuestionSamples) {
      expect(isID(question.id)).toBe(true)
      expect(question.prompt.length).toBeGreaterThan(0)
      if (question.options) {
        expect(
          question.options.every((option) => option.value && option.label)
        ).toBe(true)
      }
    }
  })
})
