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
import type { AbstractionAction, AbstractionManagerContract } from './abstraction-manager-contract.ts'
import { PanelContainer } from './panel-container.tsx'
import { PanelForm } from './panel-form.tsx'
import { PanelHeader } from './panel-header.tsx'
import { PanelList } from './panel-list.tsx'
import { focusFirstField } from './use-abstraction-form-keyboard.ts'

import './abstraction-manager.css'

/** Props for a generic abstraction manager. */
export type AbstractionManagerProps<T extends Instance> = {
  provider: AbstractionManagerContract<T>
}

/** Mode of the abstraction manager: 'list' or 'editor'. */
type AbstractionManagerMode = 'list' | 'editor'

/** An action and instance awaiting confirmation. */
type PendingAction<T extends Instance> = {
  action: AbstractionAction<T>
  item: T
}

/** Generic abstraction list and editor-panel manager. */
export const AbstractionManager = <T extends Instance>(
  props: AbstractionManagerProps<T>
): UiComponent => {
  const [selected, setSelected] = createSignal<T | null>(null)
  const [mode, setMode] = createSignal<AbstractionManagerMode>('list')
  // Opening the editor is an event, not a state. Selection alone cannot express
  // it: New-then-New leaves `selected` null both times, so nothing downstream
  // re-runs and the previous attempt's error rings and focus survive into what
  // the user reads as a fresh form. This epoch makes every open observable.
  const [editorEpoch, setEditorEpoch] = createSignal(1)
  let panelRef: HTMLElement | undefined
  createEffect(() => {
    editorEpoch()
    if (mode() === 'editor') focusFirstField(() => panelRef)
  })
  const [pendingAction, setPendingAction] = createSignal<PendingAction<T> | null>(null)
  const [actionError, setActionError] = createSignal<string | null>(null)
  const [actionPending, setActionPending] = createSignal(false)
  const openEditor = (item: T | null): void => {
    setSelected(() => item)
    setMode('editor')
    setEditorEpoch(epoch => epoch + 1)
  }
  const onSelect = (item: T): void => openEditor(item)
  const onNew = (): void => openEditor(null)
  const clearSelection = (): void => {
    setSelected(null)
    setMode('list')
  }
  const closeEditor = (): void => clearSelection()
  const cancelDialog = (): void => props.provider.cancel?.() ?? closeEditor()
  const runAction = async (action: PendingAction<T>['action'], item: T): Promise<void> => {
    await action.handler(item)
    if (selected()?.id === item.id) clearSelection()
  }
  const requestAction = (action: PendingAction<T>['action'], item: T): void => {
    if (!action.confirmation) {
      void runAction(action, item)
      return
    }
    setActionError(null)
    setPendingAction({ action, item })
  }
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
                            <UiActionButton
                              icon='pencil-1'
                              label='Edit'
                              onClick={() => onSelect(item)}
                            />
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
            feedback={props.provider.editorFeedback?.()}
            header={{
              leading: (
                <>
                  <div data-feat='abstraction-manager-collapse-action'>
                    <span data-feat='abstraction-manager-back-command'>
                      <UiActionButton
                        icon='arrow-left'
                        label={`${props.provider.entityLabel}s`}
                        onClick={() => setMode('list')}
                      />
                      <span aria-hidden='true' data-feat='abstraction-manager-command-divider' />
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
                  type='submit'
                  form='abstraction-panel-form'
                />
              )
            }}
          >
            <Show when={editorEpoch()} keyed>
              {props.provider.renderForm(selected(), closeEditor)}
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
            <div data-feat='abstraction-manager-confirmation'>
              <h2>{target().action.confirmation?.title}</h2>
              <p>{target().action.confirmation?.message(target().item)}</p>
              <Show when={actionError()}>
                {message => <UiAlert variant='danger'>{message()}</UiAlert>}
              </Show>
              <div data-feat='abstraction-manager-confirmation-actions'>
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
