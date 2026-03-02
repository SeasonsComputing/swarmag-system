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

/** Domain usage classification value. */
export type ChemicalUsage = (typeof CHEMICAL_USAGES)[number]

/** Label signal word set. */
export const CHEMICAL_SIGNAL_WORDS = ['danger', 'warning', 'caution'] as const

/** Label signal word value. */
export type ChemicalSignalWord = (typeof CHEMICAL_SIGNAL_WORDS)[number]

/** Label or document pointer for a chemical record. */
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
