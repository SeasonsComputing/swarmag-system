/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Status badge                                                                 ║
║ Named status pill composed from the shared badge.                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Presents a caller-defined status as a UiBadge color pill: its color and its name. A record's
status is a fact about the record, not an outcome, so it takes a named color, never a state.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
StatusBadgeProps  Caller-owned status color and label.
StatusBadge       Status pill naming the status.
*/

import { UiBadge } from '@ux/ui'
import type { UiBadgeColor, UiComponent } from '@ux/ui'

/** Caller-owned status color and label. */
export type StatusBadgeProps = {
  color: UiBadgeColor
  label: string
}

/** Status pill in the status's named color. */
export const StatusBadge = (props: StatusBadgeProps): UiComponent => (
  <span data-app='status-badge'>
    <UiBadge variant='color' color={props.color}>
      {props.label}
    </UiBadge>
  </span>
)
