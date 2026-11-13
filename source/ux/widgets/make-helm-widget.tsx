/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm widget maker                                                            ║
║ Bound toolbar commands, titled menus, and the Tasks menu.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Binds application behavior without importing application APIs. The toolbar
renders its items inline and in order: a command as its icon, named and titled
by its label; a menu as its icon, the trigger of a popover headed by its label,
then its commands and status lines. The @tasks item is a menu whose
items are the current reports; it is disabled while none exist and closes when
the last one clears. Popovers are mutually exclusive and commands close before
execution. Status readers and disabled predicates stay reactive. Expected
command failures belong to the operation; unexpected async rejections are
observed and raised as programming errors, never converted into task reports.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
makeHelmWidget  Bind commands/status and return a dashboard widget component.
*/

import { isNonEmptyString, notValid } from '@core/std'
import type { Dictionary } from '@core/std'
import { createEffect, createMemo, createSignal, For } from '@solid-js'
import type { WidgetComponent } from '@ux/shell/dashboard/widget-contract.ts'
import { BackgroundTasks } from '@ux/shell/runtime/background-tasks.ts'
import { useShellNavigate } from '@ux/shell/runtime/use-shell-navigate.ts'
import { UiActionButton, UiLayout, UiPopover } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { BackgroundTaskList } from './background-task-list.tsx'
import { HelmButton, HelmButtonGlyph } from './helm-button.tsx'
import { readHelmToolbar } from './helm-widget-contract.ts'
import type { HelmBindings, HelmCommand, HelmMenuItem, HelmToolbarItem } from './helm-widget-contract.ts'

import './helm-widget.css'

/** Bind application behavior; an empty binding preserves the generic default. */
export const makeHelmWidget = (bindings: HelmBindings): WidgetComponent =>
(
  props: { settings: Dictionary }
): UiComponent => {
  const navigate = useShellNavigate()
  const [theme, setTheme] = createSignal(document.documentElement.dataset.theme ?? '')
  let navigation!: HTMLElement
  const [open, setOpen] = createSignal<HelmToolbarItem | undefined>()
  const changeOpen = (surface: HelmToolbarItem, value: boolean): void => {
    if (value) setOpen(surface)
    else if (open() === surface) setOpen(undefined)
  }
  const hasReports = () => Object.keys(BackgroundTasks.store).length > 0
  const isTasks = (item: HelmToolbarItem): boolean => 'command' in item && item.command === '@tasks'
  createEffect(() => {
    const surface = open()
    if (surface === undefined || !isTasks(surface) || hasReports()) return
    setOpen(undefined)
    queueMicrotask(() => {
      const target = navigation.querySelector<HTMLButtonElement>('button:not([disabled])') ?? navigation
      target.focus()
    })
  })
  const toolbar = createMemo(() => readHelmToolbar(props.settings.toolbar, bindings))
  const themes = createMemo(() => {
    const isTheme = (item: HelmToolbarItem | HelmMenuItem) =>
      'command' in item && item.command === '@theme'
    const hasTheme = toolbar().items.some(item =>
      'items' in item ? item.items.some(isTheme) : isTheme(item)
    )
    if (!hasTheme) return []
    const value = props.settings.themes
    if (!Array.isArray(value) || value.length === 0 || !value.every(isNonEmptyString)) {
      return notValid('HelmWidget settings.themes must be a non-empty string array')
    }
    return value
  })
  const disabled = (action: HelmCommand) => bindings.commands?.[action.command]?.disabled?.() ?? false
  const icon = (action: HelmCommand) => {
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
  const menuItem = (item: HelmMenuItem): UiComponent => {
    if ('status' in item) {
      return <span data-widget='helm-menu-status'>{bindings.status![item.status]()}</span>
    }
    return (
      <UiActionButton
        density='dense'
        icon={icon(item)}
        label={item.label}
        labelMode='visible'
        align='start'
        disabled={disabled(item)}
        onClick={() => execute(item)}
      />
    )
  }
  const menu = (surface: HelmToolbarItem, spec: HelmMenuSpec): UiComponent => (
    <UiPopover
      trigger={<HelmButtonGlyph label={surface.label} icon={spec.icon} />}
      triggerVariant='ghost'
      disabled={spec.disabled()}
      open={open() === surface}
      onOpenChange={value => changeOpen(surface, value)}
    >
      <UiLayout variant='block-fit' gap='tight' data-widget='helm-menu'>
        <span data-widget='helm-menu-title'>{surface.label}</span>
        {spec.content()}
      </UiLayout>
    </UiPopover>
  )

  return (
    <nav ref={navigation} tabIndex={-1} aria-label='Primary actions' data-widget='helm-widget'>
      <UiLayout variant='inline-fit'>
        <For each={toolbar().items}>
          {item =>
            'items' in item
              ? menu(item, {
                icon: item.icon,
                disabled: () => false,
                content: () => <For each={item.items}>{child => menuItem(child)}</For>
              })
              : isTasks(item)
              ? menu(item, {
                icon: 'update',
                disabled: () => !hasReports(),
                content: () => <BackgroundTaskList />
              })
              : (
                <HelmButton
                  icon={icon(item)}
                  label={item.label}
                  title={item.label}
                  disabled={disabled(item)}
                  onClick={() => execute(item)}
                />
              )}
        </For>
      </UiLayout>
    </nav>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** What a menu popover shows: its trigger glyph, its disabled state, and its items. */
type HelmMenuSpec = {
  icon: string
  disabled: () => boolean
  content: () => UiComponent
}
