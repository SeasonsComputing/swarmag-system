/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical domain abstractions                                                 ║
║ Regulated chemical material records.                                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the Chemical abstraction and supporting types for regulated materials
applied as part of certain services, including usage classification, signal
words, and label document pointers.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CHEMICAL_USAGES       Canonical chemical usage classification values.
ChemicalUsage         Chemical usage union type.
CHEMICAL_SIGNAL_WORDS  Canonical chemical signal word values.
ChemicalSignalWord    Chemical signal word union type.
ChemicalLabel         Label and document pointer for a chemical.
Chemical              Regulated material record.
*/

import type { CompositionMany, Instantiable } from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'

/** Canonical chemical usage classification values. */
export const CHEMICAL_USAGES = [
  'herbicide',
  'pesticide',
  'fertilizer',
  'fungicide',
  'adjuvant'
] as const
export type ChemicalUsage = (typeof CHEMICAL_USAGES)[number]

/** Canonical chemical signal word values. */
export const CHEMICAL_SIGNAL_WORDS = ['none', 'danger', 'warning', 'caution'] as const
export type ChemicalSignalWord = (typeof CHEMICAL_SIGNAL_WORDS)[number]

/** Label and document pointer for a chemical. */
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
