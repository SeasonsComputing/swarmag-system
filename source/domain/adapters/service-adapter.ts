/**
 * Mappers for converting between Supabase service rows and domain Services.
 */

import type { Dictionary } from '@core-std'
import type { Service } from '@domain/abstractions/service.ts'
import { isIdArray } from '@domain/validators/helper-validator.ts'

/**
 * Type guard for supported service categories.
 * @param value - Potential category value.
 * @returns True when the value matches a known category.
 */
export const isServiceCategory = (value: unknown): value is Service['category'] =>
  value === 'aerial-drone-services' || value === 'ground-machinery-services'

/** Map a domain Service into a Dictionary shape. */
export const fromService = (service: Service): Dictionary => ({
  id: service.id,
  name: service.name,
  sku: service.sku,
  description: service.description ?? null,
  category: service.category,
  required_asset_types: service.requiredAssetTypes,
  notes: service.notes ?? null,
  created_at: service.createdAt,
  updated_at: service.updatedAt,
  payload: service
})

/**
 * Convert a Dictionary into a Service domain model.
 * Payload is truth - if present, use it directly.
 * Falls back to column mapping for legacy records.
 * @param dict - The dictionary to convert.
 * @returns The mapped Service object.
 * @throws Error if required fields are missing.
 */
export const toService = (record: Dictionary): Service => {
  if (!record || typeof record !== 'object') {
    throw new Error('Service dictionary is missing required fields')
  }

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string' && typeof payload.name === 'string' && typeof payload
          .sku === 'string'
      && isServiceCategory(payload.category) && isIdArray(payload.requiredAssetTypes)
    ) {
      return payload as unknown as Service
    }
  }

  // Legacy fallback - map from columns
  const id = record.id as string
  const name = record.name as string
  const sku = record.sku as string
  const category = record.category
  const requiredAssetTypes = record.required_asset_types ?? record.requiredAssetTypes

  if (!id || !name || !sku || !isServiceCategory(category) || !isIdArray(requiredAssetTypes)) {
    throw new Error('Service dictionary is missing required fields')
  }

  return {
    id,
    name,
    sku,
    description: (record.description ?? undefined) as string | undefined,
    category,
    requiredAssetTypes,
    notes: Array.isArray(record.notes) ? record.notes : undefined,
    createdAt: (record.created_at ?? record.createdAt) as string,
    updatedAt: (record.updated_at ?? record.updatedAt) as string
  }
}
