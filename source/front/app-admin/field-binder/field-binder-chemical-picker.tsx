/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder chemical picker                                                 ║
║ Chooses one chemical document link: chemical, then its SDS or a label.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Declares two picker levels over the Chemicals' document links: the chemicals,
then a chemical's safety data sheet and labels. Choosing a document
hands back its display name, its link, and the chemical it came from. The link
is the entry's source; the user opens it and uploads the saved file.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ChemicalDocument                A chosen chemical document link.
├ chemical                      The chemical's id.
├ name                          Chemical name and document kind, for display.
└ url                           The document's link.
FieldBinderChemicalPickerProps  Picker inputs.
├ disabled                      The host is busy.
└ onChoose                      Receives the chosen document.
FieldBinderChemicalPicker       Add-chemical-document button and sheet.
*/

import type { Id } from '@core/std'
import { listAll } from '@core/stdx'
import type { Chemical } from '@domain/abstractions/chemical.ts'
import { api } from '@front/api/api.ts'
import type { UiComponent } from '@ux/ui'
import { FieldBinderPicker } from './field-binder-picker.tsx'
import type { PickerLevel } from './field-binder-picker.tsx'

/** A chemical document link, as the picker hands it back. */
export type ChemicalDocument = { chemical: Id; name: string; url: string }

/** The host's busy state and the chosen document's receiver. */
export type FieldBinderChemicalPickerProps = {
  disabled: boolean
  onChoose: (document: ChemicalDocument) => void
}

/** A picker over the chemicals, then a chemical's documents; choosing one closes it. */
export const FieldBinderChemicalPicker = (props: FieldBinderChemicalPickerProps): UiComponent => {
  const documents = (chemical: Chemical): PickerLevel => ({
    column: 'Document',
    detail: 'Kind',
    empty: 'This chemical has no documents.',
    load: () =>
      Promise.resolve(
        chemicalDocuments(chemical).map(row => ({
          label: row.title,
          detail: row.kind,
          choose: () => props.onChoose(row.choice)
        }))
      )
  })

  const chemicals: PickerLevel = {
    column: 'Chemical',
    empty: 'No chemicals.',
    load: async () =>
      (await loadChemicals()).map(chemical => ({
        label: chemical.name,
        open: () => documents(chemical)
      }))
  }

  return (
    <FieldBinderPicker
      label='Add Chemical Document'
      title='Chemicals'
      disabled={props.disabled}
      root={chemicals}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** One document row: its title, its kind, and what choosing it hands back. */
type ChemicalDocumentRow = { title: string; kind: string; choice: ChemicalDocument }

/** A chemical's SDS, then its labels, each with the link it points at. */
const chemicalDocuments = (chemical: Chemical): readonly ChemicalDocumentRow[] => {
  const row = (title: string, kind: string, url: string): ChemicalDocumentRow => ({
    title,
    kind,
    choice: { chemical: chemical.id, name: `${chemical.name} · ${title}`, url }
  })
  return [
    ...(chemical.sdsUrl ? [row('Safety data sheet', 'SDS', chemical.sdsUrl)] : []),
    ...chemical.labels.map(label => row(label.description ?? 'Label', 'Label', label.url))
  ]
}

/** The live chemicals, ordered by name for choosing. */
const loadChemicals = async (): Promise<readonly Chemical[]> =>
  (await Array.fromAsync(listAll(api.Chemicals)))
    .toSorted((left, right) => left.name.localeCompare(right.name))
