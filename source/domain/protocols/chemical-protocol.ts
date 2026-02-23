/**
 * Protocol input types for Chemical boundary operations.
 */

import type { Id } from '@core-std'
import type { ChemicalLabel, ChemicalUsage } from '@domain/abstractions/chemical.ts'
import type { Note } from '@domain/abstractions/common.ts'

/** Input for creating a Chemical. */
export type ChemicalCreateInput = {
  name: string
  epaNumber?: string
  usage: ChemicalUsage
  signalWord?: 'danger' | 'warning' | 'caution'
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
  labels?: [ChemicalLabel?, ...ChemicalLabel[]]
  notes?: [Note?, ...Note[]]
}

/** Input for updating a Chemical. */
export type ChemicalUpdateInput = {
  id: Id
  name?: string
  epaNumber?: string
  usage?: ChemicalUsage
  signalWord?: 'danger' | 'warning' | 'caution'
  restrictedUse?: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
  labels?: [ChemicalLabel?, ...ChemicalLabel[]]
  notes?: [Note?, ...Note[]]
}
