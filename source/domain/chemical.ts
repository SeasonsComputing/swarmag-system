/**
 * Domain models for chemicals in the swarmAg system.
 * Chemicals include herbicides, pesticides, fertilizers, etc. used in operations.
 */

import type { ID } from '@utils/identifier.ts'
import type { When } from '@utils/datetime.ts'
import type { Attachment, Note } from '@domain/common.ts'

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
