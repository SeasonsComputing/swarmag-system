/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui helpers                                                                   ║
║ Control primitive semantics and consumer-facing text conversions.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds the semantics every control shares — component and prop shapes, control
state, option display — alongside the text conversions consumers apply between
a control's string value, the value an abstraction stores, and the display text
derived from either.

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
UiText               Text conversions for control values and display text.
├ optional           Blank text to undefined.
├ number             Text to number.
├ label              kebab-case to display text.
├ untitled           Blank value to a consumer-supplied label.
├ relativeTime       Timestamp relative to now, in local time.
└ from               Number to text.
*/

import type { When } from '@core/std'
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
 * Produces display text for a value that may carry no content.
 *
 * The rule is shared; the copy is not. `fallback` is required so the wording
 * stays with the consumer that knows what the value names — a default here
 * would put application copy in the catalog.
 *
 * @param value The value's own text, which may be blank or whitespace.
 * @param fallback Display text for a value with no content.
 * @returns The trimmed value, or the fallback when it carries none.
 */
const untitled = (value: string, fallback: string): string => value.trim() || fallback

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

/**
 * Formats a past timestamp relative to now, using local calendar days and time.
 *
 * @param value The timestamp to display.
 * @returns Relative text formatted based on elapsed time:
 *
 * +-------------------+---------------------------------------------+
 * | Elapsed Time      | Output Format Example                       |
 * +-------------------+---------------------------------------------+
 * | < 1 minute        | Just now                                    |
 * | Today             | 5 minutes ago / 2 hours ago                 |
 * | Yesterday         | Yesterday at 3:15 in the evening            |
 * | Past 7 days       | Monday at 3:15 in the evening               |
 * | Older timestamps  | October 24th at 3:15 PM                     |
 * +-------------------+---------------------------------------------+
 */
const relativeTime = (value: When): string => {
  // Helper: format time with "in the morning / evening"
  const formatTimeWithPeriod = (d: Date): string => {
    const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return timeStr
      .replace(/\s*AM/i, ' in the morning')
      .replace(/\s*PM/i, ' in the evening')
  }

  // Handle now
  const date = new Date(value)
  const now = new Date()
  const elapsed = now.getTime() - date.getTime()
  if (elapsed < 60_000) return 'Just now'

  // Handle today (earlier today)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (date >= today) {
    const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    return elapsed < 3_600_000
      ? relative.format(-Math.trunc(elapsed / 60_000), 'minute')
      : relative.format(-Math.trunc(elapsed / 3_600_000), 'hour')
  }

  // Handle yesterday
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date >= yesterday && date < today) {
    return `Yesterday at ${formatTimeWithPeriod(date)}`
  }

  // Handle within the past 7 days (show weekday name + time)
  const dayInMs = 24 * 3600 * 1000
  if (elapsed < 7 * dayInMs) {
    const weekday = date.toLocaleDateString(undefined, { weekday: 'long' })
    return `${weekday} at ${formatTimeWithPeriod(date)}`
  }

  // Helper for ordinal day suffixes (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }

  const month = date.toLocaleDateString(undefined, { month: 'long' })
  const dayNum = date.getDate()
  const dayStr = `${dayNum}${getOrdinalSuffix(dayNum)}`
  const standardTimeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const yearStr = date.getFullYear() !== now.getFullYear() ? `, ${date.getFullYear()}` : ''

  // Fallback to absolute date/time format for older timestamps (using standard AM/PM)
  return `${month} ${dayStr}${yearStr} at ${standardTimeStr}`
}

/** Text conversions for a control's string value and the display text derived from it. */
export const UiText = {
  optional,
  number,
  label,
  untitled,
  relativeTime,
  from
}
