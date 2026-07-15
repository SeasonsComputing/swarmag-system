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
import { createSignal, For, Show } from '@solid-js'
import {
  UiActionButton,
  UiAlert,
  UiButton,
  UiCard,
  type UiComponent,
  UiDialog,
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHeader,
  UiTableRow
} from '@ux/common/components/ui'
import type { AbstractionManagerContract } from './abstraction-manager-contract.ts'

import './abstraction-manager.css'

/** Props for a generic abstraction manager. */
export type AbstractionManagerProps<T extends Instance> = {
  provider: AbstractionManagerContract<T>
}

/** Mode of the abstraction manager: 'list' or 'editor'. */
type AbstractionManagerMode = 'list' | 'editor'

/** An action and instance awaiting confirmation. */
type PendingAction<T extends Instance> = {
  action: AbstractionManagerContract<T>['actions'][number]
  item: T
}

/** Generic abstraction list and editor-panel manager. */
export const AbstractionManager = <T extends Instance>(
  props: AbstractionManagerProps<T>
): UiComponent => {
  const [selected, setSelected] = createSignal<T | null>(null)
  const [mode, setMode] = createSignal<AbstractionManagerMode>('list')
  const [pendingAction, setPendingAction] = createSignal<PendingAction<T> | null>(null)
  const [actionError, setActionError] = createSignal<string | null>(null)
  const [actionPending, setActionPending] = createSignal(false)
  const onSelect = (item: T): void => {
    setSelected(() => item)
    setMode('editor')
  }
  const onNew = (): void => {
    setSelected(null)
    setMode('editor')
  }
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
    <div data-feat='abstraction-manager' data-feat-mode={mode()}>
      <header data-feat='abstraction-manager-title-row'>
        <h1 data-feat='abstraction-manager-title'>{props.provider.formTitle}</h1>
        <UiActionButton icon='cross' label='Cancel' labelMode='visible' onClick={cancelDialog} />
      </header>
      <section data-feat='abstraction-manager-list'>
        <UiCard elevation='raised'>
          <header data-feat='abstraction-manager-card-header'>
            <h2 data-feat='abstraction-manager-card-title'>{props.provider.entityLabel}s</h2>
            <div data-feat='abstraction-manager-card-actions'>
              <UiActionButton
                icon='plus'
                label={`New ${props.provider.entityLabel}`}
                labelMode='visible'
                onClick={onNew}
              />
            </div>
          </header>
          <div data-feat='abstraction-manager-card-body' data-feat-region='list-body'>
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
                            <UiActionButton icon='edit' label='Edit' onClick={() => onSelect(item)} />
                          </UiTableCell>
                        </UiTableRow>
                      )}
                    </For>
                  </Show>
                </UiTableBody>
              </UiTable>
            </Show>
          </div>
        </UiCard>
      </section>
      <section data-feat='abstraction-manager-panel'>
        <UiCard elevation='raised'>
          <header data-feat='abstraction-manager-card-header' data-feat-region='editor-header'>
            <div data-feat='abstraction-manager-card-header-row'>
              <div data-feat='abstraction-manager-card-title-group'>
                <div data-feat='abstraction-manager-collapse-action'>
                  <span data-feat='abstraction-manager-back-command'>
                    <UiActionButton
                      icon='back'
                      label={`${props.provider.entityLabel}s`}
                      onClick={() => setMode('list')}
                    />
                    <span aria-hidden='true' data-feat='abstraction-manager-command-divider' />
                  </span>
                </div>
                <h2 data-feat='abstraction-manager-card-title'>{editorTitle()}</h2>
              </div>
              <div data-feat='abstraction-manager-card-actions'>
                <UiActionButton
                  icon='check'
                  label='Save'
                  labelMode='visible'
                  type='submit'
                  form='abstraction-panel-form'
                />
              </div>
            </div>
            <Show when={props.provider.editorFeedback?.()}>
              {feedback => <UiAlert variant={feedback().variant}>{feedback().message}</UiAlert>}
            </Show>
          </header>
          <div data-feat='abstraction-manager-card-body' data-feat-region='editor-body'>
            {props.provider.renderForm(selected(), closeEditor)}
          </div>
        </UiCard>
      </section>
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
    </div>
  )
}
