/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Use form validation                                                          ║
║ Field-level validation timing for abstraction editors.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Implements the design-language validation timing contract for entity editor
forms: text fields validate on blur, invalid text fields revalidate as the
user corrects them, and discrete controls (selects, multi-selects, checkboxes,
radios) revalidate immediately on change. Rules are ExpectResult thunks over
the editor's own state, so the same @core/std primitives that guard the domain
boundary drive the error rings here. A capture-phase `invalid` listener lights
the rings when native required validation blocks a save — the feedback banner
itself is owned by the manager.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FormFieldRules                            Field name → validation rule map.
FormValidation                            Editor-facing validation surface.
├ isInvalid                               Reads a field's error state.
├ blurField                               Validates on blur.
├ inputField                              Revalidates corrected text.
├ changeField                             Revalidates discrete controls.
├ validateForm                            Validates all fields and focuses the first error.
└ reset                                   Clears error state.
useFormValidation(formRef, rules) Wire the timing state machine.
*/

import type { Dictionary, ExpectResult } from '@core/std'
import { createSignal, onCleanup, onMount } from '@solid-js'

// ────────────────────────────────────────────────────────────────────────────
// FORM VALIDATION
// ────────────────────────────────────────────────────────────────────────────

/** Field name → rule returning ExpectResult (null when valid). */
export type FormFieldRules = Dictionary<() => ExpectResult>

/** Editor-facing validation surface returned by useFormValidation. */
export interface FormValidation {
  /** Whether the named field is currently shown in error. */
  isInvalid: (field: string) => boolean
  /** Validate a text field on blur; returns whether the field is valid. */
  blurField: (field: string) => boolean
  /** Revalidate an already-invalid text field as the user corrects it. */
  inputField: (field: string) => void
  /** Revalidate a discrete control immediately on change. */
  changeField: (field: string) => void
  /** Validate every field, focusing the first invalid control; true when clean. */
  validateForm: () => boolean
  /** Clear every shown error state (e.g. when the editor loads a new entity). */
  reset: () => void
}

/**
 * Wire the validation timing state machine for an abstraction editor form.
 * @param formRef Getter returning the form element once mounted.
 * @param rules Field validation rules over the editor's own state.
 * @returns Validation surface for wiring controls.
 */
export const useFormValidation = (
  formRef: () => HTMLFormElement | undefined,
  rules: FormFieldRules
): FormValidation => {
  const [errors, setErrors] = createSignal<Dictionary<boolean>>({})

  const validateField = (field: string): boolean => {
    const rule = rules[field]
    if (!rule) return true
    const valid = rule() === null
    setErrors(previous => ({ ...previous, [field]: !valid }))
    return valid
  }
  const validateForm = (): boolean => {
    const invalid = Object.keys(rules).filter(field => !validateField(field))
    focusInvalid(formRef(), invalid)
    return invalid.length === 0
  }

  onMount(() => {
    const form = formRef()
    if (!form) return
    const onInvalid = (): void => {
      validateForm()
    }
    form.addEventListener('invalid', onInvalid, true)
    onCleanup(() => form.removeEventListener('invalid', onInvalid, true))
  })

  return {
    isInvalid: (field: string): boolean => errors()[field] === true,
    blurField: validateField,
    inputField: (field: string): void => {
      if (errors()[field]) validateField(field)
    },
    changeField: validateField,
    validateForm,
    reset: (): void => {
      setErrors({})
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ────────────────────────────────────────────────────────────────────────────

/**
 * Focus the first invalid control the form exposes by name — rule keys match
 * control `name` attributes. A composite without one is skipped, not trapped on.
 */
const focusInvalid = (form: HTMLFormElement | undefined, fields: string[]): void => {
  if (!form) return
  const control = fields
    .map(field => form.querySelector<HTMLElement>(`[name="${field}"]`))
    .find(element => element !== null)
  control?.focus()
}
