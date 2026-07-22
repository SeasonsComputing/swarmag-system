/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui action button control                                                     ║
║ Compact icon action button with accessible label reveal.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits compact action semantics for dense surfaces such as tables and toolbars.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UI_ACTION_BUTTON_ICONS  Supported action button icon names.
UiActionButton          Compact icon button with hover/focus label affordance.
*/

import { Button } from '@kobalte/core/button'
import { type JSX, splitProps } from '@solid-js'
import { controlState, type UiComponent } from './ui-helpers.ts'

/** Supported action button icon names. */
export const UI_ACTION_BUTTON_ICONS = [
  'back',
  'building',
  'check',
  'cross',
  'delete',
  'edit',
  'eject',
  'info',
  'plus',
  'user'
] as const

/** Action button icon name. */
export type UiActionButtonIcon = (typeof UI_ACTION_BUTTON_ICONS)[number]

/** Action button variants. */
export type UiActionButtonVariant = 'default' | 'danger'

/** Action button label presentation. */
export type UiActionButtonLabelMode = 'reveal' | 'visible'

/** Action button control props. */
export type UiActionButtonProps =
  & Omit<
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'aria-label'
    | 'data-ui'
    | 'data-ui-icon'
    | 'data-ui-label-mode'
    | 'data-ui-state'
    | 'data-ui-variant'
  >
  & {
    disabled?: boolean
    error?: boolean
    icon: UiActionButtonIcon
    label: string
    labelMode?: UiActionButtonLabelMode
    loading?: boolean
    variant?: UiActionButtonVariant
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-icon'?: never
    'data-ui-label-mode'?: never
    'data-ui-state'?: never
    'data-ui-variant'?: never
  }

/** Compact icon button with hover/focus label affordance. */
export const UiActionButton = (props: UiActionButtonProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'disabled',
    'error',
    'icon',
    'label',
    'labelMode',
    'loading',
    'variant',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-icon',
    'data-ui-label-mode',
    'data-ui-state',
    'data-ui-variant'
  ])
  const isDisabled = () => local.disabled || local.loading
  return (
    <Button
      {...others}
      aria-label={local.label}
      data-ui='action-button'
      data-ui-icon={local.icon}
      data-ui-label-mode={local.labelMode ?? 'reveal'}
      data-ui-state={controlState(local)}
      data-ui-variant={local.variant}
      disabled={isDisabled()}
      tabIndex={isDisabled() ? -1 : others.tabIndex}
      type={others.type ?? 'button'}
    >
      <span aria-hidden='true' data-ui='action-button-icon' />
      <span aria-hidden='true' data-ui='action-button-label'>{local.label}</span>
    </Button>
  )
}
