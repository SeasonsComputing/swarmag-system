/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App multi-select control                                                     ║
║ Semantic wrapper for the Kobalte Listbox primitive.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits multi-select control semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppMultiSelect  Multi-value select control with declared states.
*/

import { Listbox } from '@kobalte/core/listbox'
import { type JSX, splitProps } from '@solid-js'
import { controlState } from './controls-helpers.ts'

/** Multi-select control props. */
export type AppMultiSelectProps = {
  children?: JSX.Element
  disabled?: boolean
  error?: boolean
  loading?: boolean
  class?: never
  classList?: never
  style?: never
  'data-ui'?: never
  'data-ui-state'?: never
}

type AppMultiSelectRootProps = {
  children?: JSX.Element
  disabled?: boolean
  selectionMode?: 'multiple'
  'data-ui': 'multi-select'
  'data-ui-state'?: 'error' | 'disabled' | 'loading'
}

const ListboxRoot = Listbox as unknown as (props: AppMultiSelectRootProps) => JSX.Element

/** Multi-value select control with declared states. */
export const AppMultiSelect = (props: AppMultiSelectProps): JSX.Element => {
  const [local] = splitProps(props, [
    'children',
    'disabled',
    'error',
    'loading',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-state'
  ])

  return (
    <ListboxRoot
      data-ui='multi-select'
      data-ui-state={controlState(local)}
      disabled={local.disabled || local.loading}
      selectionMode='multiple'
    >
      {local.children}
    </ListboxRoot>
  )
}
