/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Abstraction manager                                                          ║
║ Generic list and panel manager shell driven by a provider contract.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders an abstraction list and editor panel while delegating row and form
content to an abstraction-specific provider.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AbstractionManager  Generic list+panel manager component.
*/

import type { Instantiable } from '@core/std'
import { createEffect, createSignal, For, onCleanup, Show, untrack } from '@solid-js'
import { PanelContainer } from '@ux/shell/panel/panel-container.tsx'
import type { PanelFeedback } from '@ux/shell/panel/panel-contract.ts'
import { PanelForm } from '@ux/shell/panel/panel-form.tsx'
import { PanelHeader } from '@ux/shell/panel/panel-header.tsx'
import { PanelList } from '@ux/shell/panel/panel-list.tsx'
import { PanelSequenceHeader } from '@ux/shell/panel/panel-sequence-header.tsx'
import { PanelSequenceStep } from '@ux/shell/panel/panel-sequence-step.tsx'
import { createPanelSequence } from '@ux/shell/panel/panel-sequence.tsx'
import {
  UiActionButton,
  UiAlert,
  UiButton,
  UiDialog,
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHeader,
  UiTableRow
} from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import type { AbstractionAction, AbstractionManagerContract } from './abstraction-manager-contract.ts'
import { FORM_FEEDBACK_MESSAGE } from './use-abstraction-form-feedback.ts'
import { focusFirstField } from './use-abstraction-form-keyboard.ts'
import { createWorkbenchContext, WorkbenchDiscard } from './workbench-context.tsx'

import './abstraction-manager.css'

/** Props for a generic abstraction manager. */
export type AbstractionManagerProps<T extends Instantiable, Draft> = {
  onCancel: () => void
  provider: AbstractionManagerContract<T, Draft>
}

/** Mode of the abstraction manager: 'list' or 'editor'. */
type AbstractionManagerMode = 'list' | 'editor'

/** An action and instance awaiting confirmation. */
type PendingAction<T extends Instantiable> = {
  action: AbstractionAction<T>
  item: T
}

/** Generic abstraction list and editor-panel manager. */
export const AbstractionManager = <T extends Instantiable, Draft>(
  props: AbstractionManagerProps<T, Draft>
): UiComponent => {
  const [selected, setSelected] = createSignal<T | null>(null)
  const [mode, setMode] = createSignal<AbstractionManagerMode>('list')
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

  /** Resolve display copy for an abstraction instance. */
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
    if (savePending() || session()?.isDrilled()) return
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

  /** Runs a provider action and refreshes the list after completion. */
  const runAction = async (action: PendingAction<T>['action'], item: T): Promise<void> => {
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

  /** Editor title copy for new and existing items. */
  const editorTitle = (): string =>
    selected()
      ? `Edit ${props.provider.entityLabel}`
      : `New ${props.provider.entityLabel}`

  /** Each open creates one owned state lifetime, shared across its step mounts. */
  const Detail = (): UiComponent => {
    const detail = props.provider.detail(untrack(selected))
    const baseline = JSON.stringify(detail.draft())
    const sequence = createPanelSequence(() => detail.steps)
    const workbench = createWorkbenchContext(sequence, setEditorFeedback, savePending)
    const active = {
      draft: detail.draft,
      complete: sequence.complete,
      isDrilled: () => workbench.drillReturn() !== null,
      isDirty: () => JSON.stringify(detail.draft()) !== baseline || workbench.isDirty()
    }
    setSession(() => active)
    onCleanup(() => setSession(current => current === active ? null : current))
    const back = (): void => {
      if (savePending() || active.isDrilled()) return
      setEditorFeedback(null)
      sequence.back()
    }
    const next = (): void => {
      if (savePending() || active.isDrilled()) return
      setEditorFeedback(sequence.next() ? null : { message: FORM_FEEDBACK_MESSAGE, variant: 'danger' })
    }
    const header = (collapsed: boolean): UiComponent => (
      <PanelSequenceHeader
        sequence={sequence}
        title={detail.steps.length === 1 ? editorTitle() : undefined}
        busy={savePending()}
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
          disabled: savePending(),
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
            <div data-shell='abstraction-manager-collapse-action'>{header(true)}</div>
            <div data-shell='abstraction-manager-expanded-title'>{header(false)}</div>
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
        feature='abstraction-manager'
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
          <PanelList
            header={{
              leading: <h2>{props.provider.entityLabel}s</h2>,
              trailing: (
                <UiActionButton
                  icon='plus'
                  label={`New ${props.provider.entityLabel}`}
                  labelMode='visible'
                  density='dense'
                  disabled={savePending() || actionPending()}
                  onClick={onNew}
                />
              )
            }}
          >
            <Show
              when={!props.provider.isListLoading()}
              fallback={<p>Loading {props.provider.entityLabel.toLowerCase()}s.</p>}
            >
              <UiTable overflow='scroll'>
                <UiTableHeader>
                  <For each={props.provider.listColumns}>
                    {column => <UiTableCell>{column}</UiTableCell>}
                  </For>
                  <UiTableCell align='end'>Actions</UiTableCell>
                </UiTableHeader>
                <UiTableBody>
                  <Show
                    when={props.provider.list().length > 0}
                    fallback={
                      <UiTableRow variant='section'>
                        <UiTableCell>
                          No {props.provider.entityLabel.toLowerCase()}s found.
                        </UiTableCell>
                      </UiTableRow>
                    }
                  >
                    <For each={props.provider.list()}>
                      {item => (
                        // The row itself opens the editor — no edit action.
                        <UiTableRow onActivate={() => onSelect(item)}>
                          {props.provider.renderListCells(item)}
                          <UiTableCell align='end'>
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
                          </UiTableCell>
                        </UiTableRow>
                      )}
                    </For>
                  </Show>
                </UiTableBody>
              </UiTable>
            </Show>
          </PanelList>
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
            <div data-shell='abstraction-manager-confirmation'>
              <h2>{target().action.confirmation?.title}</h2>
              <p>{target().action.confirmation?.message(target().item)}</p>
              <Show when={actionError()}>
                {message => <UiAlert variant='danger'>{message()}</UiAlert>}
              </Show>
              <div data-shell='abstraction-manager-confirmation-actions'>
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
