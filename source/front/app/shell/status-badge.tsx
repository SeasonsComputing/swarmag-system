/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Status badge                                                                 ║
║ Named status graphic composed from the shared badge and icon catalog.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Presents a caller-defined status using UiBadge tone and a catalog glyph.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
StatusBadgeProps  Caller-owned status tone, glyph, and accessible label.
StatusBadge       Accessible icon status badge.
*/

import { UiBadge } from '@ux/ui'
import type { UiBadgeVariant, UiComponent } from '@ux/ui'

import './status-badge.css'

/** Caller-owned status tone, catalog glyph, and accessible label. */
export type StatusBadgeProps = {
  variant: UiBadgeVariant
  icon: string
  label: string
}

/** Accessible status graphic with the shared badge's variant treatment. */
export const StatusBadge = (props: StatusBadgeProps): UiComponent => (
  <span data-app='status-badge'>
    <UiBadge variant={props.variant}>
      <span
        data-app='status-badge-icon'
        data-ui-icon={props.icon}
        role='img'
        aria-label={props.label}
        title={props.label}
      />
    </UiBadge>
  </span>
)
