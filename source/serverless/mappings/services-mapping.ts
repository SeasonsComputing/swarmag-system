/**
 * Mappers for converting between Supabase service rows and domain Services.
 */

import type { Service } from '@domain/abstractions/service.ts'
import { isIdArray } from '@serverless-lib/db-binding.ts'
import type { Dictionary } from '@utils'

/**
 * Type guard for supported service categories.
 * @param value - Potential category value.
 * @returns True when the value matches a known category.
 */
export const isServiceCategory = (value: unknown): value is Service['category'] =>
  value === 'aerial-drone-services' || value === 'ground-machinery-services'

/** Map a domain Service into a Supabase row shape. */
export const serviceToRow = (service: Service) => ({
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
 * Convert a Supabase row into a Service domain model.
 * Payload is truth - if present, use it directly.
 * Falls back to column mapping for legacy records.
 * @param row - The database row to convert.
 * @returns The mapped Service object.
 * @throws Error if required fields are missing.
 */
export const rowToService = (row: unknown): Service => {
  if (!row || typeof row !== 'object') {
    throw new Error('Service row is missing required fields')
  }

  const record = row as Dictionary

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string'
      && typeof payload.name === 'string'
      && typeof payload.sku === 'string'
      && isServiceCategory(payload.category)
      && isIdArray(payload.requiredAssetTypes)
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

  if (
    !id
    || !name
    || !sku
    || !isServiceCategory(category)
    || !isIdArray(requiredAssetTypes)
  ) {
    throw new Error('Service row is missing required fields')
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
