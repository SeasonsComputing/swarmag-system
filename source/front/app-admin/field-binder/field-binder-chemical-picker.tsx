/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder chemical picker                                                 ║
║ Chooses one chemical document link: chemical, then its SDS or a label.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
An Index-Detail over the Chemicals' document links, in a picker sheet: the
chemicals, then a chemical's safety data sheet and labels. Choosing a document
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
import { createResource, For, Show } from '@solid-js'
import type { DrillContract } from '@ux/shell/panel/drill-contract.ts'
import { UiTable, UiTableBody, UiTableCell, UiTableHeader, UiTableRow } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { FieldBinderPicker, PickerDrillCell } from './field-binder-picker.tsx'

/** A chemical document link, as the picker hands it back. */
export type ChemicalDocument = { chemical: Id; name: string; url: string }

/** The host's busy state and the chosen document's receiver. */
export type FieldBinderChemicalPickerProps = {
  disabled: boolean
  onChoose: (document: ChemicalDocument) => void
}

/** A picker sheet over the chemicals' documents; choosing one closes it. */
export const FieldBinderChemicalPicker = (props: FieldBinderChemicalPickerProps): UiComponent => (
  <FieldBinderPicker
    label='Add Chemical Document'
    title='Chemicals'
    disabled={props.disabled}
    root={(drill, close) => (
      <Chemicals
        drill={drill}
        choose={chosen => {
          close()
          props.onChoose(chosen)
        }}
      />
    )}
  />
)

// ────────────────────────────────────────────────────────────────────────────
// CHEMICALS: CHEMICALS, DOCUMENTS
// ────────────────────────────────────────────────────────────────────────────

/** Receives a chosen document. */
type Choose = (document: ChemicalDocument) => void

/** The live chemicals; activating one opens its documents. */
const Chemicals = (props: { drill: DrillContract; choose: Choose }): UiComponent => {
  const [chemicals] = createResource(loadChemicals)
  return (
    <Show when={!chemicals.loading} fallback={<p role='status'>Loading chemicals…</p>}>
      <UiTable>
        <UiTableHeader>
          <UiTableCell>Chemical</UiTableCell>
          <UiTableCell />
        </UiTableHeader>
        <UiTableBody>
          <For each={chemicals()} fallback={emptyRow('No chemicals.')}>
            {chemical => (
              <UiTableRow
                onActivate={() =>
                  props.drill.open(
                    () => <Documents chemical={chemical} choose={props.choose} />,
                    chemical.name
                  )}
              >
                <UiTableCell>{chemical.name}</UiTableCell>
                <PickerDrillCell />
              </UiTableRow>
            )}
          </For>
        </UiTableBody>
      </UiTable>
    </Show>
  )
}

/** One chemical's safety data sheet and labels; activating one chooses it. */
const Documents = (props: { chemical: Chemical; choose: Choose }): UiComponent => (
  <UiTable>
    <UiTableHeader>
      <UiTableCell>Document</UiTableCell>
      <UiTableCell align='end'>Kind</UiTableCell>
    </UiTableHeader>
    <UiTableBody>
      <For
        each={chemicalDocuments(props.chemical)}
        fallback={emptyRow('This chemical has no documents.')}
      >
        {row => (
          <UiTableRow onActivate={() => props.choose(row.choice)}>
            <UiTableCell>{row.title}</UiTableCell>
            <UiTableCell align='end'>{row.kind}</UiTableCell>
          </UiTableRow>
        )}
      </For>
    </UiTableBody>
  </UiTable>
)

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

/** A read-only row that says a list is empty. */
const emptyRow = (message: string): UiComponent => (
  <UiTableRow>
    <UiTableCell>{message}</UiTableCell>
  </UiTableRow>
)

/** The live chemicals, ordered by name for choosing. */
const loadChemicals = async (): Promise<readonly Chemical[]> =>
  (await Array.fromAsync(listAll(api.Chemicals)))
    .toSorted((left, right) => left.name.localeCompare(right.name))
