/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Manager                                                                      ║
║ Generic list and panel manager shell driven by a provider contract.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders an item list and editor panel while delegating row and form
content to an item-specific provider.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ManagerProps  Props for a generic item manager.
├ onCancel    Closes the manager.
└ provider    Item-specific list and editor provider.
Manager       Generic list+panel manager component.

SEMANTICS
───────────────────────────────────────────────────────────────────────────────
Calls detail for each Item it opens; that is how an Item hydrates its steps.
Validates through sequence completion and persists through its provider's
create or update. Save takes the final advance slot and is offered only when no
nested Detail is open.

Its aside is always its Collection. It presents no progress, whatever the step
count: the step title in the header and Next versus Save orient the user within
an existing record. Below the threshold, step 1's leading control returns to
the Index and later steps show Back; nothing reaches the Index from a later
step. Above it, selecting another Item or New leaves the Detail from any step.

Snapshots the draft when it opens an Item. Any exit that would discard a
changed draft asks first: another Item, New, the collapsed return, and Cancel.
Hosted in a non-dismissible dialog, it exits only through these explicit
controls and their dirty checks.
*/

import type { Instance } from '@core/std'
import { createEffect, createSignal, For, onCleanup, Show, untrack } from '@solid-js'
import { PanelContainer } from '@ux/shell/panel/panel-container.tsx'
import type { PanelFeedback } from '@ux/shell/panel/panel-contract.ts'
import { PanelForm } from '@ux/shell/panel/panel-form.tsx'
import { PanelHeader } from '@ux/shell/panel/panel-header.tsx'
import { PanelSequenceHeader } from '@ux/shell/panel/panel-sequence-header.tsx'
import { PanelSequenceStep } from '@ux/shell/panel/panel-sequence-step.tsx'
import { createPanelSequence } from '@ux/shell/panel/panel-sequence.tsx'
import { UiActionButton, UiAlert, UiButton, UiDialog } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { CollectionTable } from './collection-table.tsx'
import type { ManagerAction, ManagerCollectionAction, ManagerContract } from './manager-contract.ts'
import { FORM_FEEDBACK_MESSAGE } from './use-form-feedback.ts'
import { focusFirstField } from './use-form-keyboard.ts'
import { createWorkbenchContext } from './workbench-context.ts'
import { WorkbenchDiscard } from './workbench-discard.tsx'
import { copyDraft, isDraftChanged } from './workbench-draft.ts'

import './manager.css'

/** Props for a generic item manager. */
export type ManagerProps<T extends Instance, Draft> = {
  onCancel: () => void
  provider: ManagerContract<T, Draft>
}

/** Mode of the manager: 'list' or 'editor'. */
type ManagerMode = 'list' | 'editor'

/** An action and instance awaiting confirmation. */
type PendingAction<T extends Instance> = {
  action: ManagerAction<T>
  item: T
}

