/**
 * Namespace-local helpers for control primitive semantics.
 */

import type { JSX } from '@solid-js'

/** App control component return value. */
export type AppComponent = JSX.Element

/** Extends a Kobalte component's prop type to accept data-ui and data-ui-state attributes. */
export type WithDataUI<T> = T & {
  'data-ui'?: string
  'data-ui-state'?: string
  children?: AppComponent
}

/** Semantic control state values allowed by the design language. */
export type AppControlState = 'error' | 'disabled' | 'loading'

/** Props used to derive semantic control state. */
export type AppControlStateProps = {
  error?: boolean
  loading?: boolean
  disabled?: boolean
}

/** Derive the semantic control state from runtime control props. */
export const controlState = (
  props: AppControlStateProps
): AppControlState | undefined => {
  if (props.loading) return 'loading'
  if (props.error) return 'error'
  if (props.disabled) return 'disabled'
  return undefined
}

/** A selectable option for data-driven select controls. */
export type AppOption = { value: string; label?: string }

/** Derive display text from an AppOption — label if present, otherwise value. */
export const appOptionLabel = (option: AppOption): string => option.label ?? option.value
