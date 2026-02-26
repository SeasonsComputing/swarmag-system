/**
 * Protocol input shapes for Chemical boundary operations.
 */

import type { Id } from '@core-std'
import type { ChemicalUsage } from '@domain/abstractions/chemical.ts'

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
}
