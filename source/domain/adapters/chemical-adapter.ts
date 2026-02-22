/**
 * Adapter for converting between Dictionary (storage) and Chemical domain abstractions.
 * Maps snake_case column names to camelCase domain fields and back.
 */

import type { Dictionary } from '@core-std'
import type { ChemicalUsage, ChemicalLabel, Chemical } from '@domain/abstractions/chemical.ts'

/** Converts a storage dictionary to a Chemical domain object. */
export const toChemical = (dict: Dictionary): Chemical => {
  if (!dict['id']) throw new Error('Chemical dictionary missing required field: id')
  if (!dict['name']) throw new Error('Chemical dictionary missing required field: name')
  if (!dict['usage']) throw new Error('Chemical dictionary missing required field: usage')
  if (dict['restricted_use'] === undefined || dict['restricted_use'] === null) throw new Error('Chemical dictionary missing required field: restricted_use')
  if (!dict['created_at']) throw new Error('Chemical dictionary missing required field: created_at')
  if (!dict['updated_at']) throw new Error('Chemical dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    name: dict['name'] as string,
    epaNumber: dict['epa_number'] as string | undefined,
    usage: dict['usage'] as ChemicalUsage,
    signalWord: dict['signal_word'] as Chemical['signalWord'],
    restrictedUse: dict['restricted_use'] as boolean,
    reEntryIntervalHours: dict['re_entry_interval_hours'] as number | undefined,
    storageLocation: dict['storage_location'] as string | undefined,
    sdsUrl: dict['sds_url'] as string | undefined,
    labels: (dict['labels'] ?? []) as Chemical['labels'],
    attachments: (dict['attachments'] ?? []) as Chemical['attachments'],
    notes: (dict['notes'] ?? []) as Chemical['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined,
  }
}

/** Converts a Chemical domain object to a storage dictionary. */
export const fromChemical = (chemical: Chemical): Dictionary => ({
  id: chemical.id,
  name: chemical.name,
  epa_number: chemical.epaNumber,
  usage: chemical.usage,
  signal_word: chemical.signalWord,
  restricted_use: chemical.restrictedUse,
  re_entry_interval_hours: chemical.reEntryIntervalHours,
  storage_location: chemical.storageLocation,
  sds_url: chemical.sdsUrl,
  labels: chemical.labels,
  attachments: chemical.attachments,
  notes: chemical.notes,
  created_at: chemical.createdAt,
  updated_at: chemical.updatedAt,
  deleted_at: chemical.deletedAt,
})
