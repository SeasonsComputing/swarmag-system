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

import { UiActionButton, type UiComponent, UiList, UiListItem } from '@front/ux/ui'
import { createMemo, createSignal, For, Show } from '@solid-js'
import type { DrillReturnControl } from './drill-contract.ts'
import { PanelContainer } from './panel-container.tsx'
import type { PanelFeedback } from './panel-contract.ts'
import { PanelForm } from './panel-form.tsx'
import { PanelHeaderTitle } from './panel-header-title.tsx'
import { PanelHeader } from './panel-header.tsx'
import { PanelStepflow } from './panel-stepflow.tsx'
import { FORM_FEEDBACK_MESSAGE } from './use-abstraction-form-feedback.ts'
import type { WizardContract } from './wizard-contract.ts'

import './wizard.css'

/** Props for the wizard host component. */
export type WizardProps = {
  contract: WizardContract
  onFinish: () => void
  onCancel: () => void
}

/** Direction of travel along the wizard's sequence axis. */
type WizardDirection = 'forward' | 'backward'

/** The wizard host component. */
export const Wizard = (props: WizardProps): UiComponent => {
  const [stepIndex, setStepIndex] = createSignal(0)
  const [direction, setDirection] = createSignal<WizardDirection>('forward')
  const [committing, setCommitting] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [drillReturn, setDrillReturn] = createSignal<DrillReturnControl | null>(null)

  /** Active wizard stage resolved from the current step index. */
  const stage = createMemo(() => props.contract.stages[stepIndex()])

  /** Whether the current stage is the first stage. */
  const isFirst = () => stepIndex() === 0

  /** Whether the current stage is the final stage. */
  const isLast = () => stepIndex() === props.contract.stages.length - 1

  /** Whether the active stage is presenting nested drill-down detail. */
  const isDrilled = () => drillReturn() !== null

  /** Header orientation path for nested drill-down detail inside the active stage. */
  const drillPath = (): readonly string[] => [stage().title, ...(drillReturn()?.path() ?? [])]

  /** Whether the current stage permits forward navigation. */
  const canAdvance = () => stage().canAdvance()

  /** Visual state for a step in the wizard progress list. */
  const stepState = (index: number) =>
    index < stepIndex() ? 'done' : index === stepIndex() ? 'current' : 'upcoming'

  /** Fill width for the wizard progress bar. */
  const barFill = (): string =>
    `${(((stepIndex() + 0.5) / props.contract.stages.length) * 100).toFixed(3)}%`

  /** Feedback banner combining local commit errors with provider feedback. */
  const banner = createMemo<PanelFeedback | null>(() => {
    const e = error()
    if (e) return { message: e, variant: 'danger' }
    return props.contract.feedback?.() ?? null
  })

  /** Move to the previous wizard stage when allowed. */
  const back = (): void => {
    if (isFirst() || committing() || isDrilled()) return
    setError(null)
    setDirection('backward')
    setDrillReturn(null)
    setStepIndex(i => i - 1)
  }

  /** Validate, commit, and advance the active wizard stage. */
  const advance = async (): Promise<void> => {
    if (committing() || isDrilled()) return
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
      } catch (error) {
        setError(
          error instanceof Error ? error.message : `${current.title} could not be saved.`
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
    setDirection('forward')
    setDrillReturn(null)
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
              density='dense'
              onClick={() => props.onCancel()}
            />
          }
        />
      }
      accessory={
        <div data-shell='wizard-indicator'>
          <div aria-hidden='true' data-shell='wizard-bar'>
            <div data-shell='wizard-bar-fill' style={{ 'inline-size': barFill() }} />
          </div>
          <UiList data-shell='wizard-steps'>
            <For each={props.contract.stages}>
              {(item, index) => (
                <UiListItem data-shell='wizard-step' data-shell-state={stepState(index())}>
                  <span data-shell='wizard-step-label'>
                    <span data-shell='wizard-step-ordinal'>{index() + 1}</span>
                    <span data-shell='wizard-step-title'>{item.title}</span>
                  </span>
                </UiListItem>
              )}
            </For>
          </UiList>
        </div>
      }
      aside={
        <PanelStepflow
          items={props.contract.stages.map((item, index) => ({
            state: stepState(index),
            title: item.title
          }))}
        />
      }
      main={
        <PanelForm
          feedback={banner()}
          header={{
            leading: (
              <Show
                when={isDrilled()}
                fallback={
                  <PanelHeaderTitle
                    title={stage().title}
                    command={isFirst()
                      ? undefined
                      : {
                        icon: 'arrow-left',
                        label: 'Back',
                        disabled: committing(),
                        onClick: back
                      }}
                  />
                }
              >
                <PanelHeaderTitle
                  title={stage().title}
                  path={drillPath()}
                  command={{
                    icon: 'arrow-up',
                    label: drillReturn()?.returnTitle() ?? stage().title,
                    disabled: committing(),
                    onClick: () => drillReturn()?.returnToIndex()
                  }}
                />
              </Show>
            ),
            trailing: (
              <Show
                when={!isDrilled()}
                fallback={
                  <Show when={stage().trailingAction?.()}>
                    {action => <UiActionButton {...action()} />}
                  </Show>
                }
              >
                <Show
                  when={isLast()}
                  fallback={
                    <UiActionButton
                      icon='arrow-right'
                      label='Next'
                      labelMode='visible'
                      density='dense'
                      disabled={committing()}
                      loading={committing()}
                      onClick={() => void advance()}
                    />
                  }
                >
                  <UiActionButton
                    icon='check'
                    label='Finish'
                    labelMode='visible'
                    density='dense'
                    disabled={committing()}
                    loading={committing()}
                    onClick={() => void advance()}
                  />
                </Show>
              </Show>
            )
          }}
        >
          <Show when={stage()} keyed>
            {current => (
              <div
                data-shell='wizard-stage'
                data-shell-direction={direction()}
                data-shell-step={current.name}
              >
                {current.render({ registerDrillReturn: setDrillReturn })}
              </div>
            )}
          </Show>
        </PanelForm>
      }
    />
  )
}
