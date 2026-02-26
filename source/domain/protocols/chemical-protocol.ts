/**
 * Protocol input shapes for Chemical boundary operations.
 */

import type { Id } from '@core-std'
import type { Chemical, ChemicalUsage } from '@domain/abstractions/chemical.ts'

/** Input for creating a Chemical. */
export type ChemicalCreate = {
  name: string
  epaNumber?: string
  usage: ChemicalUsage
  signalWord?: Chemical['signalWord']
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
}

/** Input for updating a Chemical. */
export type ChemicalUpdate = {
  id: Id
  name?: string
  epaNumber?: string
  usage?: ChemicalUsage
  signalWord?: Chemical['signalWord']
  restrictedUse?: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
}
