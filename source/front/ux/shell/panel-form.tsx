/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel form                                                                   ║
║ Card-backed form panel with header-local feedback.                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { UiAlert, UiCard, type UiComponent } from '@front/ux/ui'
import type { PanelFeedback, PanelHeaderProps } from './panel-contract.ts'
import { PanelHeader } from './panel-header.tsx'

import './panel-form.css'

/** Represents the props for the PanelForm component. */
type PanelFormProps = {
  children: UiComponent
  feedback?: PanelFeedback | null
  header: PanelHeaderProps
}

/** Renders a card-backed form panel. */
export const PanelForm = (props: PanelFormProps) => (
  <section data-shell-panel='form'>
    <UiCard elevation='raised'>
      <div data-shell-panel='form-header'>
        <PanelHeader {...props.header} />
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
