/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm widget maker                                                            ║
║ Bound navigation, inline command menus, and task popover triggers.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Binds application behavior without importing application APIs. Icon-only
commands and configured menus remain inline; labelled commands collect in the
existing overflow. Popovers are mutually exclusive and commands close before
execution. Status readers and disabled predicates stay reactive. Expected
command failures belong to the operation; unexpected async rejections are
observed and raised as programming errors, never converted into task reports.
The task list owns report presentation; Helm owns its trigger and popover.
The configured Tasks trigger stays visible and is disabled when reports are empty.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
makeHelmWidget  Bind commands/status and return a dashboard widget component.
*/

import { isNonEmptyString, notValid } from '@core/std'
import type { Dictionary } from '@core/std'
import { createEffect, createMemo, createSignal, For, Show } from '@solid-js'
import type { WidgetComponent } from '@ux/shell/dashboard/widget-contract.ts'
import { BackgroundTasks } from '@ux/shell/runtime/background-tasks.ts'
import { useShellNavigate } from '@ux/shell/runtime/use-shell-navigate.ts'
import { UiActionButton, UiLayout, UiPopover } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { BackgroundTaskList } from './background-task-list.tsx'
import { readHelmActions } from './helm-widget-contract.ts'
import type { HelmBindings, HelmCommand, HelmMenu } from './helm-widget-contract.ts'

import './helm-widget.css'

/** Bind application behavior; an empty binding preserves the generic default. */
export const makeHelmWidget = (bindings: HelmBindings): WidgetComponent =>
(
  props: { settings: Dictionary }
): UiComponent => {
  const navigate = useShellNavigate()
  const [theme, setTheme] = createSignal(document.documentElement.dataset.theme ?? '')
  const [taskView, setTaskView] = createSignal(false)
  let navigation!: HTMLElement
  const [open, setOpen] = createSignal<HelmMenu | HelmCommand | 'overflow' | undefined>()
  const changeOpen = (surface: HelmMenu | HelmCommand | 'overflow', value: boolean): void => {
    if (value) {
      setTaskView(false)
      setOpen(surface)
    } else if (open() === surface) setOpen(undefined)
  }
  createEffect(() => {
    const surface = open()
    if (surface === undefined || surface === 'overflow' || !('command' in surface)) return
    if (surface.command !== '@tasks' || Object.keys(BackgroundTasks.store).length > 0) return
    setOpen(undefined)
    queueMicrotask(() => {
      const target = navigation.querySelector<HTMLButtonElement>('button:not([disabled])') ?? navigation
      target.focus()
    })
  })
  const actions = createMemo(() => readHelmActions(props.settings.actions, bindings))
  const themes = createMemo(() => {
    const hasTheme = actions().some(action =>
      'items' in action
        ? action.items.some(item => 'command' in item && item.command === '@theme')
        : action.command === '@theme'
    )
    if (!hasTheme) return []
    const value = props.settings.themes
    if (!Array.isArray(value) || value.length === 0 || !value.every(isNonEmptyString)) {
      return notValid('HelmWidget settings.themes must be a non-empty string array')
    }
    return value
  })
  const inline = () =>
    actions().filter(action =>
      'items' in action || action.labelMode === 'hidden' || action.command === '@tasks'
    )
  const overflow = () =>
    actions().filter((action): action is HelmCommand =>
      !('items' in action) && action.labelMode !== 'hidden' && action.command !== '@tasks'
    )
  const disabled = (action: HelmCommand) => bindings.commands?.[action.command]?.disabled?.() ?? false
  const icon = (action: HelmCommand) => {
    if (action.command === '@tasks') return 'update'
    if (action.command !== '@theme') return action.icon
    return theme() === 'dark' ? 'moon' : theme() === 'light' ? 'sun' : 'color-wheel'
  }
  const execute = (action: HelmCommand): void => {
    if (disabled(action)) return
    setOpen(undefined)
    if (action.command === '@theme') {
      const next = themes()[themes().indexOf(theme()) + 1] ?? themes()[0]
      document.documentElement.dataset.theme = next
      setTheme(next)
      return
    }
    queueMicrotask(() => {
      if (disabled(action)) return
      const pending = action.command.startsWith('/')
        ? navigate.redirect(action.command)
        : bindings.commands![action.command].execute()
      Promise.resolve(pending).catch(error => {
        queueMicrotask(() => {
          throw error
        })
      })
    })
  }
  const commandButton = (action: HelmCommand, labelled: boolean): UiComponent => (
    <UiActionButton
      density='dense'
      icon={icon(action)}
      label={action.label}
      labelMode={labelled ? 'visible' : 'hidden'}
      align='start'
      data-widget-icon={action.labelMode === 'visible-no-icon' && !labelled ? 'hidden' : undefined}
      disabled={disabled(action)}
      onClick={() => execute(action)}
    />
  )
  const trigger = (label: string, glyph: string): UiComponent => (
    <span role='img' aria-label={label} data-widget='helm-menu-icon' data-ui-icon={glyph} />
  )
  const tasksPopover = (action: HelmCommand): UiComponent => (
    <UiPopover
      trigger={
        <span role='img' aria-label={action.label} data-widget='helm-action-frame'>
          <span data-widget='helm-menu-icon' data-ui-icon='update' />
        </span>
      }
      triggerVariant='ghost'
      disabled={Object.keys(BackgroundTasks.store).length === 0}
      open={open() === action}
      onOpenChange={value => changeOpen(action, value)}
    >
      <BackgroundTaskList />
    </UiPopover>
  )

  return (
    <nav ref={navigation} tabIndex={-1} aria-label='Primary actions' data-widget='helm-widget'>
      <UiLayout variant='inline-fit'>
        <For each={inline()}>
          {action =>
            'items' in action
              ? (
                <UiPopover
                  trigger={trigger(action.label, action.icon)}
                  triggerVariant='ghost'
                  open={open() === action}
                  onOpenChange={value => changeOpen(action, value)}
                >
                  <Show
                    when={taskView()}
                    fallback={
                      <UiLayout variant='block-fit' data-widget='helm-command-menu'>
                        <For each={action.items}>
                          {item =>
                            'status' in item
                              ? <span>{bindings.status![item.status]()}</span>
                              : item.command === '@tasks'
                              ? (
                                <UiActionButton
                                  icon='update'
                                  label={item.label}
                                  labelMode='visible'
                                  disabled={Object.keys(BackgroundTasks.store).length === 0}
                                  onClick={() => setTaskView(true)}
                                />
                              )
                              : commandButton(item, true)}
                        </For>
                      </UiLayout>
                    }
                  >
                    <BackgroundTaskList />
                  </Show>
                </UiPopover>
              )
              : action.command === '@tasks'
              ? tasksPopover(action)
              : commandButton(action, false)}
        </For>
        <Show when={overflow().length > 0}>
          <UiPopover
            trigger={trigger('More actions', 'dots-vertical')}
            triggerVariant='ghost'
            open={open() === 'overflow'}
            onOpenChange={value => changeOpen('overflow', value)}
          >
            <UiLayout variant='block-fit' data-widget='helm-command-menu'>
              <For each={overflow()}>{action => commandButton(action, true)}</For>
            </UiLayout>
          </UiPopover>
        </Show>
      </UiLayout>
    </nav>
  )
}
