/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Use abstraction form keyboard                                                ║
║ Enter-advance keyboard flow for abstraction editors.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Implements the design-language keyboard contract for entity editor forms:
Enter in a single-line input advances focus to the next form control instead
of triggering implicit submission, so a half-completed form is never
submit-validated by habit. An optional advance guard validates the current
field first — Enter stays on an invalid field rather than walking away from
its error. Textareas keep Enter for newlines; buttons keep Enter for
activation, so Enter on the focused Save button remains the deliberate
submission path. Also provides the standalone first-field focus used by
AbstractionManager on editor open and entity switch, deferred past the
panel-collapse motion and the dialog's own focus management.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
focusFirstField(container)                  Focus a container's first field.
useAbstractionFormKeyboard(formRef, guard?) Wire the Enter-advance behavior.
*/

import { onCleanup, onMount } from '@solid-js'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/**
 * Focus the first field within a container, deferred past the panel-collapse
 * motion and the dialog's own focus management.
 * @param container Getter returning the container element once mounted.
 */
export const focusFirstField = (container: () => HTMLElement | undefined): void => {
  const focusFirst = (): void => {
    const host = container()
    const first = host?.querySelector<HTMLElement>('input:not([type=hidden]), textarea')
    first?.focus()
  }
  requestAnimationFrame(() => requestAnimationFrame(focusFirst))
  // The panel-collapse transition delays hiding the outgoing panel; when it
  // finally hides, the browser kicks focus and the dialog reclaims it — so
  // re-assert once the motion has settled, unless focus already moved on.
  setTimeout(() => {
    const host = container()
    if (host && !host.contains(document.activeElement)) focusFirst()
  }, motionSettleMs())
}

/**
 * Wire Enter-advance keyboard flow for an abstraction editor form.
 * @param formRef Getter returning the form element once mounted.
 * @param advanceGuard Optional per-field gate — return false to hold focus.
 */
export const useAbstractionFormKeyboard = (
  formRef: () => HTMLFormElement | undefined,
  advanceGuard?: (field: string) => boolean
): void => {
  onMount(() => {
    const form = formRef()
    if (!form) return
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter') return
      const target = event.target
      if (!(target instanceof HTMLInputElement)) return
      event.preventDefault()
      if (advanceGuard && target.name && !advanceGuard(target.name)) return
      const controls = formControls(form)
      const next = controls[controls.indexOf(target) + 1]
      next?.focus()
    }
    form.addEventListener('keydown', onKeydown)
    onCleanup(() => form.removeEventListener('keydown', onKeydown))
  })
}

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ────────────────────────────────────────────────────────────────────────────

const CONTROL_SELECTOR =
  'input:not([type=hidden]), textarea, select, button, [tabindex]:not([tabindex="-1"])'

const MOTION_SETTLE_BUFFER_MS = 50

/** Panel-collapse motion duration from the design tokens, plus settle buffer. */
const motionSettleMs = (): number => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--sa-motion-page-fade')
  return (Number.parseFloat(raw) || 0) + MOTION_SETTLE_BUFFER_MS
}

/** Enabled, rendered form controls in document order. */
const formControls = (form: HTMLFormElement): HTMLElement[] =>
  [...form.querySelectorAll<HTMLElement>(CONTROL_SELECTOR)]
    .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
