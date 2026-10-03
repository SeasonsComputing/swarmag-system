/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm widget                                                                  ║
║ Header widget for route navigation actions.                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders configured navigation and reserved commands in the dashboard header's
terminal field, adapting to that field's own measured width rather than the
viewport. Each action carries its accessible label, icon, and optional
labelMode (omitted defaults to visible; visible-no-icon draws only the label).
Reserved commands use an adorned symbol such as `@theme`, ordinary commands
are route paths. Below the
dashboard's stacked-header threshold the field spans its own row and actions
distribute across it; control size scales with density and the shared
base-scale step.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
HelmWidget  Dashboard header navigation control cluster.
*/

import type { Dictionary } from '@core/std'
import { createSignal, For } from '@solid-js'
import { useShellNavigate } from '@ux/shell/runtime/use-shell-navigate.ts'
import { UiActionButton, UiLayout } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

import './helm-widget.css'

/** Dashboard helm widget props. */
export type HelmWidgetProps = {
  settings: Dictionary
}

/** Label presentation modes accepted by the Helm configuration. */
const HELM_LABEL_MODES = ['hidden', 'visible', 'visible-no-icon'] as const
type HelmLabelMode = (typeof HELM_LABEL_MODES)[number]

/** Helm action configured from the dashboard seed. */
type HelmAction = {
  command: string
  icon: string
  label: string
  labelMode: HelmLabelMode
}

/** Helm action with executable widget behavior. */
type ResolvedHelmAction = Omit<HelmAction, 'icon'> & {
  execute: () => void
  icon: () => string
}

const HELM_THEME_COMMAND = '@theme'

/** Dashboard header navigation control cluster. */
export const HelmWidget = (props: HelmWidgetProps): UiComponent => {
  const navigate = useShellNavigate()
  const [theme, setTheme] = createSignal(document.documentElement.dataset.theme ?? '')
  const actions = () =>
    toHelmActions(props.settings['actions'], 'HelmWidget settings.actions').map(resolveAction)

  const cycleTheme = () => {
    const themes = toThemes(props.settings['themes'])
    const index = themes.indexOf(theme())
    const nextTheme = themes[index + 1] ?? themes[0]
    document.documentElement.dataset.theme = nextTheme
    setTheme(nextTheme)
  }

  const resolveAction = (action: HelmAction): ResolvedHelmAction => {
    switch (action.command) {
      case HELM_THEME_COMMAND:
        toThemes(props.settings['themes'])
        return {
          ...action,
          execute: cycleTheme,
          icon: () => toThemeIcon(theme())
        }
      default:
        return {
          ...action,
          execute: () => void navigate.redirect(action.command),
          icon: () => action.icon
        }
    }
  }

  return (
    <nav aria-label='Primary actions' data-widget='helm-widget'>
      <UiLayout variant='inline-fit'>
        <For each={actions()}>
          {action => (
            <UiActionButton
              density='dense'
              icon={action.icon()}
              label={action.label}
              labelMode={action.labelMode === 'visible-no-icon' ? 'visible' : action.labelMode}
              data-widget-icon={action.labelMode === 'visible-no-icon' ? 'hidden' : undefined}
              onClick={action.execute}
            />
          )}
        </For>
      </UiLayout>
    </nav>
  )
}

// ───────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ───────────────────────────────────────────────────────────────────────────────

/** Parse Helm action records from widget settings. */
const toHelmActions = (value: unknown, field: string): HelmAction[] => {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`)
  return value.map((item, index) => toHelmAction(item, `${field}[${index}]`))
}

/** Parse one Helm action record. */
const toHelmAction = (value: unknown, field: string): HelmAction => {
  const action = toDictionary(value, field)
  return {
    command: toString(action['command'], `${field}.command`),
    icon: toString(action['icon'], `${field}.icon`),
    label: toString(action['label'], `${field}.label`),
    labelMode: toLabelMode(action['labelMode'], `${field}.labelMode`)
  }
}

/** Parse the configured theme cycle. */
const toThemes = (value: unknown): string[] => toStringArray(value, 'HelmWidget settings.themes')

/** Require an object dictionary. */
const toDictionary = (input: unknown, field: string): Dictionary => {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`${field} must be an object`)
  }
  return input as Dictionary
}

/** Require a non-empty string value. */
const toString = (input: unknown, field: string): string => {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`)
  }
  return input
}

/** Require a supported Helm label mode when configured. */
const toLabelMode = (value: unknown, field: string): HelmLabelMode => {
  if (value === undefined) return 'visible'
  if (typeof value !== 'string' || !HELM_LABEL_MODES.includes(value as HelmLabelMode)) {
    throw new Error(`${field} must be ${HELM_LABEL_MODES.join(', ')}`)
  }
  return value as HelmLabelMode
}

/** Require a non-empty string array. */
const toStringArray = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`)
  return value.map((item, index) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new Error(`${field}[${index}] must be a non-empty string`)
    }
    return item
  })
}

/** Resolve the action icon for a named theme. */
const toThemeIcon = (theme: string): string => {
  if (theme === 'dark') return 'moon'
  if (theme === 'light') return 'sun'
  return 'color-wheel'
}
