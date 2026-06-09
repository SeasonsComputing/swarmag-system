/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui list control                                                              ║
║ Semantic wrapper for HTML ul/ol/li primitives.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits list semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiList      List with declared variant. Renders <ol> for numbered, <ul> otherwise.
UiListItem  List item — child of UiList.
*/

import { type JSX, splitProps } from '@solid-js'
import { type UiComponent, type UiComponentProps } from './ui-helpers.ts'

/** List variant. Omit for a clean unstyled list. */
export type UiListVariant = 'bullet' | 'numbered'

/** List control props. */
export type UiListProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLUListElement | HTMLOListElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-variant'
  >
  & {
    name?: string
    variant?: UiListVariant
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

/** List item props. */
export type UiListItemProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLLIElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
  >
  & {
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
  }

/** List with declared variant. Renders <ol> for numbered, <ul> otherwise. */
export const UiList = (props: UiListProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'id',
    'name',
    'variant',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant'
  ])
  return local.variant === 'numbered'
    ? (
      <ol
        {...others as JSX.OlHTMLAttributes<HTMLOListElement>}
        id={local.id ?? local.name}
        data-ui='list'
        data-ui-variant={local.variant}
      />
    )
    : (
      <ul
        {...others as JSX.HTMLAttributes<HTMLUListElement>}
        id={local.id ?? local.name}
        data-ui='list'
        data-ui-variant={local.variant}
      />
    )
}

/** List item — child of UiList. */
export const UiListItem = (props: UiListItemProps): UiComponent => {
  const [, others] = splitProps(props, ['class', 'classList', 'style', 'data-ui'])

  return <li {...others} data-ui='list-item' />
}
