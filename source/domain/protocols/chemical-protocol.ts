/**
 * Protocol input shapes for Chemical create and update operations.
 * Partial shapes for boundary transmission — no domain logic.
 */
import type { Id } from '@core-std'
import type { ChemicalUsage, ChemicalLabel, Chemical } from '@domain/abstractions/chemical.ts'
import type { Attachment, Note } from '@domain/abstractions/common.ts'

/** Input shape for creating a Chemical. */
export type ChemicalCreateInput = {
  name: string
  epaNumber?: string
  usage: ChemicalUsage
  signalWord?: Chemical['signalWord']
  restrictedUse: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
  labels?: [ChemicalLabel?, ...ChemicalLabel[]]
  attachments?: [Attachment?, ...Attachment[]]
  notes?: [Note?, ...Note[]]
}

/** Input shape for updating a Chemical. */
export type ChemicalUpdateInput = {
  id: Id
  name?: string
  epaNumber?: string
  usage?: ChemicalUsage
  signalWord?: Chemical['signalWord']
  restrictedUse?: boolean
  reEntryIntervalHours?: number
  storageLocation?: string
  sdsUrl?: string
  labels?: [ChemicalLabel?, ...ChemicalLabel[]]
  attachments?: [Attachment?, ...Attachment[]]
  notes?: [Note?, ...Note[]]
}
