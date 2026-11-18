/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder source                                                          ║
║ How each document arrives: its name and its pill color.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
The one presentation of a Field Binder upload source, shared by the reader and
the Admin Manager.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderSources      Each source's name and pill color.
FieldBinderSourceBadge  A source as its pill.
*/

import type { FieldBinderUploadSource } from '@front/api/field-binder-inventory.ts'
import { UiBadge } from '@ux/ui'
import type { UiBadgeColor, UiComponent } from '@ux/ui'

/** Each source's name and pill color. */
export const FieldBinderSources: {
  [Source in FieldBinderUploadSource]: { label: string; color: UiBadgeColor }
} = {
  upload: { label: 'Upload', color: 'blue' },
  library: { label: 'Library', color: 'yellow' },
  url: { label: 'Chemicals', color: 'purple' }
}

/** A source as its pill. */
export const FieldBinderSourceBadge = (props: { source: FieldBinderUploadSource }): UiComponent => (
  <UiBadge variant='color' color={FieldBinderSources[props.source].color}>
    {FieldBinderSources[props.source].label}
  </UiBadge>
)
