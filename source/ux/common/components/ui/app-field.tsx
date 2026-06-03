/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App field                                                                    ║
║ Label or caption + control wrapper.                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Canonical single-field wrapper. Label mode renders a <label> and its control as
siblings inside a grid container. Caption mode renders <figure> + <figcaption>
for non-labelable controls.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppField  Label/caption + control field wrapper.
*/

import type { AppComponent, AppContainerProps } from './ui-helpers.ts'

/** AppField label-mode props. */
export type AppFieldLabelProps = AppContainerProps & {
  /** Text content of the field label. */
  label: string
  /** ID of the associated control — wired to the label's `for` attribute. */
  for: string
  /** Optional layout variant. `'inline'` places label and control side-by-side. */
  variant?: 'inline'
}

/** AppField caption-mode props. */
export type AppFieldCaptionProps = AppContainerProps & {
  /** Text content of the field caption. */
  label: string
  /** Caption mode is for non-labelable controls. */
  variant: 'caption'
  /** Caption mode does not emit a `label for` association. */
  for?: never
}

/** AppField props. */
export type AppFieldProps = AppFieldLabelProps | AppFieldCaptionProps

/** Label/caption + control field wrapper. Label and control are siblings, never nested. */
export const AppField = (props: AppFieldProps): AppComponent =>
  props.variant === 'caption'
    ? (
      <figure data-ui='field' data-ui-variant='caption'>
        <figcaption>{props.label}</figcaption>
        {props.children}
      </figure>
    )
    : (
      <div data-ui='field' data-ui-variant={props.variant}>
        <label for={props.for}>{props.label}</label>
        {props.children}
      </div>
    )
