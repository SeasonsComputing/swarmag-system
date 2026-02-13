/**
 * Protocol types for chemical operations.
 * Defines wire shapes for request/response contracts.
 */

import type { Chemical } from '@domain/abstractions/chemical.ts'

/** Input type for creating a chemical. */
export interface ChemicalCreateInput {
  name: string
  epaNumber?: string
  usage: Chemical['usage']
  signalWord?: Chemical['signalWord']
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
}

/** Input type for updating a chemical. */
export interface ChemicalUpdateInput {
  id: string
  name?: string
  epaNumber?: string | null
  usage?: Chemical['usage']
  signalWord?: Chemical['signalWord'] | null
  restrictedUse?: boolean
  reEntryIntervalHours?: number | null
  storageLocation?: string | null
  sdsUrl?: string | null
}
