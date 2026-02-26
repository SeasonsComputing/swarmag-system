/**
 * Domain models for regulated chemicals in the swarmAg system.
 * Chemicals require compliance tracking for licensing and regulatory purposes.
 */

import type { CompositionMany, Instantiable } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Domain usage classification. */
export const CHEMICAL_USAGES = [
  'herbicide',
  'pesticide',
  'fertilizer',
  'fungicide',
  'adjuvant'
] as const
export type ChemicalUsage = (typeof CHEMICAL_USAGES)[number]

/** Label or document pointer. */
export type ChemicalLabel = {
  url: string
  description?: string
}

/** Regulated material record. */
export type Chemical = Instantiable & {
  name: string
  epaNumber?: string
  usage: ChemicalUsage
  signalWord?: 'danger' | 'warning' | 'caution'
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
  labels: CompositionMany<ChemicalLabel>
  notes: CompositionMany<Note>
}
