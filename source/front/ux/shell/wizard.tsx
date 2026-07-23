/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Wizard                                                                       ║
║ Guided multi-step form host with commit sequencing and error handling.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders a multi-step wizard shell that sequences stages, manages local commit
state, displays provider feedback, and orchestrates navigation and completion.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Wizard                  The wizard host component.
WizardProps             Props for the wizard host.
*/

import { UiActionButton, UiButton, type UiComponent, UiList, UiListItem } from '@front/ux/ui'
import { createMemo, createSignal, For, Show } from '@solid-js'
import { PanelContainer } from './panel-container.tsx'
import type { PanelFeedback } from './panel-contract.ts'
import { PanelForm } from './panel-form.tsx'
import { PanelHeader } from './panel-header.tsx'
import { PanelTimeline } from './panel-timeline.tsx'
import { FORM_FEEDBACK_MESSAGE } from './use-abstraction-form-feedback.ts'
import type { WizardContract } from './wizard-contract.ts'

import './wizard.css'

/** Props for the wizard host component. */
export type WizardProps = {
  contract: WizardContract
  onFinish: () => void
  onCancel: () => void
}

/** The wizard host component. */
export const Wizard = (props: WizardProps): UiComponent => {
  const [stepIndex, setStepIndex] = createSignal(0)
  const [committing, setCommitting] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const stage = createMemo(() => props.contract.stages[stepIndex()])
  const isFirst = () => stepIndex() === 0
  const isLast = () => stepIndex() === props.contract.stages.length - 1
  const canAdvance = () => stage().canAdvance()

  const stepState = (index: number) =>
    index < stepIndex() ? 'done' : index === stepIndex() ? 'current' : 'upcoming'

  const barFill = (): string =>
    `${(((stepIndex() + 0.5) / props.contract.stages.length) * 100).toFixed(3)}%`

  const banner = createMemo<PanelFeedback | null>(() => {
    const e = error()
    if (e) return { message: e, variant: 'danger' }
    return props.contract.feedback?.() ?? null
  })

  const back = (): void => {
    if (isFirst() || committing()) return
    setError(null)
    setStepIndex(i => i - 1)
  }

  const advance = async (): Promise<void> => {
    if (committing()) return
    const current = stage()
    // Next stays live on an incomplete stage. Asking the stage to validate makes
    // it show its own field errors and say why, which a disabled button cannot.
    if (!(current.validate?.() ?? true) || !canAdvance()) {
      setError(FORM_FEEDBACK_MESSAGE)
      return
    }
    setError(null)
    if (current.commit) {
      setCommitting(true)
      try {
        await current.commit()
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : `${current.title} could not be saved.`
        )
        return
      } finally {
        setCommitting(false)
      }
    }
    if (isLast()) {
      props.onFinish()
      return
    }
    setStepIndex(i => i + 1)
  }

  return (
    <PanelContainer
      feature='wizard'
      header={
        <PanelHeader
          leading={<h1>{props.contract.formTitle}</h1>}
          trailing={
            <UiActionButton
              icon='cross-1'
              label='Cancel'
              labelMode='visible'
              onClick={() => props.onCancel()}
            />
          }
        />
      }
      accessory={
        <div data-feat='wizard-indicator'>
          <div aria-hidden='true' data-feat='wizard-bar'>
            <div data-feat='wizard-bar-fill' style={{ 'inline-size': barFill() }} />
          </div>
          <UiList data-feat='wizard-steps'>
            <For each={props.contract.stages}>
              {(item, index) => (
                <UiListItem data-feat='wizard-step' data-feat-state={stepState(index())}>
                  <span data-feat='wizard-step-ordinal'>{index() + 1}</span>
                  <span data-feat='wizard-step-title'>{item.title}</span>
                </UiListItem>
              )}
            </For>
          </UiList>
        </div>
      }
      index={
        <PanelTimeline
          items={props.contract.stages.map((item, index) => ({
            state: stepState(index),
            title: item.title
          }))}
        />
      }
      subject={
        <PanelForm
          feedback={banner()}
          header={{
            leading: (
              <UiActionButton
                align='start'
                icon='arrow-left'
                label='Back'
                labelMode='visible'
                disabled={isFirst() || committing()}
                onClick={back}
              />
            ),
            trailing: (
              <Show
                when={isLast()}
                fallback={
                  <UiActionButton
                    icon='arrow-right'
                    label='Next'
                    labelMode='visible'
                    disabled={committing()}
                    loading={committing()}
                    onClick={() => void advance()}
                  />
                }
              >
                <UiButton
                  variant='primary'
                  disabled={committing()}
                  loading={committing()}
                  onClick={() => void advance()}
                >
                  Finish
                </UiButton>
              </Show>
            )
          }}
        >
          <Show when={stage()} keyed>
            {current => (
              <div data-feat='wizard-stage' data-feat-step={current.name}>
                {current.render()}
              </div>
            )}
          </Show>
        </PanelForm>
      }
    />
  )
}
