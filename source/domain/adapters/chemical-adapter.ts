/**
 * Adapters for converting between Dictionary and Chemical domain abstractions.
 */

import type { Dictionary } from '@core-std'
import { notValid } from '@core-std'
import type { Chemical } from '@domain/abstractions/chemical.ts'

/** Convert a Dictionary to a Chemical domain object. */
export const toChemical = (dict: Dictionary): Chemical => {
  if (!dict['id']) notValid('Chemical dictionary missing required field: id')
  if (!dict['name']) notValid('Chemical dictionary missing required field: name')
  if (!dict['usage']) notValid('Chemical dictionary missing required field: usage')
  if (dict['restricted_use'] === undefined || dict['restricted_use'] === null) {
    notValid('Chemical dictionary missing required field: restricted_use')
  }
  if (!dict['created_at']) notValid('Chemical dictionary missing required field: created_at')
  if (!dict['updated_at']) notValid('Chemical dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    name: dict['name'] as string,
    epaNumber: dict['epa_number'] as string | undefined,
    usage: dict['usage'] as Chemical['usage'],
    signalWord: dict['signal_word'] as Chemical['signalWord'],
    restrictedUse: dict['restricted_use'] as boolean,
    reEntryIntervalHours: dict['re_entry_interval_hours'] as number | undefined,
    storageLocation: dict['storage_location'] as string | undefined,
    sdsUrl: dict['sds_url'] as string | undefined,
    labels: (dict['labels'] ?? []) as Chemical['labels'],
    notes: (dict['notes'] ?? []) as Chemical['notes'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a Chemical domain object to a Dictionary. */
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
  notes: chemical.notes,
  created_at: chemical.createdAt,
  updated_at: chemical.updatedAt,
  deleted_at: chemical.deletedAt
})
