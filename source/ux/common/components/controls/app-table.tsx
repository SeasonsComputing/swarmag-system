/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ App table control                                                            ║
║ Semantic wrappers for HTML table primitives.                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Emits table semantics without styling concerns.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AppTable        Table root — renders <table>.
AppTableHeader  Header row — renders <thead><tr>; children become <th>.
AppTableBody    Body section — renders <tbody>.
AppTableRow     Body row — renders <tr>. variant='section' for group-header rows.
AppTableCell    Cell — renders <th> inside AppTableHeader, <td> elsewhere. Accepts align prop.
*/

import { createContext, type JSX, splitProps, useContext } from '@solid-js'

const TableHeaderCtx = createContext(false)
const TableSectionCtx = createContext(false)

export type AppTableProps =
  & Omit<
    JSX.HTMLAttributes<HTMLTableElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-variant'
  >
  & {
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

export type AppTableHeaderProps = {
  children: JSX.Element
}

export type AppTableBodyProps =
  & Omit<
    JSX.HTMLAttributes<HTMLTableSectionElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-variant'
  >
  & {
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

export type AppTableRowProps =
  & Omit<
    JSX.HTMLAttributes<HTMLTableRowElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-variant'
  >
  & {
    variant?: 'section'
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

export type AppTableCellProps =
  & Omit<
    JSX.HTMLAttributes<HTMLTableCellElement>,
    'class' | 'classList' | 'style' | 'data-ui' | 'data-ui-variant' | 'align'
  >
  & {
    align?: 'left' | 'right' | 'center'
    class?: never
    classList?: never
    style?: never
    'data-ui'?: never
    'data-ui-variant'?: never
  }

/** Table root. */
export const AppTable = (props: AppTableProps): JSX.Element => {
  const [, others] = splitProps(props, ['class', 'classList', 'style', 'data-ui', 'data-ui-variant'])
  return <table {...others} data-ui='table' />
}

/** Header row. Wraps children in <thead><tr>; cells render as <th>. */
export const AppTableHeader = (props: AppTableHeaderProps): JSX.Element => (
  <TableHeaderCtx.Provider value>
    <thead data-ui='table-head'>
      <tr>
        {props.children}
      </tr>
    </thead>
  </TableHeaderCtx.Provider>
)

/** Body section. */
export const AppTableBody = (props: AppTableBodyProps): JSX.Element => {
  const [, others] = splitProps(props, ['class', 'classList', 'style', 'data-ui', 'data-ui-variant'])
  return <tbody {...others} data-ui='table-body' />
}

/** Body row. Use variant='section' for a group-header row. */
export const AppTableRow = (props: AppTableRowProps): JSX.Element => {
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

/** Cell — <th> inside AppTableHeader, <td> elsewhere. Spans all columns inside a section row. */
export const AppTableCell = (props: AppTableCellProps): JSX.Element => {
  const isHeader = useContext(TableHeaderCtx)
  const isSection = useContext(TableSectionCtx)
  const [local, others] = splitProps(props, [
    'align',
    'class',
    'classList',
    'style',
    'data-ui',
    'data-ui-variant'
  ])
  return isHeader
    ? <th {...others} data-ui='table-cell' data-ui-align={local.align} />
    : <td {...others} colspan={isSection ? 9999 : undefined} data-ui='table-cell' data-ui-align={local.align} />
}
