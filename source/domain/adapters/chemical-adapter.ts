/**
 * Chemical et al adapters to and from Dictionary representation
 */

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type { Chemical, ChemicalLabel } from '@domain/abstractions/chemical.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Create a ChemicalLabel from serialized dictionary format */
export const toChemicalLabel = (dict: Dictionary): ChemicalLabel => ({
  url: dict.url as string,
  description: dict.description as string | undefined
})

/** Serialize a ChemicalLabel to dictionary format */
export const fromChemicalLabel = (label: ChemicalLabel): Dictionary => ({
  url: label.url,
  description: label.description
})

/** Create a Chemical from serialized dictionary format */
export const toChemical = (dict: Dictionary): Chemical => {
  if (!dict.id) return notValid('Chemical dictionary missing required field: id')
  if (!dict.name) return notValid('Chemical dictionary missing required field: name')
  return {
    id: dict.id as string,
    name: dict.name as string,
    epaNumber: dict.epa_number as string | undefined,
    usage: dict.usage as Chemical['usage'],
    signalWord: dict.signal_word as Chemical['signalWord'],
    restrictedUse: dict.restricted_use as boolean,
    reEntryIntervalHours: dict.re_entry_interval_hours as number | undefined,
    storageLocation: dict.storage_location as string | undefined,
    sdsUrl: dict.sds_url as string | undefined,
    labels: ((dict.labels as Dictionary[]) ?? []).map(toChemicalLabel),
    notes: ((dict.notes as Dictionary[]) ?? []).map(toNote),
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Serialize a Chemical to dictionary format */
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
  labels: chemical.labels.map(fromChemicalLabel),
  notes: chemical.notes.map(fromNote),
  created_at: chemical.createdAt,
  updated_at: chemical.updatedAt,
  deleted_at: chemical.deletedAt
})
