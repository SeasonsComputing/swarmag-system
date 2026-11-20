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
├ contract   Aggregate draft, composed steps, and final commit.
├ onFinish   Called after a successful commit.
└ onCancel   Closes the wizard after discard protection.

SEMANTICS
───────────────────────────────────────────────────────────────────────────────
Commits once, at Finish; the commit may write one abstraction, several, or
none. Above its container threshold, it presents a titled stepflow tree in its
aside (PanelStepflow). Below the threshold, the aside is absent. Context,
navigation, and guarded Close belong to the main panel; there is no horizontal
progress display or outer dialog header.

Snapshots the aggregate draft on mount. Cancel checks that aggregate and all
registered local drafts, asking once before discarding changes. Back/Next
preserves the aggregate draft and its baseline across step mounts.
*/

import { createMemo, createSignal, Show } from '@solid-js'
import { PanelClose } from '@ux/shell/panel/panel-close.tsx'
import { PanelContainer } from '@ux/shell/panel/panel-container.tsx'
import type { PanelFeedback } from '@ux/shell/panel/panel-contract.ts'
import { PanelForm } from '@ux/shell/panel/panel-form.tsx'
import { PanelHeaderTitle } from '@ux/shell/panel/panel-header-title.tsx'
import { PanelSequenceHeader } from '@ux/shell/panel/panel-sequence-header.tsx'
import { PanelSequenceStep } from '@ux/shell/panel/panel-sequence-step.tsx'
import { createPanelSequence } from '@ux/shell/panel/panel-sequence.tsx'
import { PanelStepflow } from '@ux/shell/panel/panel-stepflow.tsx'
import { UiConfirmDialog } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { FORM_FEEDBACK_MESSAGE } from './use-form-feedback.ts'
import type { WizardContract } from './wizard-contract.ts'
import { createWorkbenchContext } from './workbench-context.ts'
import { copyDraft, isDraftChanged } from './workbench-draft.ts'
import './wizard.css'

/** Props for the wizard host component. */
export type WizardProps<Draft> = {
  contract: WizardContract<Draft>
  onFinish: () => void
  onCancel: () => void
}

/** Host a complete sequence and persist only at Finish. */
export const Wizard = <Draft extends unknown>(props: WizardProps<Draft>): UiComponent => {
  const baseline = copyDraft(props.contract.draft())
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
    if (isDraftChanged(props.contract.draft(), baseline) || workbench.isDirty()) setDiscard(true)
    else props.onCancel()
  }
  return (
    <>
      <PanelContainer
        feature='wizard'
        mode={props.contract.steps.length === 1 ? 'single' : 'sequence'}
        aside={props.contract.steps.length > 1
          ? (
            <PanelStepflow
              variant='tonal-dark'
              header={{
                contextTitle: props.contract.formTitle,
                leading: <PanelHeaderTitle title={props.contract.stepsTitle ?? 'Steps'} />
              }}
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
            variant='tonal-light'
            feedback={banner()}
            header={
              <PanelSequenceHeader
                sequence={sequence}
                contextTitle={sequence.isFirst() ? props.contract.formTitle : undefined}
                hostActions={
                  <PanelClose disabled={committing()} onClick={cancel} />
                }
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
        <UiConfirmDialog
          title='Discard unsaved changes?'
          message='Unsaved changes in this workbench will be discarded.'
          action={{ label: 'Discard' }}
          onConfirm={props.onCancel}
          onCancel={() => setDiscard(false)}
        />
      </Show>
    </>
  )
}
