/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical domain adapters                                                     ║
║ Dictionary serialization for chemical topic abstractions.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to chemical abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toChemicalLabel(dict)     Deserialize ChemicalLabel from dictionary.
fromChemicalLabel(label)  Serialize ChemicalLabel to dictionary.
toChemical(dict)          Deserialize Chemical from dictionary.
fromChemical(chemical)    Serialize Chemical to dictionary.
*/

import type { Dictionary } from '@core/std'
import type { Chemical, ChemicalLabel } from '@domain/abstractions/chemical.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize ChemicalLabel from dictionary. */
export const toChemicalLabel = (dict: Dictionary): ChemicalLabel => ({
  url: dict.url as string,
  description: dict.description as string | undefined
})

/** Serialize ChemicalLabel to dictionary. */
export const fromChemicalLabel = (label: ChemicalLabel): Dictionary => ({
  url: label.url,
  description: label.description
})

/** Deserialize Chemical from dictionary. */
export const toChemical = (dict: Dictionary): Chemical => ({
  id: dict.id as string,
  createdAt: dict.created_at as string,
  updatedAt: dict.updated_at as string,
  deletedAt: dict.deleted_at as string | undefined,
  labels: (dict.labels as Dictionary[] | undefined ?? []).map(toChemicalLabel),
  notes: (dict.notes as Dictionary[] | undefined ?? []).map(toNote),
  name: dict.name as string,
  epaNumber: dict.epa_number as string | undefined,
  usage: dict.usage as Chemical['usage'],
  signalWord: dict.signal_word as Chemical['signalWord'],
  restrictedUse: dict.restricted_use as boolean,
  reEntryIntervalHours: dict.re_entry_interval_hours as number | undefined,
  storageLocation: dict.storage_location as string | undefined,
  sdsUrl: dict.sds_url as string | undefined
})

/** Serialize Chemical to dictionary. */
export const fromChemical = (chemical: Chemical): Dictionary => ({
  id: chemical.id,
  created_at: chemical.createdAt,
  updated_at: chemical.updatedAt,
  deleted_at: chemical.deletedAt,
  labels: chemical.labels.map(fromChemicalLabel),
  notes: chemical.notes.map(fromNote),
  name: chemical.name,
  epa_number: chemical.epaNumber,
  usage: chemical.usage,
  signal_word: chemical.signalWord,
  restricted_use: chemical.restrictedUse,
  re_entry_interval_hours: chemical.reEntryIntervalHours,
  storage_location: chemical.storageLocation,
  sds_url: chemical.sdsUrl
})
