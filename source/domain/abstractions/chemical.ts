/**
 * Domain models for chemicals in the swarmAg system.
 */

import type { CompositionMany, Instantiable } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Domain usage classification for chemicals. */
export const CHEMICAL_USAGES = [
  'herbicide',
  'pesticide',
  'fertilizer',
  'fungicide',
  'adjuvant'
] as const
export type ChemicalUsage = (typeof CHEMICAL_USAGES)[number]

/** Label signal word classifications. */
export const CHEMICAL_SIGNAL_WORDS = ['danger', 'warning', 'caution'] as const
export type ChemicalSignalWord = (typeof CHEMICAL_SIGNAL_WORDS)[number]

/** Label or document pointer for a chemical. */
export type ChemicalLabel = {
  url: string
  description?: string
}

/** Regulated material record. */
export type Chemical = Instantiable & {
  name: string
  epaNumber?: string
  usage: ChemicalUsage
  signalWord?: ChemicalSignalWord
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
  labels: CompositionMany<ChemicalLabel>
  notes: CompositionMany<Note>
}
