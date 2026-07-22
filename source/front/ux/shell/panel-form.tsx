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

type PanelFormProps = {
  children: UiComponent
  feedback?: PanelFeedback | null
  header: PanelHeaderProps
}

/** Renders a card-backed form panel. */
export const PanelForm = (props: PanelFormProps) => (
  <section data-feat-panel='form'>
    <UiCard elevation='raised'>
      <div data-feat-panel='form-header'>
        <PanelHeader {...props.header} />
        {props.feedback && <UiAlert variant={props.feedback.variant}>{props.feedback.message}</UiAlert>}
      </div>
      <div data-feat-panel='body' data-feat-panel-kind='form'>{props.children}</div>
    </UiCard>
  </section>
)
