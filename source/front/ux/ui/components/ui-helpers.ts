/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui helpers                                                                   ║
║ Control primitive semantics and consumer-facing text conversions.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds the semantics every control shares — component and prop shapes, control
state, option display — alongside the text conversions consumers apply between
a control's string value and the value an abstraction stores.

CONTROL SEMANTICS
───────────────────────────────────────────────────────────────────────────────
UiComponent          Rendered control element.
UiContainerProps     Props for a control that requires children.
UiComponentProps     Props for a control with optional children.
WithDataUi           Kobalte prop extension carrying data-ui attributes.
UiControlState       Semantic control state values.
UiControlStateProps  Props from which control state is derived.
controlState(props)  Derive the semantic control state.
UiOption             Selectable option for data-driven select controls.
uiOptionLabel(o)     Display text for a UiOption.

TEXT CONVERSION
───────────────────────────────────────────────────────────────────────────────
UiText               Text conversions for control values.
├ optional           Blank text to undefined.
├ number             Text to number.
├ label              kebab-case to display text.
└ from               Number to text.
*/

import type { JSX } from '@solid-js'

// ────────────────────────────────────────────────────────────────────────────
// CONTROL SEMANTICS
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// TEXT CONVERSION
// ────────────────────────────────────────────────────────────────────────────

/** Converts blank input text to undefined; any other text passes through. */
const optional = (value: string): string | undefined => value.trim() ? value : undefined

/**
 * Converts input text to a number; blank and non-finite text become undefined.
 *
 * Not safe for a controlled round-trip on every input event: read back through
 * `from` and `40.` becomes `40` before the user types the next digit, which
 * makes a decimal untypeable. Commit numeric fields on `change`.
 *
 * @param value Raw control text.
 * @returns The number the text denotes, or undefined.
 */
const number = (value: string): number | undefined => {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Converts a kebab-case value into display text. */
const label = (value: string): string =>
  value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/**
 * Produces control text from a number; undefined becomes blank text.
 *
 * Not safe for a controlled round-trip on every input event: pair with `number`
 * and `40.` becomes `40` before the user types the next digit, which makes a
 * decimal untypeable. Commit numeric fields on `change`.
 *
 * @param value The number to render, or undefined.
 * @returns Text for a control value.
 */
const from = (value: number | undefined): string => value === undefined ? '' : value.toString()

/** Text conversions between a control's string value and the value it carries. */
export const UiText = {
  optional,
  number,
  label,
  from
}
