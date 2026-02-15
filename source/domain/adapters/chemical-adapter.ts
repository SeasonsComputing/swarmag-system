/**
 * Mappers for converting between Supabase chemical rows and domain Chemicals.
 */

import type { Dictionary } from '@core-std'
import type { Chemical } from '@domain/abstractions/chemical.ts'

/**
 * Type guard for chemical usage.
 * @param value - Potential usage value.
 * @returns True when the value matches a known usage.
 */
export const isChemicalUsage = (value: unknown): value is Chemical['usage'] =>
  value === 'herbicide'
  || value === 'pesticide'
  || value === 'fertilizer'
  || value === 'fungicide'
  || value === 'adjuvant'

/**
 * Type guard for chemical signal word.
 * @param value - Potential signal word value.
 * @returns True when the value matches a known signal word.
 */
export const isSignalWord = (value: unknown): value is Chemical['signalWord'] =>
  value === undefined || value === null || value === 'danger' || value === 'warning'
  || value === 'caution'

/** Map a domain Chemical into a Dictionary shape. */
export const chemicalToRow = (chemical: Chemical) => ({
  id: chemical.id,
  name: chemical.name,
  epa_number: chemical.epaNumber ?? null,
  usage: chemical.usage,
  signal_word: chemical.signalWord ?? null,
  restricted_use: chemical.restrictedUse,
  re_entry_interval_hours: chemical.reEntryIntervalHours ?? null,
  storage_location: chemical.storageLocation ?? null,
  sds_url: chemical.sdsUrl ?? null,
  labels: chemical.labels ?? null,
  attachments: chemical.attachments ?? null,
  notes: chemical.notes ?? null,
  created_at: chemical.createdAt,
  updated_at: chemical.updatedAt,
  payload: chemical
})

/**
 * Convert a Dictionary into a Chemical domain model.
 * Payload is truth - if present, use it directly.
 * Falls back to column mapping for legacy records.
 * @param row - The database row to convert.
 * @returns The mapped Chemical object.
 * @throws Error if required fields are missing.
 */
export const rowToChemical = (row: unknown): Chemical => {
  if (!row || typeof row !== 'object') {
    throw new Error('Chemical row is missing required fields')
  }

  const record = row as Dictionary

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string'
      && typeof payload.name === 'string'
      && isChemicalUsage(payload.usage)
      && typeof payload.restrictedUse === 'boolean'
    ) {
      return payload as unknown as Chemical
    }
  }

  // Legacy fallback - map from columns
  const id = record.id as string
  const name = record.name as string
  const usage = record.usage
  const restrictedUse = record.restricted_use ?? record.restrictedUse

  if (!id || !name || !isChemicalUsage(usage) || typeof restrictedUse !== 'boolean') {
    throw new Error('Chemical row is missing required fields')
  }

  const signalWord = record.signal_word ?? record.signalWord

  return {
    id,
    name,
    epaNumber: (record.epa_number ?? record.epaNumber ?? undefined) as string | undefined,
    usage,
    signalWord: isSignalWord(signalWord) ? signalWord ?? undefined : undefined,
    restrictedUse,
    reEntryIntervalHours:
      (record.re_entry_interval_hours ?? record.reEntryIntervalHours ?? undefined) as
        | number
        | undefined,
    storageLocation: (record.storage_location ?? record.storageLocation ?? undefined) as
      | string
      | undefined,
    sdsUrl: (record.sds_url ?? record.sdsUrl ?? undefined) as string | undefined,
    labels: Array.isArray(record.labels) ? record.labels : undefined,
    attachments: Array.isArray(record.attachments) ? record.attachments : undefined,
    notes: Array.isArray(record.notes) ? record.notes : undefined,
    createdAt: (record.created_at ?? record.createdAt) as string,
    updatedAt: (record.updated_at ?? record.updatedAt) as string
  }
}
