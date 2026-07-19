/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Use abstraction form validation                                              ║
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
the rings when native required validation blocks a submission — the feedback
banner itself is owned by useAbstractionFormFeedback.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AbstractionFieldRules                        Field name → validation rule map.
AbstractionFormValidation                    Editor-facing validation surface.
useAbstractionFormValidation(formRef, rules) Wire the timing state machine.
*/

import type { Dictionary, ExpectResult } from '@core/std'
import { createSignal, onCleanup, onMount } from '@solid-js'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/** Field name → rule returning ExpectResult (null when valid). */
export type AbstractionFieldRules = Dictionary<() => ExpectResult>

/** Editor-facing validation surface returned by useAbstractionFormValidation. */
export interface AbstractionFormValidation {
  /** Whether the named field is currently shown in error. */
  isInvalid: (field: string) => boolean
  /** Validate a text field on blur; returns whether the field is valid. */
  blurField: (field: string) => boolean
  /** Revalidate an already-invalid text field as the user corrects it. */
  inputField: (field: string) => void
  /** Revalidate a discrete control immediately on change. */
  changeField: (field: string) => void
  /** Validate every field; returns true when the form is clean. */
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
export const useAbstractionFormValidation = (
  formRef: () => HTMLFormElement | undefined,
  rules: AbstractionFieldRules
): AbstractionFormValidation => {
  const [errors, setErrors] = createSignal<Dictionary<boolean>>({})

  const validateField = (field: string): boolean => {
    const rule = rules[field]
    if (!rule) return true
    const valid = rule() === null
    setErrors(previous => ({ ...previous, [field]: !valid }))
    return valid
  }
  const validateForm = (): boolean =>
    Object.keys(rules)
      .map(validateField)
      .every(valid => valid)

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
    isInvalid: field => errors()[field] === true,
    blurField: validateField,
    inputField: field => {
      if (errors()[field]) validateField(field)
    },
    changeField: validateField,
    validateForm,
    reset: () => setErrors({})
  }
}
