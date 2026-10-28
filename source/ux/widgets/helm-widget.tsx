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
are route paths. Icon-only actions stay inline; labelled actions collect in an
overflow menu at the end, shown with icon and label, which appears only when it
holds one. Below the dashboard's stacked-header threshold the field
spans its own row and actions distribute across it; control size scales with
density and the shared base-scale step.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
HelmWidgetProps  Dashboard helm widget props.
└ settings       Dashboard settings.
HelmWidget       Dashboard header navigation control cluster.
*/

import { isConstEnum, isDictionary, isNonEmptyString, notValid } from '@core/std'
import type { Dictionary } from '@core/std'
import { createSignal, For, Show } from '@solid-js'
import { useShellNavigate } from '@ux/shell/runtime/use-shell-navigate.ts'
import { UiActionButton, UiLayout, UiPopover } from '@ux/ui'
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
  const [menuOpen, setMenuOpen] = createSignal(false)
  const actions = () =>
    readHelmActions(props.settings['actions'], 'HelmWidget settings.actions').map(resolveAction)
  const inlineActions = () => actions().filter(action => action.labelMode === 'hidden')
  const menuActions = () => actions().filter(action => action.labelMode !== 'hidden')

  const cycleTheme = () => {
    const themes = readHelmThemes(props.settings['themes'])
    const index = themes.indexOf(theme())
    const nextTheme = themes[index + 1] ?? themes[0]
    document.documentElement.dataset.theme = nextTheme
    setTheme(nextTheme)
  }

  const resolveAction = (action: HelmAction): ResolvedHelmAction => {
    switch (action.command) {
      case HELM_THEME_COMMAND:
        readHelmThemes(props.settings['themes'])
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
        <For each={inlineActions()}>
          {action => <HelmActionButton action={action} onClick={action.execute} />}
        </For>
        <Show when={menuActions().length > 0}>
          <UiPopover
            trigger={
              <span
                aria-label='More actions'
                data-widget='helm-menu-icon'
                data-ui-icon='dots-vertical'
              />
            }
            triggerVariant='ghost'
            open={menuOpen()}
            onOpenChange={setMenuOpen}
          >
            <UiLayout variant='block-fit'>
              <For each={menuActions()}>
                {action => (
                  <UiActionButton
                    density='dense'
                    icon={action.icon()}
                    label={action.label}
                    labelMode='visible'
                    align='start'
                    onClick={() => {
                      setMenuOpen(false)
                      action.execute()
                    }}
                  />
                )}
              </For>
            </UiLayout>
          </UiPopover>
        </Show>
      </UiLayout>
    </nav>
  )
}

// ───────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ───────────────────────────────────────────────────────────────────────────────

/** One Helm action, presented by its labelMode. */
const HelmActionButton = (props: { action: ResolvedHelmAction; onClick: () => void }): UiComponent => (
  <UiActionButton
    density='dense'
    icon={props.action.icon()}
    label={props.action.label}
    labelMode={props.action.labelMode === 'visible-no-icon' ? 'visible' : props.action.labelMode}
    data-widget-icon={props.action.labelMode === 'visible-no-icon' ? 'hidden' : undefined}
    onClick={props.onClick}
  />
)

/** Parse Helm action records from widget settings. */
const readHelmActions = (value: unknown, field: string): HelmAction[] => {
  if (!Array.isArray(value)) return notValid(`${field} must be an array`)
  return value.map((item, index) => readHelmAction(item, `${field}[${index}]`))
}

/** Parse one Helm action record. */
const readHelmAction = (value: unknown, field: string): HelmAction => {
  const action = readHelmDictionary(value, field)
  return {
    command: readHelmString(action['command'], `${field}.command`),
    icon: readHelmString(action['icon'], `${field}.icon`),
    label: readHelmString(action['label'], `${field}.label`),
    labelMode: readHelmLabelMode(action['labelMode'], `${field}.labelMode`)
  }
}

/** Parse the configured theme cycle. */
const readHelmThemes = (value: unknown): string[] =>
  readHelmStringArray(value, 'HelmWidget settings.themes')

/** Require an object dictionary. */
const readHelmDictionary = (input: unknown, field: string): Dictionary => {
  if (isDictionary(input)) return input
  return notValid(`${field} must be an object`)
}

/** Require a non-empty string value. */
const readHelmString = (input: unknown, field: string): string => {
  if (isNonEmptyString(input)) return input
  return notValid(`${field} must be a non-empty string`)
}

/** Require a supported Helm label mode when configured. */
const readHelmLabelMode = (value: unknown, field: string): HelmLabelMode => {
  if (value === undefined) return 'visible'
  if (isConstEnum(value, HELM_LABEL_MODES)) return value
  return notValid(`${field} must be ${HELM_LABEL_MODES.join(', ')}`)
}

/** Require a non-empty string array. */
const readHelmStringArray = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value)) return notValid(`${field} must be an array`)
  return value.map((item, index) => readHelmString(item, `${field}[${index}]`))
}

/** Resolve the action icon for a named theme. */
const toThemeIcon = (theme: string): string => {
  if (theme === 'dark') return 'moon'
  if (theme === 'light') return 'sun'
  return 'color-wheel'
}
