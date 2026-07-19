/**
 * Namespace-local helpers for control primitive semantics.
 */

import type { JSX } from '@solid-js'

/** Ui component abstractions. */
export type UiComponent = JSX.Element
export type UiContainerProps = { children: UiComponent }
export type UiComponentProps = { children?: UiComponent }

/** Extends a Kobalte component's prop type to accept data-ui and data-ui-state attributes. */
export type WithDataUi<T> = T & UiComponentProps & {
  'data-ui'?: string
  'data-ui-state'?: string
}

/** Semantic control state values allowed by the design language. */
export type UiControlState = 'error' | 'disabled' | 'loading'

/** Props used to derive semantic control state. */
export type UiControlStateProps = {
  error?: boolean
  loading?: boolean
  disabled?: boolean
}

/** Derive the semantic control state from runtime control props. */
export const controlState = (
  props: UiControlStateProps
): UiControlState | undefined => {
  if (props.loading) return 'loading'
  if (props.error) return 'error'
  if (props.disabled) return 'disabled'
  return undefined
}

/** A selectable option for data-driven select controls. */
export type UiOption = { value: string; label?: string }

/** Derive display text from a UiOption — label if present, otherwise value. */
export const uiOptionLabel = (option: UiOption): string => option.label ?? option.value
