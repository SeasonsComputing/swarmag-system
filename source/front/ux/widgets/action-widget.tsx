/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Action widget                                                                ║
║ Header widget for route navigation actions.                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders configured route actions as secondary buttons in the dashboard header.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ActionWidget  Dashboard header action widget.
*/

import type { Dictionary } from '@core/std'
import { UiActionButton, type UiActionButtonIcon, type UiComponent, UiLayout } from '@front/ux/ui'
import { For } from '@solid-js'
import { useNavigate } from '@tanstack/solid-router'

import './action-widget.css'

/** Dashboard action widget props. */
export type ActionWidgetProps = {
  settings: Dictionary
}

/** Dashboard header action widget. */
export const ActionWidget = (props: ActionWidgetProps): UiComponent => {
  const navigate = useNavigate()
  const pairs = () => {
    const actions = toStringArray(props.settings['actions'])
    const labels = toStringArray(props.settings['labels'])
    return actions.map((action, index) => ({
      action,
      label: labels[index] ?? action
    }))
  }

  return (
    <nav aria-label='Dashboard actions' data-feat='action-widget'>
      <UiLayout variant='cluster'>
        <For each={pairs()}>
          {pair => (
            <UiActionButton
              icon={actionIcon(pair.action)}
              label={pair.label}
              labelMode='visible'
              onClick={() => void navigate({ to: pair.action })}
            />
          )}
        </For>
      </UiLayout>
    </nav>
  )
}

const actionIcon = (action: string): UiActionButtonIcon => {
  if (action === '/logout') return 'eject'
  if (action === '/users') return 'edit'
  return 'check'
}

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
