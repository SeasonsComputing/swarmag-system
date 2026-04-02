/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical domain adapters                                                     ║
║ Dictionary serialization for chemical topic abstractions.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Maps storage dictionaries to chemical abstractions and back.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ChemicalLabelAdapter  Deserialize/Serialize ChemicalLabel.
ChemicalAdapter       Deserialize/Serialize Chemical.
*/

import { makeAdapter } from '@core/std'
import type { Chemical, ChemicalLabel } from '@domain/abstractions/chemical.ts'
import { NoteAdapter } from '@domain/adapters/common-adapter.ts'

/** Deserialize/Serialize ChemicalLabel. */
export const ChemicalLabelAdapter = makeAdapter<ChemicalLabel>({
  url: ['url'],
  description: ['description']
})

/** Deserialize/Serialize Chemical. */
export const ChemicalAdapter = makeAdapter<Chemical>({
  id: ['id'],
  createdAt: ['created_at'],
  updatedAt: ['updated_at'],
  deletedAt: ['deleted_at'],
  labels: ['labels', ChemicalLabelAdapter],
  notes: ['notes', NoteAdapter],
  name: ['name'],
  epaNumber: ['epa_number'],
  usage: ['usage'],
  signalWord: ['signal_word'],
  restrictedUse: ['restricted_use'],
  reEntryIntervalHours: ['re_entry_interval_hours'],
  storageLocation: ['storage_location'],
  sdsUrl: ['sds_url']
})
