/**
 * Domain models for regulated chemicals in the swarmAg system.
 * Chemicals are regulated materials applied during aerial and ground services.
 * Acquisition, storage, mixing, and application must be managed for licensing
 * and regulatory compliance.
 */

import type { CompositionMany, Instantiable } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Domain usage classification for a chemical. */
export type ChemicalUsage =
  | 'herbicide'
  | 'pesticide'
  | 'fertilizer'
  | 'fungicide'
  | 'adjuvant'

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
  signalWord?: 'danger' | 'warning' | 'caution'
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
  labels: CompositionMany<ChemicalLabel>
  notes: CompositionMany<Note>
}
