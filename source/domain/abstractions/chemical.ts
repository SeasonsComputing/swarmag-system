/**
 * Domain models for regulated chemicals used in swarmAg operations.
 * Captures identity, classification, safety, and compliance data.
 */
import type { Id, When } from '@core-std'
import type { Attachment, Note } from '@domain/abstractions/common.ts'

/** Domain usage classification for a chemical. */
export type ChemicalUsage =
  | 'herbicide'
  | 'pesticide'
  | 'fertilizer'
  | 'fungicide'
  | 'adjuvant'

/** Label or regulatory document pointer for a chemical. */
export type ChemicalLabel = {
  url: string
  description?: string
}

/** Regulated material record with safety, storage, and compliance metadata. */
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
  attachments: [Attachment?, ...Attachment[]]
  notes: [Note?, ...Note[]]
  createdAt: When
  updatedAt: When
  deletedAt?: When
}
