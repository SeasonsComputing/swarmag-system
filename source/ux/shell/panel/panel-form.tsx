/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel form                                                                   ║
║ Card-backed form panel with header-local feedback.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelForm        Card-backed form panel.
PanelFormProps   Form panel container properties.
├ feedback       Header-local alert, if any.
├ header         Header content.
└ variant        Optional light or dark tonal surface; defaults to a raised card.
*/

import { UiAlert, UiCard } from '@ux/ui'
import type { UiComponent, UiContainerProps } from '@ux/ui'
import type { UiCardProps } from '@ux/ui/components/ui-card.tsx'
import type { PanelFeedback } from './panel-contract.ts'

import './panel-form.css'

/** Represents the props for the PanelForm component. */
export type PanelFormProps =
  & UiContainerProps
  & {
    feedback?: PanelFeedback | null
    header: UiComponent
  }
  & Pick<UiCardProps, 'variant'>

/** Renders a card-backed form panel. */
export const PanelForm = (props: PanelFormProps) => (
  <section data-shell-panel='form'>
    <UiCard
      {...(props.variant
        ? { variant: props.variant }
        : { elevation: 'raised' as const })}
    >
      <div data-shell-panel='form-header'>
        {props.header}
        {props.feedback && (
          <UiAlert data-shell-panel='form-feedback' tabindex={-1} variant={props.feedback.variant}>
            {props.feedback.message}
          </UiAlert>
        )}
      </div>
      <div data-shell-panel='body' data-shell-panel-kind='form'>{props.children}</div>
    </UiCard>
  </section>
)
