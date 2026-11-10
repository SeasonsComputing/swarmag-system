/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Table label content                                                          ║
║ Wrapping text and an optional leading catalog glyph for notes tables.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Shares the notes editor's label treatment between notes and attachments.
Text is secondary and icons primary at rest; an interactive row's hover or
keyboard focus makes text primary and icons the primary accent color.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
LabelCellProps  Label text and optional catalog icon.
├ text          Visible wrapping text.
├ icon          Catalog glyph name.
└ iconLabel     Accessible name; omit for a decorative icon.
LabelCell       Cell content, without a table-cell wrapper or action.
*/

import { Show } from '@solid-js'
import type { UiComponent } from '@ux/ui'

import './table-cells.css'

/** Wrapping label with an optional leading catalog icon. */
export type LabelCellProps = { text: string; icon?: string; iconLabel?: string }

/** Render label content whose colors follow its containing interactive row. */
export const LabelCell = (props: LabelCellProps): UiComponent => (
  <span data-shell='label-cell'>
    <Show when={props.icon}>
      <span
        data-shell='label-cell-icon'
        data-ui-icon={props.icon}
        role={props.iconLabel ? 'img' : undefined}
        aria-label={props.iconLabel}
        aria-hidden={props.iconLabel ? undefined : true}
      />
    </Show>
    <span data-shell='label-cell-text'>{props.text}</span>
  </span>
)
