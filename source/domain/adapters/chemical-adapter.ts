/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Chemical domain adapters                                                   ║
║ Dictionary <-> domain serialization for chemical topic abstractions.       ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Converts between persisted dictionary payloads and chemical domain
abstractions.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
toChemicalLabel(dict) / fromChemicalLabel(label)
  Convert ChemicalLabel dictionaries and domain objects.

toChemical(dict) / fromChemical(chemical)
  Convert Chemical dictionaries and domain objects.
*/

import type { Dictionary, When } from '@core-std'
import { notValid } from '@core-std'
import type {
  Chemical,
  ChemicalLabel,
  ChemicalSignalWord,
  ChemicalUsage
} from '@domain/abstractions/chemical.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC EXPORTS
// ────────────────────────────────────────────────────────────────────────────

/** Create a ChemicalLabel from its dictionary representation. */
export const toChemicalLabel = (dict: Dictionary): ChemicalLabel => {
  if (!dict.url) return notValid('ChemicalLabel dictionary missing required field: url')

  return {
    url: dict.url as string,
    description: dict.description as string | undefined
  }
}

/** Create a dictionary representation from a ChemicalLabel. */
export const fromChemicalLabel = (label: ChemicalLabel): Dictionary => ({
  url: label.url,
  description: label.description
})

/** Create a Chemical from its dictionary representation. */
export const toChemical = (dict: Dictionary): Chemical => {
  if (!dict.id) return notValid('Chemical dictionary missing required field: id')
  if (!dict.labels) return notValid('Chemical dictionary missing required field: labels')
  if (!dict.notes) return notValid('Chemical dictionary missing required field: notes')
  if (!dict.name) return notValid('Chemical dictionary missing required field: name')
  if (!dict.usage) return notValid('Chemical dictionary missing required field: usage')
  if (dict.restricted_use === undefined) {
    return notValid('Chemical dictionary missing required field: restricted_use')
  }
  if (!dict.created_at) {
    return notValid('Chemical dictionary missing required field: created_at')
  }
  if (!dict.updated_at) {
    return notValid('Chemical dictionary missing required field: updated_at')
  }

  return {
    id: dict.id as string,
    labels: (dict.labels as Dictionary[]).map(toChemicalLabel),
    notes: (dict.notes as Dictionary[]).map(toNote),
    name: dict.name as string,
    epaNumber: dict.epa_number as string | undefined,
    usage: dict.usage as ChemicalUsage,
    signalWord: dict.signal_word as ChemicalSignalWord | undefined,
    restrictedUse: dict.restricted_use as boolean,
    reEntryIntervalHours: dict.re_entry_interval_hours as number | undefined,
    storageLocation: dict.storage_location as string | undefined,
    sdsUrl: dict.sds_url as string | undefined,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

/** Create a dictionary representation from a Chemical. */
export const fromChemical = (chemical: Chemical): Dictionary => ({
  id: chemical.id,
  labels: chemical.labels.map(fromChemicalLabel),
  notes: chemical.notes.map(fromNote),
  name: chemical.name,
  epa_number: chemical.epaNumber,
  usage: chemical.usage,
  signal_word: chemical.signalWord,
  restricted_use: chemical.restrictedUse,
  re_entry_interval_hours: chemical.reEntryIntervalHours,
  storage_location: chemical.storageLocation,
  sds_url: chemical.sdsUrl,
  created_at: chemical.createdAt,
  updated_at: chemical.updatedAt,
  deleted_at: chemical.deletedAt
})
