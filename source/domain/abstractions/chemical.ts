/**
 * Domain models for chemicals in the swarmAg system.
 * Chemicals include herbicides, pesticides, fertilizers, etc. used in operations.
 */

import type { Attachment, Note } from '@domain/abstractions/common.ts'
import type { ID, When } from '@utils'

/** The different usages for chemicals. */
export type ChemicalUsage =
  | 'herbicide'
  | 'pesticide'
  | 'fertilizer'
  | 'fungicide'
  | 'adjuvant'

/** Represents a label or documentation for a chemical. */
export interface ChemicalLabel {
  url: string
  description?: string
}

/** Represents a chemical in the swarmAg system. */
export interface Chemical {
  id: ID
  name: string
  epaNumber?: string
  usage: ChemicalUsage
  signalWord?: 'danger' | 'warning' | 'caution'
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
  labels?: ChemicalLabel[]
  attachments?: Attachment[]
  notes?: Note[]
  createdAt: When
  updatedAt: When
}
