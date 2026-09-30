/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel form                                                                   ║
║ Card-backed form panel with header-local feedback.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { UiAlert, UiCard } from '@ux/ui'
import type { UiComponent, UiContainerProps } from '@ux/ui'
import type { PanelFeedback } from './panel-contract.ts'

import './panel-form.css'

/** Represents the props for the PanelForm component. */
export type PanelFormProps = UiContainerProps & {
  feedback?: PanelFeedback | null
  header: UiComponent
}

/** Renders a card-backed form panel. */
export const PanelForm = (props: PanelFormProps) => (
  <section data-shell-panel='form'>
    <UiCard elevation='raised'>
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
