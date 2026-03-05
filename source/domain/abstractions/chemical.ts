/**
 * Chemical domain abstractions.
 */

import type { CompositionMany, Instantiable } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Domain usage classification for a chemical. */
export const CHEMICAL_USAGES = [
  'herbicide',
  'pesticide',
  'fertilizer',
  'fungicide',
  'adjuvant'
] as const
export type ChemicalUsage = (typeof CHEMICAL_USAGES)[number]

/** EPA label and related document pointer. */
export type ChemicalLabel = {
  url: string
  description?: string
}

/** Regulated signal word classification. */
export const CHEMICAL_SIGNAL_WORDS = ['danger', 'warning', 'caution'] as const
export type ChemicalSignalWord = (typeof CHEMICAL_SIGNAL_WORDS)[number]

/** Regulated material record. */
export type Chemical = Instantiable & {
  labels: CompositionMany<ChemicalLabel>
  notes: CompositionMany<Note>
  name: string
  epaNumber?: string
  usage: ChemicalUsage
  signalWord?: ChemicalSignalWord
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
}
