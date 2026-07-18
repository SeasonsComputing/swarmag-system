/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Use abstraction form feedback                                                ║
║ Bridges native form validation into AbstractionManagerFeedback.              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Native `invalid` events don't bubble, so a form must listen during the capture
phase to observe them at all. The native validation bubble is browser-rendered
chrome that ignores a dialog's own bounds, so its default is suppressed here —
the browser still focuses the invalid field, but only the panel's own feedback
banner is shown. Any AbstractionManager entity editor form can call this once
instead of re-wiring the capture listener by hand.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
useAbstractionFormFeedback(formRef, onFeedback, message?)  Wire the bridge.
*/

import { onCleanup, onMount } from '@solid-js'
import type { AbstractionManagerFeedback } from '@ux/common/shell/abstraction-manager-contract.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/**
 * Wire a form's native validation failures into an AbstractionManagerFeedback banner.
 * @param formRef Getter returning the form element once mounted.
 * @param onFeedback Feedback reporter, typically the editor's onFeedback prop.
 * @param message Feedback message shown on validation failure.
 */
export const useAbstractionFormFeedback = (
  formRef: () => HTMLFormElement | undefined,
  onFeedback: (feedback: AbstractionManagerFeedback | null) => void,
  message = 'Review the required fields.'
): void => {
  onMount(() => {
    const form = formRef()
    if (!form) return
    const onInvalid = (event: Event): void => {
      event.preventDefault()
      onFeedback({ message, variant: 'danger' })
    }
    form.addEventListener('invalid', onInvalid, true)
    onCleanup(() => form.removeEventListener('invalid', onInvalid, true))
  })
}
