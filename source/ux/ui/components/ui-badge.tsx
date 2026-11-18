/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui badge control                                                             ║
║ Semantic badge primitive.                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits badge control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiBadgeVariant     Badge variants declared by the design language.
UiBadgeColor       Named colors for the color variant.
UiBadge            Badge control with declared states.

COMPONENT PROPERTIES
───────────────────────────────────────────────────────────────────────────────
UiBadgeProps       Badge control props; extends UiComponentProps and filtered span attributes.
├ variant          Declared visual variant.
├ color            Named color; required exactly when variant is 'color'.
├ error            Marks the error state.
├ loading          Marks the loading state.
└ disabled         Disables interaction.
*/

import { type JSX, splitProps } from '@solid-js'
import { controlState } from './ui-helpers.ts'
import type { UiComponent, UiComponentProps } from './ui-helpers.ts'

/** Badge variants declared by the design language. */
export type UiBadgeVariant = 'success' | 'warning' | 'danger' | 'info'

/** Named colors for the color variant. */
export type UiBadgeColor = 'gray' | 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'cyan'

/** Badge control props. */
export type UiBadgeProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLSpanElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-variant'
    | 'data-ui-state'
    | 'color'
    | 'data-ui-color'
  >
  & {
    error?: boolean
    loading?: boolean
    disabled?: boolean
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
    'data-ui-state'?: never
    'data-ui-color'?: never
  }
  & (
    | { variant?: UiBadgeVariant; color?: never }
    | { variant: 'color'; color: UiBadgeColor }
  )

/** Badge control with declared states. */
export const UiBadge = (props: UiBadgeProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'variant',
    'color',
    'error',
    'loading',
    'disabled',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant',
    'data-ui-color',
    'data-ui-state'
  ])
  return (
    <span
      {...others}
      data-ui='badge'
      data-ui-variant={local.variant}
      data-ui-color={local.variant === 'color' ? local.color : undefined}
      data-ui-state={controlState(local)}
    />
  )
}
