/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Wizard                                                                       ║
║ Guided sequence host with one final commit.                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Hosts reusable steps, contextual drafts, sequence orientation, and completion.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Wizard       The wizard host component.
WizardProps  Props for the wizard host.
*/

import { createMemo, createSignal, Show } from '@solid-js'
import { PanelContainer } from '@ux/shell/panel/panel-container.tsx'
import type { PanelFeedback } from '@ux/shell/panel/panel-contract.ts'
import { PanelForm } from '@ux/shell/panel/panel-form.tsx'
import { PanelHeader } from '@ux/shell/panel/panel-header.tsx'
import { PanelSequenceHeader } from '@ux/shell/panel/panel-sequence-header.tsx'
import { PanelSequenceProgress } from '@ux/shell/panel/panel-sequence-progress.tsx'
import { PanelSequenceStep } from '@ux/shell/panel/panel-sequence-step.tsx'
import { createPanelSequence } from '@ux/shell/panel/panel-sequence.tsx'
import { PanelStepflow } from '@ux/shell/panel/panel-stepflow.tsx'
import { UiActionButton } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { FORM_FEEDBACK_MESSAGE } from './use-abstraction-form-feedback.ts'
import type { WizardContract } from './wizard-contract.ts'
import { createWorkbenchContext, WorkbenchDiscard } from './workbench-context.tsx'
import './wizard.css'

/** Props for the wizard host component. */
export type WizardProps = {
  contract: WizardContract
  onFinish: () => void
  onCancel: () => void
}

/** Host a complete sequence and persist only at Finish. */
export const Wizard = (props: WizardProps): UiComponent => {
  const sequence = createPanelSequence(() => props.contract.steps)
  const [committing, setCommitting] = createSignal(false)
  const [feedback, setFeedback] = createSignal<PanelFeedback | null>(null)
  const [discard, setDiscard] = createSignal(false)
  const workbench = createWorkbenchContext(sequence, setFeedback, committing)
  const banner = createMemo(() => feedback() ?? props.contract.feedback?.() ?? null)
  const back = (): void => {
    if (committing() || workbench.drillReturn()) return
    setFeedback(null)
    sequence.back()
  }
  const advance = async (): Promise<void> => {
    if (committing() || workbench.drillReturn()) return
    const last = sequence.isLast()
    if (!(last ? sequence.complete() : sequence.next())) {
      setFeedback({ message: FORM_FEEDBACK_MESSAGE, variant: 'danger' })
      return
    }
    setFeedback(null)
    if (!last) return
    setCommitting(true)
    try {
      await props.contract.commit()
      props.onFinish()
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : 'Unable to finish.',
        variant: 'danger'
      })
    } finally {
      setCommitting(false)
    }
  }
  const cancel = (): void => {
    if (committing()) return
    if (workbench.isDirty()) setDiscard(true)
    else props.onCancel()
  }
  return (
    <>
      <PanelContainer
        feature='wizard'
        mode={props.contract.steps.length === 1 ? 'single' : 'sequence'}
        header={
          <PanelHeader
            leading={<h1>{props.contract.formTitle}</h1>}
            trailing={
              <UiActionButton
                icon='cross-1'
                label='Cancel'
                labelMode='visible'
                density='dense'
                disabled={committing()}
                onClick={cancel}
              />
            }
          />
        }
        accessory={props.contract.steps.length > 1
          ? <PanelSequenceProgress sequence={sequence} />
          : undefined}
        aside={props.contract.steps.length > 1
          ? (
            <PanelStepflow
              items={props.contract.steps.map((step, index) => ({
                title: step.title,
                state: index < sequence.index()
                  ? 'done'
                  : index === sequence.index()
                  ? 'current'
                  : 'upcoming'
              }))}
            />
          )
          : undefined}
        main={
          <PanelForm
            feedback={banner()}
            header={
              <PanelSequenceHeader
                sequence={sequence}
                busy={committing()}
                drillReturn={workbench.drillReturn()}
                trailingAction={workbench.trailingAction()}
                onBack={back}
                onNext={() => void advance()}
                commit={{
                  icon: 'check',
                  label: 'Finish',
                  labelMode: 'visible',
                  density: 'dense',
                  disabled: committing(),
                  loading: committing(),
                  onClick: () => void advance()
                }}
              />
            }
          >
            <PanelSequenceStep sequence={sequence} context={workbench.context} />
          </PanelForm>
        }
      />
      <Show when={discard()}>
        <WorkbenchDiscard onCancel={() => setDiscard(false)} onDiscard={props.onCancel} />
      </Show>
    </>
  )
}
