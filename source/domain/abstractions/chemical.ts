/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Chemical domain abstractions                                                ║
║ Regulated chemical record abstractions and supporting enums                 ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines regulated material abstractions and related value classifications.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CHEMICAL_USAGES                    Allowed domain usage values.
ChemicalUsage                      Chemical usage union.
CHEMICAL_SIGNAL_WORDS              Allowed chemical signal words.
ChemicalSignalWord                 Chemical signal word union.
ChemicalLabel                      Label/document metadata.
Chemical                           Regulated material abstraction.
*/

import type { CompositionMany, Instantiable } from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'

/** Domain usage classification values. */
export const CHEMICAL_USAGES = [
  'herbicide',
  'pesticide',
  'fertilizer',
  'fungicide',
  'adjuvant'
] as const
export type ChemicalUsage = (typeof CHEMICAL_USAGES)[number]

/** Hazard communication signal words. */
export const CHEMICAL_SIGNAL_WORDS = ['none', 'danger', 'warning', 'caution'] as const
export type ChemicalSignalWord = (typeof CHEMICAL_SIGNAL_WORDS)[number]

/** Label/document pointer. */
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
