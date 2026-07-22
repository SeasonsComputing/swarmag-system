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

import {
  UiActionButton,
  UiAlert,
  UiButton,
  UiCard,
  type UiComponent,
  UiLayout,
  UiList,
  UiListItem
} from '@front/ux/ui'
import { createMemo, createSignal, For, Show } from '@solid-js'
import type { WizardContract, WizardFeedback } from './wizard-contract.ts'

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

  const banner = createMemo<WizardFeedback | null>(() => {
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
    if (!canAdvance() || committing()) return
    setError(null)
    const current = stage()
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
    <div data-feat='wizard' data-feat-step={stage().name}>
      <header data-feat='wizard-title-row'>
        <h1 data-feat='wizard-title'>{props.contract.formTitle}</h1>
        <UiActionButton
          icon='cross-1'
          label='Cancel'
          labelMode='visible'
          onClick={() => props.onCancel()}
        />
      </header>
      <div data-feat='wizard-content'>
        <UiLayout variant='block-fill'>
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
          <UiCard elevation='raised'>
            <header data-feat='wizard-card-header'>
              <nav aria-label='Wizard navigation' data-feat='wizard-navigation'>
                <UiActionButton
                  align='start'
                  icon='arrow-left'
                  label='Back'
                  labelMode='visible'
                  disabled={isFirst() || committing()}
                  onClick={back}
                />
                <Show
                  when={isLast()}
                  fallback={
                    <UiActionButton
                      icon='arrow-right'
                      label='Next'
                      labelMode='visible'
                      disabled={!canAdvance() || committing()}
                      loading={committing()}
                      onClick={() => void advance()}
                    />
                  }
                >
                  <UiButton
                    variant='primary'
                    disabled={!canAdvance() || committing()}
                    loading={committing()}
                    onClick={() => void advance()}
                  >
                    Finish
                  </UiButton>
                </Show>
              </nav>
            </header>
            <div data-feat='wizard-card-body'>
              <Show when={banner()}>
                {feedback => <UiAlert variant={feedback().variant}>{feedback().message}</UiAlert>}
              </Show>
              <Show when={stage()} keyed>
                {current => (
                  <div data-feat='wizard-stage' data-feat-step={current.name}>
                    {current.render()}
                  </div>
                )}
              </Show>
            </div>
          </UiCard>
        </UiLayout>
      </div>
    </div>
  )
}