/** Generic item list and editor-panel manager. */
export const Manager = <T extends Instance, Draft>(
  props: ManagerProps<T, Draft>
): UiComponent => {
  const [selected, setSelected] = createSignal<T | null>(null)
  const [mode, setMode] = createSignal<ManagerMode>('list')
  const [session, setSession] = createSignal<
    {
      draft: () => Draft
      complete: () => boolean
      isDirty: () => boolean
      isDrilled: () => boolean
    } | null
  >(null)
  const [pendingExit, setPendingExit] = createSignal<(() => void) | null>(null)
  const [editorFeedback, setEditorFeedback] = createSignal<PanelFeedback | null>(null)
  const [savePending, setSavePending] = createSignal(false)
  const [focusOnEpoch, setFocusOnEpoch] = createSignal(true)
  // Opening the editor is an event, not a state. Selection alone cannot express
  // it: New-then-New leaves `selected` null both times, so nothing downstream
  // re-runs and the previous attempt's error rings and focus survive into what
  // the user reads as a fresh form. This epoch makes every open observable.
  const [editorEpoch, setEditorEpoch] = createSignal(1)
  let panelRef: HTMLElement | undefined
  createEffect(() => {
    editorEpoch()
    if (mode() === 'editor' && focusOnEpoch()) focusFirstField(() => panelRef)
  })
  const [pendingAction, setPendingAction] = createSignal<PendingAction<T> | null>(null)
  const [actionError, setActionError] = createSignal<string | null>(null)
  const [actionPending, setActionPending] = createSignal(false)
  const [collectionError, setCollectionError] = createSignal<string | null>(null)

  /** Advances the editor epoch and resets editor registration for a fresh render. */
  const bumpEditorEpoch = (focus: boolean): void => {
    setFocusOnEpoch(focus)
    setEditorEpoch(epoch => epoch + 1)
  }

  /** Opens the editor for a selected item or a new draft. */
  const openEditor = (item: T | null): void => {
    if (savePending() || actionPending()) return
    setEditorFeedback(null)
    setSelected(() => item)
    setMode('editor')
    bumpEditorEpoch(true)
  }

  /** Opens the selected list item in the editor. */
  const onSelect = (item: T): void => requestExit(() => openEditor(item))

  /** Opens the editor for a new item. */
  const onNew = (): void => requestExit(() => openEditor(null))

  /** Reopens a new-item editor after create or destructive action completion. */
  const openFreshNew = (clearFeedback: boolean): void => {
    if (clearFeedback) setEditorFeedback(null)
    setSelected(null)
    setMode('editor')
    bumpEditorEpoch(true)
  }

  /** Shortcuts discard the enclosing context only after one confirmation. */
  const requestExit = (action: () => void): void => {
    if (savePending() || actionPending()) return
    if (session()?.isDirty()) setPendingExit(() => action)
    else action()
  }

  const cancelDialog = (): void => requestExit(props.onCancel)

  /** Resolve display copy for an item. */
  const itemLabel = (item: T): string => props.provider.itemLabel?.(item) ?? props.provider.entityLabel

  // Update remains on the saved record, so its epoch bump deliberately skips
  // focus — which leaves focus on the body. The banner is the landing spot: it
  // is the thing that changed, it announces the result, and Tab from there
  // enters the form. Create needs none of this; it focuses its first field.

  /** Moves focus to the feedback banner after an update save completes. */
  const focusFeedback = (): void => {
    requestAnimationFrame(() => {
      panelRef?.querySelector<HTMLElement>('[data-shell-panel="form-feedback"]')?.focus()
    })
  }

  /** Validates and persists the active editor draft. */
  const saveEditor = async (): Promise<void> => {
    if (savePending() || actionPending() || session()?.isDrilled()) return
    setEditorFeedback(null)
    const handle = session()
    if (!handle) {
      setEditorFeedback({ message: 'Editor is not ready to save.', variant: 'danger' })
      return
    }
    if (!handle.complete()) {
      setEditorFeedback({ message: FORM_FEEDBACK_MESSAGE, variant: 'danger' })
      return
    }
    const item = selected()
    const draft = handle.draft()
    setSavePending(true)
    try {
      if (item) {
        const updated = await props.provider.update(item, draft)
        await props.provider.refresh()
        setSelected(() => updated)
        setMode('editor')
        bumpEditorEpoch(false)
        setEditorFeedback({ message: `Saved ${itemLabel(updated)}.`, variant: 'success' })
        focusFeedback()
      } else {
        const created = await props.provider.create(draft)
        await props.provider.refresh()
        openFreshNew(false)
        setEditorFeedback({ message: `Created ${itemLabel(created)}.`, variant: 'success' })
      }
    } catch (error) {
      setEditorFeedback({
        message: error instanceof Error ? error.message : `${props.provider.entityLabel} save failed.`,
        variant: 'danger'
      })
    } finally {
      setSavePending(false)
    }
  }

  /** Clears editor feedback, runs a provider action, and refreshes the list. */
  const runAction = async (action: PendingAction<T>['action'], item: T): Promise<void> => {
    setEditorFeedback(null)
    await action.handler(item)
    await props.provider.refresh()
    if (selected()?.id === item.id) openFreshNew(true)
  }

  /** Requests an item action, opening confirmation when the action requires it. */
  const requestAction = (action: PendingAction<T>['action'], item: T): void => {
    if (!action.confirmation) {
      void runAction(action, item)
      return
    }
    setActionError(null)
    setPendingAction({ action, item })
  }

  /** Confirms and runs the pending provider action. */
  const confirmAction = async (): Promise<void> => {
    const target = pendingAction()
    if (!target || actionPending()) return
    setActionPending(true)
    setActionError(null)
    try {
      await runAction(target.action, target.item)
      setPendingAction(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : `${target.action.label} failed.`)
    } finally {
      setActionPending(false)
    }
  }

  /** Runs a collection action under the pending lock and reports failures. */
  const runCollectionAction = async (action: ManagerCollectionAction): Promise<void> => {
    if (savePending() || actionPending()) return
    setActionPending(true)
    setCollectionError(null)
    try {
      await action.handler()
      await props.provider.refresh()
    } catch (error) {
      setCollectionError(error instanceof Error ? error.message : `${action.label} failed.`)
    } finally {
      setActionPending(false)
    }
  }

  /** Editor title copy for new and existing items. */
  const editorTitle = (): string =>
    selected()
      ? `Edit ${props.provider.entityLabel}`
      : `New ${props.provider.entityLabel}`

  /** Each open creates one owned state lifetime, shared across its step mounts. */
  const Detail = (): UiComponent => {
    const detail = props.provider.detail(untrack(selected))
    const baseline = copyDraft(detail.draft())
    const sequence = createPanelSequence(() => detail.steps)
    const workbench = createWorkbenchContext(
      sequence,
      setEditorFeedback,
      () => savePending() || actionPending()
    )
    const active = {
      draft: detail.draft,
      complete: sequence.complete,
      isDrilled: (): boolean => workbench.drillReturn() !== null,
      isDirty: (): boolean => isDraftChanged(detail.draft(), baseline) || workbench.isDirty()
    }
    setSession(() => active)
    onCleanup(() => setSession(current => current === active ? null : current))
    const back = (): void => {
      if (savePending() || actionPending() || active.isDrilled()) return
      setEditorFeedback(null)
      sequence.back()
    }
    const next = (): void => {
      if (savePending() || actionPending() || active.isDrilled()) return
      setEditorFeedback(sequence.next() ? null : { message: FORM_FEEDBACK_MESSAGE, variant: 'danger' })
    }
    const header = (collapsed: boolean): UiComponent => (
      <PanelSequenceHeader
        sequence={sequence}
        title={detail.steps.length === 1 ? editorTitle() : undefined}
        busy={savePending() || actionPending()}
        drillReturn={workbench.drillReturn()}
        trailingAction={workbench.trailingAction()}
        onBack={back}
        onNext={next}
        firstReturn={collapsed
          ? {
            label: `${props.provider.entityLabel}s`,
            onClick: () =>
              requestExit(() => {
                setMode('list')
                setSelected(null)
                bumpEditorEpoch(false)
              })
          }
          : undefined}
        commit={{
          icon: 'check',
          label: 'Save',
          labelMode: 'visible',
          density: 'dense',
          disabled: savePending() || actionPending(),
          loading: savePending(),
          onClick: () => void saveEditor()
        }}
      />
    )
    return (
      <PanelForm
        feedback={editorFeedback()}
        header={
          <>
            <div data-shell='manager-collapse-action'>{header(true)}</div>
            <div data-shell='manager-expanded-title'>{header(false)}</div>
          </>
        }
      >
        <PanelSequenceStep sequence={sequence} context={workbench.context} />
      </PanelForm>
    )
  }

  return (
    <>
      <PanelContainer
        feature='manager'
        mode={mode()}
        header={
          <PanelHeader
            leading={<h1>{props.provider.formTitle}</h1>}
            trailing={
              <UiActionButton
                icon='cross-1'
                label='Cancel'
                labelMode='visible'
                density='dense'
                disabled={savePending() || actionPending()}
                onClick={cancelDialog}
              />
            }
          />
        }
        aside={
          <CollectionTable
            provider={props.provider}
            activate={onSelect}
            error={collectionError()}
            headingActions={
              <>
                <For each={props.provider.collectionActions}>
                  {action => (
                    <UiActionButton
                      name={action.name}
                      icon={action.icon}
                      label={action.label}
                      labelMode='visible'
                      density='dense'
                      disabled={savePending() || actionPending()}
                      onClick={() => void runCollectionAction(action)}
                    />
                  )}
                </For>
                <UiActionButton
                  icon='plus'
                  label={`New ${props.provider.entityLabel}`}
                  labelMode='visible'
                  density='dense'
                  disabled={savePending() || actionPending()}
                  onClick={onNew}
                />
              </>
            }
            renderActions={item => (
              <For each={props.provider.actions}>
                {action => (
                  <UiActionButton
                    icon={action.icon}
                    label={action.label}
                    variant={action.variant}
                    disabled={savePending() || actionPending()}
                    density='dense'
                    onClick={event => {
                      event.stopPropagation()
                      requestAction(action, item)
                    }}
                  />
                )}
              </For>
            )}
          />
        }
        mainRef={element => panelRef = element}
        main={<Show when={editorEpoch()} keyed>{_epoch => <Detail />}</Show>}
      />
      <Show when={pendingExit()}>
        {action => (
          <WorkbenchDiscard
            onCancel={() => setPendingExit(null)}
            onDiscard={() => {
              const proceed = action()
              setPendingExit(null)
              proceed()
            }}
          />
        )}
      </Show>
      <Show when={pendingAction()}>
        {target => (
          <UiDialog
            open
            size='content'
            onOpenChange={open => {
              if (!open && !actionPending()) setPendingAction(null)
            }}
          >
            <div data-shell='manager-confirmation'>
              <h2>{target().action.confirmation?.title}</h2>
              <p>{target().action.confirmation?.message(target().item)}</p>
              <Show when={actionError()}>
                {message => <UiAlert variant='danger'>{message()}</UiAlert>}
              </Show>
              <div data-shell='manager-confirmation-actions'>
                <UiButton disabled={actionPending()} onClick={() => setPendingAction(null)}>
                  Cancel
                </UiButton>
                <UiButton
                  disabled={actionPending()}
                  loading={actionPending()}
                  variant='danger'
                  onClick={() => void confirmAction()}
                >
                  {target().action.label}
                </UiButton>
              </div>
            </div>
          </UiDialog>
        )}
      </Show>
    </>
  )
}
