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
import { UiActionButton, type UiComponent, UiLayout } from '@front/ux/ui'
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
    const actions = toStringArray(props.settings['actions'], 'ActionWidget settings.actions')
    const labels = toStringArray(props.settings['labels'], 'ActionWidget settings.labels')
    const icons = toStringArray(props.settings['icons'], 'ActionWidget settings.icons')
    if (actions.length !== labels.length || actions.length !== icons.length) {
      throw new Error('ActionWidget settings actions, labels, and icons must have equal lengths')
    }
    return actions.map((action, index) => ({
      action,
      icon: icons[index],
      label: labels[index]
    }))
  }

  return (
    <nav aria-label='Dashboard actions' data-feat='action-widget'>
      <UiLayout variant='cluster'>
        <For each={pairs()}>
          {pair => (
            <UiActionButton
              icon={pair.icon}
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

const toStringArray = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`)
  return value.map((item, index) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new Error(`${field}[${index}] must be a non-empty string`)
    }
    return item
  })
}
