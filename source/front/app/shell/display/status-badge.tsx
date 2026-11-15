/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Status badge                                                                 ║
║ Named status pill composed from the shared badge.                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Presents a caller-defined status as a UiBadge pill: its tone and its name.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
StatusBadgeProps  Caller-owned status tone and label.
StatusBadge       Status pill naming the status.
*/

import { UiBadge } from '@ux/ui'
import type { UiBadgeVariant, UiComponent } from '@ux/ui'

/** Caller-owned status tone and label. */
export type StatusBadgeProps = {
  variant: UiBadgeVariant
  label: string
}

/** Status pill with the shared badge's variant treatment. */
export const StatusBadge = (props: StatusBadgeProps): UiComponent => (
  <span data-app='status-badge'>
    <UiBadge variant={props.variant}>
      {props.label}
    </UiBadge>
  </span>
)
