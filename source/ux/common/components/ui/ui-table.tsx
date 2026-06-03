/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Ui table control                                                            ║
║ Semantic wrappers for HTML table primitives.                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits table semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UiTable        Table root — optionally wraps <table> in an overflow container.
UiTableHeader  Header row — renders <thead><tr>; children become <th>.
UiTableBody    Body section — renders <tbody>.
UiTableRow     Body row — renders <tr>. variant='section' for group-header rows.
UiTableCell    Cell — renders <th> inside UiTableHeader, <td> elsewhere. Accepts align prop.
*/

import { createContext, type JSX, splitProps, useContext } from '@solid-js'
import type { UiComponent, UiComponentProps, UiContainerProps } from './ui-helpers.ts'

const TableHeaderCtx = createContext(false)
const TableSectionCtx = createContext(false)

/** UiTable overflow behavior. */
export type UiTableOverflow = 'hidden' | 'scroll'

/** UiTable props. */
export type UiTableProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLTableElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-variant'
    | 'data-ui-overflow'
    | 'overflow'
  >
  & {
    name?: string
    overflow?: UiTableOverflow
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
    'data-ui-overflow'?: never
  }

/** UiTableHeader props. */
export type UiTableHeaderProps = UiContainerProps

/** UiTableBody props. */
export type UiTableBodyProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLTableSectionElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-variant'
  >
  & {
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

/** UiTableRow props. */
export type UiTableRowProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLTableRowElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'role'
    | 'data-ui'
    | 'data-ui-variant'
  >
  & {
    variant?: 'section'
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

/** UiTableCell props. */
export type UiTableCellProps =
  & UiComponentProps
  & Omit<
    JSX.HTMLAttributes<HTMLTableCellElement>,
    | 'children'
    | 'class'
    | 'classList'
    | 'style'
    | 'data-ui'
    | 'data-ui-variant'
    | 'data-ui-align'
    | 'align'
  >
  & {
    align?: 'start' | 'center' | 'end'
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
    'data-ui-align'?: never
  }

/** Table root with optional horizontal overflow handling. */
export const UiTable = (props: UiTableProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'id',
    'name',
    'overflow',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant',
    'data-ui-overflow'
  ])
  const table = <table {...others} id={local.id ?? local.name} data-ui='table' />
  return local.overflow
    ? (
      <div data-ui='table-container' data-ui-overflow={local.overflow}>
        {table}
      </div>
    )
    : table
}

/** Header row. Wraps children in <thead><tr>; cells render as <th>. */
export const UiTableHeader = (props: UiTableHeaderProps): UiComponent => (
  <TableHeaderCtx.Provider value>
    <thead data-ui='table-head'>
      <tr data-ui='table-row'>
        {props.children}
      </tr>
    </thead>
  </TableHeaderCtx.Provider>
)

/** Body section. */
export const UiTableBody = (props: UiTableBodyProps): UiComponent => {
  const [, others] = splitProps(props, [
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant'
  ])
  return <tbody {...others} data-ui='table-body' />
}

/** Body row. Use variant='section' for a group-header row. */
export const UiTableRow = (props: UiTableRowProps): UiComponent => {
  const [local, others] = splitProps(props, [
    'variant',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant'
  ])
  return (
    <TableSectionCtx.Provider value={local.variant === 'section'}>
      <tr
        {...others}
        data-ui='table-row'
        data-ui-variant={local.variant}
      />
    </TableSectionCtx.Provider>
  )
}

/** Cell — <th> inside UiTableHeader, <td> elsewhere. Spans all columns inside a section row. */
export const UiTableCell = (props: UiTableCellProps): UiComponent => {
  const isHeader = useContext(TableHeaderCtx)
  const isSection = useContext(TableSectionCtx)
  const [local, others] = splitProps(props, [
    'align',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant',
    'data-ui-align'
  ])
  return isHeader
    ? <th {...others} data-ui='table-cell' data-ui-align={local.align} />
    : (
      <td
        {...others}
        colspan={isSection ? 9999 : undefined}
        data-ui='table-cell'
        data-ui-align={local.align}
      />
    )
}
