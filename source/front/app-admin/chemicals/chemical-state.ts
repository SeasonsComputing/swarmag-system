/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical draft state                                                         ║
║ Holds transient form fields and projects the owned draft.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds transient form fields and projects the owned draft.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ChemicalDraft  Fields owned by the Chemical form.
chemicalDraft  Project normalized form state.
ChemicalState  Reactive draft fields and setters.
├ name, setName  Read and edit name.
├ epaNumber, setEpaNumber  Read and edit epaNumber.
├ usage, setUsage  Read and edit usage.
├ signalWord, setSignalWord  Read and edit signalWord.
├ restrictedUse, setRestrictedUse  Read and edit restrictedUse.
├ reEntryIntervalHours, setReEntryIntervalHours  Read and edit reEntryIntervalHours.
├ storageLocation, setStorageLocation  Read and edit storageLocation.
├ sdsUrl, setSdsUrl  Read and edit sdsUrl.
└ notes, setNotes  Read and edit notes.
createChemicalState  Open an isolated draft.
reEntryIntervalError  Check optional positive whole hours.
*/

import { expectPositiveNumber, toTrimmed } from '@core/std'
import type { ExpectResult } from '@core/std'
import type { DraftOf } from '@core/stdx'
import type { Chemical, ChemicalSignalWord, ChemicalUsage } from '@domain/abstractions/chemical.ts'
import type { Note } from '@domain/abstractions/common.ts'
import type { scopes } from '@front/api/scopes.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'
import { copyDraft } from '@ux/shell/workbench/workbench-draft.ts'
import { UiText } from '@ux/ui/components/ui-helpers.ts'

/** Fields owned by the Chemical form. */
export type ChemicalDraft = DraftOf<typeof scopes.Chemicals.detail>

/** Reactive state for one Chemical draft. */
export type ChemicalState = {
  name: Accessor<string>
  setName: Setter<string>
  epaNumber: Accessor<string>
  setEpaNumber: Setter<string>
  usage: Accessor<ChemicalUsage>
  setUsage: Setter<ChemicalUsage>
  signalWord: Accessor<ChemicalSignalWord>
  setSignalWord: Setter<ChemicalSignalWord>
  restrictedUse: Accessor<boolean>
  setRestrictedUse: Setter<boolean>
  reEntryIntervalHours: Accessor<number | undefined>
  setReEntryIntervalHours: Setter<number | undefined>
  storageLocation: Accessor<string>
  setStorageLocation: Setter<string>
  sdsUrl: Accessor<string>
  setSdsUrl: Setter<string>
  notes: Accessor<readonly Note[]>
  setNotes: (value: readonly Note[]) => void
}

/** Project trimmed fields and isolated notes. */
export const chemicalDraft = (state: ChemicalState): ChemicalDraft => {
  return copyDraft({
    name: toTrimmed(state.name()),
    epaNumber: UiText.optional(toTrimmed(state.epaNumber())),
    usage: state.usage(),
    signalWord: state.signalWord(),
    restrictedUse: state.restrictedUse(),
    reEntryIntervalHours: state.reEntryIntervalHours(),
    storageLocation: UiText.optional(toTrimmed(state.storageLocation())),
    sdsUrl: UiText.optional(toTrimmed(state.sdsUrl())),
    notes: state.notes()
  })
}

/** Open a draft without sharing structured values with its source. */
export const createChemicalState = (record: Chemical | null = null): ChemicalState => {
  const [name, setName] = createSignal<string>(record?.name ?? '')
  const [epaNumber, setEpaNumber] = createSignal<string>(record?.epaNumber ?? '')
  const [usage, setUsage] = createSignal<ChemicalUsage>(record?.usage ?? 'herbicide')
  const [signalWord, setSignalWord] = createSignal<ChemicalSignalWord>(record?.signalWord ?? 'none')
  const [restrictedUse, setRestrictedUse] = createSignal<boolean>(record?.restrictedUse ?? false)
  const [reEntryIntervalHours, setReEntryIntervalHours] = createSignal<number | undefined>(
    record?.reEntryIntervalHours
  )
  const [storageLocation, setStorageLocation] = createSignal<string>(record?.storageLocation ?? '')
  const [sdsUrl, setSdsUrl] = createSignal<string>(record?.sdsUrl ?? '')
  const [notes, setNotes] = createSignal<readonly Note[]>(copyDraft(record?.notes ?? []))
  return {
    name,
    setName,
    epaNumber,
    setEpaNumber,
    usage,
    setUsage,
    signalWord,
    setSignalWord,
    restrictedUse,
    setRestrictedUse,
    reEntryIntervalHours,
    setReEntryIntervalHours,
    storageLocation,
    setStorageLocation,
    sdsUrl,
    setSdsUrl,
    notes,
    setNotes: value => setNotes(copyDraft(value))
  }
}

/** Blank or positive whole hours, matching the existing integer column. */
export const reEntryIntervalError = (value: number | undefined): ExpectResult => {
  const error = expectPositiveNumber(value, 'Re-entry interval', true)
  if (error) return error
  return value === undefined || Number.isInteger(value) ? null : 'Enter whole hours.'
}
