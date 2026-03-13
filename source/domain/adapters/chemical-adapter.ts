/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical domain adapter                                                      ║
║ Serialization for chemical topic abstractions.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Serializes between Dictionary and Chemical domain types, including the
embedded ChemicalLabel composition.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
toChemical    Deserialize Chemical from a storage dictionary.
fromChemical  Serialize Chemical to a storage dictionary.
*/

import type { CompositionMany, Dictionary, Id, When } from '@core/std'
import type {
  Chemical,
  ChemicalLabel,
  ChemicalSignalWord,
  ChemicalUsage
} from '@domain/abstractions/chemical.ts'
import type { Note } from '@domain/abstractions/common.ts'
import { fromNote, toNote } from '@domain/adapters/common-adapter.ts'

/** Deserialize Chemical from a storage dictionary. */
export const toChemical = (dict: Dictionary): Chemical => ({
  id: dict.id as Id,
  createdAt: dict.created_at as When,
  updatedAt: dict.updated_at as When,
  deletedAt: dict.deleted_at as When | undefined,
  labels: (dict.labels as Dictionary[]).map(toChemicalLabel) as CompositionMany<ChemicalLabel>,
  notes: (dict.notes as Dictionary[]).map(toNote) as CompositionMany<Note>,
  name: dict.name as string,
  epaNumber: dict.epa_number as string | undefined,
  usage: dict.usage as ChemicalUsage,
  signalWord: dict.signal_word as ChemicalSignalWord,
  restrictedUse: dict.restricted_use as boolean,
  reEntryIntervalHours: dict.re_entry_interval_hours as number | undefined,
  storageLocation: dict.storage_location as string | undefined,
  sdsUrl: dict.sds_url as string | undefined
})

/** Serialize Chemical to a storage dictionary. */
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

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ────────────────────────────────────────────────────────────────────────────

const toChemicalLabel = (dict: Dictionary): ChemicalLabel => ({
  url: dict.url as string,
  description: dict.description as string | undefined
})

const fromChemicalLabel = (label: ChemicalLabel): Dictionary => ({
  url: label.url,
  description: label.description
})
