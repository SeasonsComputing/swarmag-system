/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui field                                                                     ║
║ Label or caption + control wrapper.                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Canonical single-field wrapper. Label mode renders a <label> and its control as
siblings inside a grid container. Caption mode renders <figure> + <figcaption>
for non-labelable controls.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiField  Label/caption + control field wrapper.
*/

import type { UiComponent, UiContainerProps } from './ui-helpers.ts'

/** UiField label-mode props. */
export type UiFieldLabelProps = UiContainerProps & {
  /** Text content of the field label. */
  label: string
  /** ID of the associated control — wired to the label's `for` attribute. */
  for: string
  /** Marks the field as required — renders a visible required mark. */
  required?: boolean
  /** Optional layout variant. `'inline'` places label and control side-by-side. */
  variant?: 'inline'
}

/** UiField caption-mode props. */
export type UiFieldCaptionProps = UiContainerProps & {
  /** Text content of the field caption. */
  label: string
  /** Marks the field as required — renders a visible required mark. */
  required?: boolean
  /** Caption mode is for non-labelable controls. */
  variant: 'caption'
  /** Caption mode does not emit a `label for` association. */
  for?: never
}

/** UiField props. */
export type UiFieldProps = UiFieldLabelProps | UiFieldCaptionProps

/** Label/caption + control field wrapper. Label and control are siblings, never nested. */
export const UiField = (props: UiFieldProps): UiComponent =>
  props.variant === 'caption'
    ? (
      <figure
        data-ui='field'
        data-ui-variant='caption'
        data-ui-required={props.required ? '' : undefined}
      >
        <figcaption>{props.label}</figcaption>
        {props.children}
      </figure>
    )
    : (
      <div
        data-ui='field'
        data-ui-variant={props.variant}
        data-ui-required={props.required ? '' : undefined}
      >
        <label for={props.for}>{props.label}</label>
        {props.children}
      </div>
    )
