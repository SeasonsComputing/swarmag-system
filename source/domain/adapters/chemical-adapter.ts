/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Chemical domain adapters                                                    ║
║ Dictionary serialization for chemical topic abstractions                    ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes chemical topic abstractions between Dictionary and domain shapes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toChemicalLabel                     Deserialize ChemicalLabel from Dictionary.
fromChemicalLabel                   Serialize ChemicalLabel to Dictionary.
toChemical                          Deserialize Chemical from Dictionary.
fromChemical                        Serialize Chemical to Dictionary.
*/

import type { Dictionary, Id, When } from '@core/std'
import type { Chemical, ChemicalLabel } from '@domain/abstractions/chemical.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize ChemicalLabel from Dictionary. */
export const toChemicalLabel = (dict: Dictionary): ChemicalLabel => ({
  url: dict.url as string,
  description: dict.description as string | undefined
})

/** Serialize ChemicalLabel to Dictionary. */
export const fromChemicalLabel = (chemicalLabel: ChemicalLabel): Dictionary => ({
  url: chemicalLabel.url,
  description: chemicalLabel.description
})

/** Deserialize Chemical from Dictionary. */
export const toChemical = (dict: Dictionary): Chemical => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  labels: (dict.labels as Dictionary[]).map(toChemicalLabel),
  notes: (dict.notes as Dictionary[]).map(toNote),
  name: dict.name as string,
  epaNumber: dict.epa_number as string | undefined,
  usage: dict.usage as Chemical['usage'],
  signalWord: dict.signal_word as Chemical['signalWord'],
  restrictedUse: dict.restricted_use as boolean,
  reEntryIntervalHours: dict.re_entry_interval_hours as number | undefined,
  storageLocation: dict.storage_location as string | undefined,
  sdsUrl: dict.sds_url as string | undefined
})

/** Serialize Chemical to Dictionary. */
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
