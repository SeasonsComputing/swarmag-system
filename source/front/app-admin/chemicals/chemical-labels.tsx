/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Chemical labels                                                              ║
║ Edits Chemical label references through the existing drill-down pattern.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Edits Chemical label references through the existing drill-down pattern.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ChemicalLabelsProps  Controlled labels collection.
├ labels             Current label references.
├ onChange           Replace labels in the Chemical draft.
└ drill              Existing Step drill host.
ChemicalLabels       Label collection and nested editor.
*/

import { isUrl, toTrimmed } from '@core/std'
import type { ChemicalLabel } from '@domain/abstractions/chemical.ts'
import { UrlField } from '@front/app/shell/url-field.tsx'
import { createSignal, onCleanup } from '@solid-js'
import { CollectionPanel } from '@ux/shell/panel/collection-panel.tsx'
import type { DrillContract, DrillPanelContext } from '@ux/shell/panel/drill-contract.ts'
import { copyDraft, isDraftChanged } from '@ux/shell/workbench/workbench-draft.ts'
import { UiField, UiInput, UiLayout } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

/** Controlled label references on one Chemical draft. */
export type ChemicalLabelsProps = {
  labels: () => readonly ChemicalLabel[]
  onChange: (labels: readonly ChemicalLabel[]) => void
  drill: DrillContract
}

/** Render labels using the same pending-item and drill pattern as Sites. */
export const ChemicalLabels = (props: ChemicalLabelsProps): UiComponent => {
  const [pending, setPending] = createSignal<ChemicalLabel | null>(null)
  const labels = () => pending() ? [...props.labels(), pending()!] : props.labels()
  return (
    <CollectionPanel
      legend='Labels'
      itemColumn='Label'
      items={labels}
      label={label => label.description || label.url || 'New label'}
      emptyMessage={
        <>
          No labels yet. Use <kbd>New Label</kbd> to add one.
        </>
      }
      newLabel='New Label'
      onNew={() => setPending({ url: '' })}
      onRemove={index => props.onChange(props.labels().filter((_, i) => i !== index))}
      confirmRemove={() => ({
        title: 'Delete label?',
        message: 'This label will be removed.'
      })}
      drill={props.drill}
      renderItem={(label, index, context) => {
        onCleanup(() => setPending(null))
        return (
          <LabelPanel
            label={label}
            context={context}
            onSave={saved =>
              props.onChange(
                index >= props.labels().length
                  ? [...props.labels(), saved]
                  : props.labels().map((item, i) => i === index ? saved : item)
              )}
          />
        )
      }}
    />
  )
}

/** Inputs for one nested label draft. */
type LabelPanelProps = {
  label: ChemicalLabel
  context: DrillPanelContext
  onSave: (label: ChemicalLabel) => void
}

const LabelPanel = (props: LabelPanelProps): UiComponent => {
  const original = copyDraft(props.label)
  const [url, setUrl] = createSignal(original.url)
  const [description, setDescription] = createSignal(original.description ?? '')
  const [attempted, setAttempted] = createSignal(false)
  const draft = (): ChemicalLabel => ({
    url: toTrimmed(url()),
    description: toTrimmed(description()) || undefined
  })
  props.context.registerDirty(() => isDraftChanged(draft(), original))
  props.context.registerSave(() => ({
    icon: 'check',
    label: 'Save',
    labelMode: 'visible',
    error: attempted() && !isUrl(url().trim(), ['https', 'http']),
    onClick: () => {
      if (!props.context.isActive()) return
      setAttempted(true)
      if (!isUrl(url().trim(), ['https', 'http'])) return
      props.onSave(draft())
      props.context.returnToParent()
    }
  }))
  return (
    <UiLayout>
      <UrlField
        label='URL'
        name='label-url'
        value={url()}
        onValue={setUrl}
        schemes={['https', 'http']}
        required
        error={attempted() && !isUrl(url().trim(), ['https', 'http'])}
      />
      <UiField label='Description' for='label-description'>
        <UiInput
          name='label-description'
          value={description()}
          onInput={event => setDescription(event.currentTarget.value)}
        />
      </UiField>
    </UiLayout>
  )
}
