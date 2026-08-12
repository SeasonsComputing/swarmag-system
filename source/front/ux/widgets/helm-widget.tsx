/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm widget                                                                  ║
║ Header widget for route navigation actions.                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders configured route actions as secondary buttons in the dashboard header.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
HelmWidget  Dashboard header navigation control cluster.
*/

import type { Dictionary } from '@core/std'
import { useShellNavigate } from '@front/ux/shell/use-shell-navigate.ts'
import { UiActionButton, type UiComponent, UiLayout } from '@front/ux/ui'
import { For } from '@solid-js'

import './helm-widget.css'

/** Dashboard helm widget props. */
export type HelmWidgetProps = {
  settings: Dictionary
}

/** Dashboard header navigation control cluster. */
export const HelmWidget = (props: HelmWidgetProps): UiComponent => {
  const navigate = useShellNavigate()
  const pairs = () => {
    const actions = toStringArray(props.settings['actions'], 'HelmWidget settings.actions')
    const labels = toStringArray(props.settings['labels'], 'HelmWidget settings.labels')
    const icons = toStringArray(props.settings['icons'], 'HelmWidget settings.icons')
    if (actions.length !== labels.length || actions.length !== icons.length) {
      throw new Error('HelmWidget settings actions, labels, and icons must have equal lengths')
    }
    return actions.map((action, index) => ({
      action,
      icon: icons[index],
      label: labels[index]
    }))
  }

  return (
    <nav aria-label='Primary actions' data-widget='helm-widget'>
      <UiLayout variant='inline-fit'>
        <For each={pairs()}>
          {pair => (
            <UiActionButton
              icon={pair.icon}
              label={pair.label}
              density='dense'
              labelMode='visible'
              onClick={() => void navigate.redirect(pair.action)}
            />
          )}
        </For>
      </UiLayout>
    </nav>
  )
}

/** validates and returns a string array */
const toStringArray = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`)
  return value.map((item, index) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new Error(`${field}[${index}] must be a non-empty string`)
    }
    return item
  })
}
