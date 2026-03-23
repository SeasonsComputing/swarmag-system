/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical domain abstractions                                                 ║
║ Canonical types for regulated material records.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines chemical classification, label metadata, and chemical records.
*/

import type { CompositionMany, Instantiable } from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'

/** Allowed chemical usage classification values. */
export const CHEMICAL_USAGES = [
  'herbicide',
  'pesticide',
  'fertilizer',
  'fungicide',
  'adjuvant'
] as const
export type ChemicalUsage = (typeof CHEMICAL_USAGES)[number]

/** Allowed chemical signal word values. */
export const CHEMICAL_SIGNAL_WORDS = ['none', 'danger', 'warning', 'caution'] as const
export type ChemicalSignalWord = (typeof CHEMICAL_SIGNAL_WORDS)[number]

/** Label or document pointer metadata. */
export type ChemicalLabel = {
  url: string
  description?: string
}

/** Regulated material record. */
export type Chemical = Instantiable & {
  labels: CompositionMany<ChemicalLabel>
  notes: CompositionMany<Note>
  name: string
  epaNumber?: string
  usage: ChemicalUsage
  signalWord: ChemicalSignalWord
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
}
