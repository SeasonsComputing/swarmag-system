/**
 * Domain abstractions for regulated chemicals in the swarmAg system.
 * Chemicals require licensing and regulatory compliance management.
 */

import type { Id, When } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Domain usage classification. */
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
export type Chemical = {
  id: Id
  name: string
  epaNumber?: string
  usage: ChemicalUsage
  signalWord?: 'danger' | 'warning' | 'caution'
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
  labels: [ChemicalLabel?, ...ChemicalLabel[]]
  notes: [Note?, ...Note[]]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}
