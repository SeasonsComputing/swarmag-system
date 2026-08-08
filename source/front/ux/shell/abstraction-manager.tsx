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

import type { Instance } from '@core/std'
import {
  UiActionButton,
  UiAlert,
  UiButton,
  type UiComponent,
  UiDialog,
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHeader,
  UiTableRow
} from '@front/ux/ui'
import { createEffect, createSignal, For, Show } from '@solid-js'
import type {
  AbstractionAction,
  AbstractionEditorHandle,
  AbstractionManagerContract
} from './abstraction-manager-contract.ts'
import { PanelContainer } from './panel-container.tsx'
import type { PanelFeedback } from './panel-contract.ts'
import { PanelForm } from './panel-form.tsx'
import { PanelHeader } from './panel-header.tsx'
import { PanelList } from './panel-list.tsx'
import { FORM_FEEDBACK_MESSAGE } from './use-abstraction-form-feedback.ts'
import { focusFirstField } from './use-abstraction-form-keyboard.ts'

import './abstraction-manager.css'

/** Props for a generic abstraction manager. */
export type AbstractionManagerProps<T extends Instance, Draft> = {
  onCancel: () => void
  provider: AbstractionManagerContract<T, Draft>
}

/** Mode of the abstraction manager: 'list' or 'editor'. */
type AbstractionManagerMode = 'list' | 'editor'

/** An action and instance awaiting confirmation. */
type PendingAction<T extends Instance> = {
  action: AbstractionAction<T>
  item: T
}

/** Generic abstraction list and editor-panel manager. */
export const AbstractionManager = <T extends Instance, Draft>(
  props: AbstractionManagerProps<T, Draft>
): UiComponent => {
  const [selected, setSelected] = createSignal<T | null>(null)
  const [mode, setMode] = createSignal<AbstractionManagerMode>('list')
  const [editorHandle, setEditorHandle] = createSignal<AbstractionEditorHandle<Draft> | null>(null)
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
    setEditorHandle(null)
    setEditorEpoch(epoch => epoch + 1)
  }

  /** Opens the editor for a selected item or a new draft. */
  const openEditor = (item: T | null): void => {
    setEditorFeedback(null)
    setSelected(() => item)
    setMode('editor')
    bumpEditorEpoch(true)
  }

  /** Opens the selected list item in the editor. */
  const onSelect = (item: T): void => openEditor(item)

  /** Opens the editor for a new item. */
  const onNew = (): void => openEditor(null)

  /** Reopens a new-item editor after create or destructive action completion. */
  const openFreshNew = (clearFeedback: boolean): void => {
    if (clearFeedback) setEditorFeedback(null)
    setSelected(null)
    setMode('editor')
    bumpEditorEpoch(true)
  }

  /** Cancels the manager dialog and clears editor feedback. */
  const cancelDialog = (): void => {
    setEditorFeedback(null)
    props.onCancel()
  }

  /** Resolve display copy for an abstraction instance. */
  const itemLabel = (item: T): string => props.provider.itemLabel?.(item) ?? props.provider.entityLabel

  /** Registers the active editor handle and removes it when that editor unmounts. */
  const registerEditor = (handle: AbstractionEditorHandle<Draft>): () => void => {
    setEditorHandle(() => handle)
    return () => {
      setEditorHandle(current => current === handle ? null : current)
    }
  }

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
    if (savePending()) return
    setEditorFeedback(null)
    const handle = editorHandle()
    if (!handle) {
      setEditorFeedback({ message: 'Editor is not ready to save.', variant: 'danger' })
      return
    }
    if (!handle.validate()) {
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

  return (
    <>
      <PanelContainer
        feature='abstraction-manager'
        mode={mode()}
        header={
          <PanelHeader
            leading={<h1>{props.provider.formTitle}</h1>}
            trailing={
              <UiActionButton icon='cross-1' label='Cancel' labelMode='visible' onClick={cancelDialog} />
            }
          />
        }
        index={
          <PanelList
            header={{
              leading: <h2>{props.provider.entityLabel}s</h2>,
              trailing: (
                <UiActionButton
                  icon='plus'
                  label={`New ${props.provider.entityLabel}`}
                  labelMode='visible'
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
                        <UiTableRow onClick={() => onSelect(item)}>
                          {props.provider.renderListCells(item)}
                          <UiTableCell align='end'>
                            <For each={props.provider.actions}>
                              {action => (
                                <UiActionButton
                                  icon={action.icon}
                                  label={action.label}
                                  variant={action.variant}
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
        subjectRef={element => panelRef = element}
        subject={
          <PanelForm
            feedback={editorFeedback()}
            header={{
              leading: (
                <>
                  <div data-shell='abstraction-manager-collapse-action'>
                    <span data-shell='abstraction-manager-back-command'>
                      <UiActionButton
                        icon='arrow-left'
                        label={`${props.provider.entityLabel}s`}
                        onClick={() => setMode('list')}
                      />
                      <span aria-hidden='true' data-shell='abstraction-manager-command-divider' />
                    </span>
                  </div>
                  <h2>{editorTitle()}</h2>
                </>
              ),
              trailing: (
                <UiActionButton
                  icon='check'
                  label='Save'
                  labelMode='visible'
                  disabled={savePending()}
                  loading={savePending()}
                  onClick={() => void saveEditor()}
                />
              )
            }}
          >
            <Show when={editorEpoch()} keyed>
              {props.provider.renderForm(selected(), {
                feedback: setEditorFeedback,
                register: registerEditor,
                saving: savePending
              })}
            </Show>
          </PanelForm>
        }
      />
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
