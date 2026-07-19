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
import type { UiComponent } from '@front/ux/ui'
import { For } from '@solid-js'
import { Link } from '@tanstack/solid-router'

import './action-widget.css'

/** Dashboard action widget props. */
export type ActionWidgetProps = {
  settings: Dictionary
}

/** Dashboard header action widget. */
export const ActionWidget = (props: ActionWidgetProps): UiComponent => {
  const actions = (): string[] => toStringArray(props.settings['actions'])
  const labels = (): string[] => toStringArray(props.settings['labels'])
  const pairs = () =>
    actions().map((action, index) => ({
      action,
      label: labels()[index] ?? action
    }))

  return (
    <nav data-feat='action-widget'>
      <For each={pairs()}>
        {pair => <Link to={pair.action}>{pair.label}</Link>}
      </For>
    </nav>
  )
}

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
