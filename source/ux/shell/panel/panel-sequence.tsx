/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel sequence                                                               ║
║ Ordered step navigation and mounted validation.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns only an instance-local cursor and validation registration.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelSequenceControl  Cursor and gated traversal.
createPanelSequence   Create a sequence controller.
*/

import { createMemo, createSignal } from '@solid-js'
import type { PanelSequence, PanelStep } from './panel-sequence-contract.ts'

/** An isolated sequence's cursor and gated traversal surface. */
export type PanelSequenceControl = {
  steps: () => PanelSequence
  index: () => number
  current: () => PanelStep
  isFirst: () => boolean
  isLast: () => boolean
  back: () => void
  next: () => boolean
  validate: () => boolean
  complete: () => boolean
  registerValidation: (validate: () => boolean) => () => void
}

/** Create a controller scoped to one mounted sequence. */
export const createPanelSequence = (
  steps: () => PanelSequence
): PanelSequenceControl => {
  if (steps().length === 0) throw new Error('A panel sequence requires at least one step.')
  const [index, setIndex] = createSignal(0)
  const [registered, setRegistered] = createSignal<(() => boolean) | null>(null)
  const current = createMemo(() => steps()[index()])
  const isFirst = () => index() === 0
  const isLast = () => index() === steps().length - 1
  const validate = () => (registered()?.() ?? true) && (current().validate?.() ?? true)
  const move = (position: number): void => {
    setRegistered(null)
    setIndex(position)
  }
  return {
    steps,
    index,
    current,
    isFirst,
    isLast,
    validate,
    complete: () => isLast() && validate(),
    back: () => {
      if (!isFirst()) move(index() - 1)
    },
    next: () => {
      if (isLast() || !validate()) return false
      move(index() + 1)
      return true
    },
    registerValidation: validate => {
      setRegistered(() => validate)
      return () => setRegistered(active => active === validate ? null : active)
    }
  }
}
