/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App list control                                                             ║
║ Semantic wrapper for HTML ul/ol/li primitives.                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits list semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppList      List with declared variant. Renders <ol> for numbered, <ul> otherwise.
AppListItem  List item — child of AppList.
*/

import { type JSX, splitProps } from '@solid-js'
import { type AppComponent, type AppComponentProps } from './ui-helpers.ts'

/** List variant. Omit for a clean unstyled list. */
export type AppListVariant = 'bullet' | 'numbered'

/** List control props. */
export type AppListProps =
  & AppComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLUListElement | HTMLOListElement>,
    'children' | 'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-variant'
  >
  & {
    variant?: AppListVariant
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

/** List item props. */
export type AppListItemProps =
  & AppComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLLIElement>,
    'children' | 'class' | 'classList' | 'style' | 'data-ui'
  >
  & {
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
  }

/** List with declared variant. Renders <ol> for numbered, <ul> otherwise. */
export const AppList = (props: AppListProps): AppComponent => {
  const [local, others] = splitProps(props, [
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
        data-ui='list'
        data-ui-variant={local.variant}
      />
    )
    : (
      <ul
        {...others as JSX.HTMLAttributes<HTMLUListElement>}
        data-ui='list'
        data-ui-variant={local.variant}
      />
    )
}

/** List item — child of AppList. */
export const AppListItem = (props: AppListItemProps): AppComponent => {
  const [, others] = splitProps(props, ['class', 'classList', 'style', 'data-ui'])

  return <li {...others} data-ui='list-item' />
}
