/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel sequence header                                                        ║
║ Shared sequence and nested Detail navigation composition.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Presents one navigation axis at a time. Hosts supply their final commit action.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelSequenceHeader  Shared workbench detail header.
*/

import { Show } from '@solid-js'
import { UiActionButton } from '@ux/ui'
import type { UiActionButtonProps, UiComponent } from '@ux/ui'
import type { DrillReturnControl } from './drill-contract.ts'
import { PanelHeaderTitle } from './panel-header-title.tsx'
import { PanelHeader } from './panel-header.tsx'
import type { PanelSequenceControl } from './panel-sequence.tsx'
import './panel-sequence-header.css'

/** Compose sequence navigation with the innermost Detail's local controls. */
export const PanelSequenceHeader = (props: {
  sequence: PanelSequenceControl
  title?: string
  busy: boolean
  drillReturn: DrillReturnControl | null
  trailingAction?: UiActionButtonProps
  commit: UiActionButtonProps
  onBack: () => void
  onNext: () => void
  firstReturn?: Pick<UiActionButtonProps, 'label' | 'onClick'>
}): UiComponent => {
  const title = () => props.title ?? props.sequence.current().title
  const command = (): UiActionButtonProps | undefined => {
    if (props.drillReturn) {
      return {
        icon: 'arrow-up',
        label: props.drillReturn.returnTitle(),
        disabled: props.busy,
        onClick: () => props.drillReturn?.returnToIndex()
      }
    }
    if (!props.sequence.isFirst()) {
      return {
        icon: 'arrow-left',
        label: 'Back',
        disabled: props.busy,
        onClick: props.onBack
      }
    }
    return props.firstReturn
      ? { icon: 'arrow-left', disabled: props.busy, ...props.firstReturn }
      : undefined
  }
  return (
    <div data-shell='sequence-header'>
      <PanelHeader
        leading={
          <PanelHeaderTitle
            title={title()}
            path={props.drillReturn
              ? [props.sequence.current().title, ...props.drillReturn.path()]
              : undefined}
            command={command()}
          />
        }
        trailing={
          <Show
            when={!props.drillReturn}
            fallback={
              <Show when={props.trailingAction}>{action => <UiActionButton {...action()} />}</Show>
            }
          >
            <Show
              when={props.sequence.isLast()}
              fallback={
                <UiActionButton
                  icon='arrow-right'
                  label='Next'
                  labelMode='visible'
                  density='dense'
                  disabled={props.busy}
                  onClick={props.onNext}
                />
              }
            >
              <UiActionButton {...props.commit} />
            </Show>
          </Show>
        }
      />
    </div>
  )
}
