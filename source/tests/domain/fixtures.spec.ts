import { describe, expect, it } from 'vitest'
import type { AssetStatus } from '@domain/asset'
import { isWhen } from '@utils/datetime'
import {
  assetSamples,
  assetTypeSamples,
  customerSamples,
  jobSamples,
  sharedQuestionSamples,
} from '../fixtures/samples'

const allowedAssetStatuses: AssetStatus[] = [
  'active',
  'maintenance',
  'retired',
  'reserved',
]

const isIso = (value: string): boolean => isWhen(value)

describe('fixture integrity', () => {
  it('asset fixtures respect domain constraints', () => {
    const seenAssetTypes = new Set<string>()

    for (const assetType of assetTypeSamples) {
      expect(typeof assetType.id).toBe('string')
      expect(assetType.id.length).toBeGreaterThan(0)
      expect(seenAssetTypes.has(assetType.id)).toBe(false)
      seenAssetTypes.add(assetType.id)
      expect(typeof assetType.name).toBe('string')
      expect(assetType.name.length).toBeGreaterThan(0)
    }

    for (const asset of assetSamples) {
      expect(typeof asset.id).toBe('string')
      expect(asset.id.length).toBeGreaterThan(0)
      expect(allowedAssetStatuses).toContain(asset.status)
      expect(typeof asset.type).toBe('string')
      expect(asset.type.length).toBeGreaterThan(0)
      expect(isIso(asset.createdAt)).toBe(true)
      expect(isIso(asset.updatedAt)).toBe(true)
    }
  })

  it('job assessment fixture always carries locations and timestamps', () => {
    const { assessment } = jobSamples
    expect(Array.isArray(assessment.locations)).toBe(true)
    expect(assessment.locations.length).toBeGreaterThan(0)
    expect(isIso(assessment.assessedAt)).toBe(true)
    expect(isIso(assessment.createdAt)).toBe(true)
    expect(isIso(assessment.updatedAt)).toBe(true)
  })

  it('customer fixtures keep contact linkage intact', () => {
    for (const customer of customerSamples) {
      expect(customer.contacts.length).toBeGreaterThan(0)
      const primaryContactIds = customer.contacts.map((contact) => contact.id)
      expect(primaryContactIds).toContain(customer.primaryContactId)
      expect(customer.sites.every((site) => site.customerId === customer.id)).toBe(true)
      expect(isIso(customer.createdAt)).toBe(true)
      expect(isIso(customer.updatedAt)).toBe(true)
    }
  })

  it('shared questions include labels and values', () => {
    for (const question of sharedQuestionSamples) {
      expect(question.prompt.length).toBeGreaterThan(0)
      if (question.options) {
        expect(
          question.options.every((option) => option.value && option.label)
        ).toBe(true)
      }
    }
  })
})
