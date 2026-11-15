/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder chemical dialog                                                 ║
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
FieldBinderChemicalDialogProps  Dialog inputs.
├ disabled                      The host is busy.
├ name                          The form field the picker fills.
├ error                         The field is shown invalid.
└ onChoose                      Receives the chosen document.
FieldBinderChemicalDialog       Add-chemical-document button and sheet.
*/

import type { Id } from '@core/std'
import { listAll } from '@core/stdx'
import type { Chemical } from '@domain/abstractions/chemical.ts'
import { api } from '@front/api/api.ts'
import { DrillDialog } from '@front/app/shell/retrieval/drill-dialog.tsx'
import type { DrillLevel } from '@front/app/shell/retrieval/drill-navigator.tsx'
import type { UiComponent } from '@ux/ui'

/** A chemical document link, as the dialog hands it back. */
export type ChemicalDocument = { chemical: Id; name: string; url: string }

/** The host's busy state and the chosen document's receiver. */
export type FieldBinderChemicalDialogProps = {
  disabled: boolean
  name: string
  error: boolean
  onChoose: (document: ChemicalDocument) => void
}

/** A dialog over the chemicals, then a chemical's documents; choosing one closes it. */
export const FieldBinderChemicalDialog = (props: FieldBinderChemicalDialogProps): UiComponent => {
  const documents = (chemical: Chemical): DrillLevel => ({
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

  const chemicals: DrillLevel = {
    column: 'Chemical',
    empty: 'No chemicals.',
    load: async () =>
      (await loadChemicals()).map(chemical => ({
        label: chemical.name,
        open: () => documents(chemical)
      }))
  }

  return (
    <DrillDialog
      label='Add Chemical Document'
      title='Chemicals'
      disabled={props.disabled}
      name={props.name}
      error={props.error}
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
