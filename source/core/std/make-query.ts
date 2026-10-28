/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Query maker                                                                  ║
║ Declared filters, text search, and ordering as serializable query data.      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Infers allowed criteria and order choices from adapter fields. The phantom
brand guards ordinary construction, not authorization or deliberate casts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
QueryOperator     Query grammar.
ScalarOperators   Equality and membership.
RangeOperators    Equality, membership, and ordered comparisons.
SetOperators      Membership in scalar compositions.
QueryDirection    Sort direction.
QueryScalar       Supported scalar criterion value.
QuerySet          Non-empty readonly criterion values.
QueryOperators    Operators available for one domain field.
Criteria          Readonly ANDed domain-field criteria.
Query             Readonly nominal query sent to stores.
makeQuery         Declare fields and build typed queries.

SEMANTICS
───────────────────────────────────────────────────────────────────────────────
Filters   Criteria are ANDed. Scalars support eq and non-empty in; strings and
          numbers also gt, gte, lt, and lte. Scalar compositions support
          non-empty hasAny and hasAll. Object compositions and the reserved
          names (and, or, not, search) cannot be filters. An absent optional
          value matches no operator. Set non-emptiness is compile-time only.
Search    Only over declared text fields; timestamps are excluded by policy.
          One term matches across them with OR, then ANDs with the filters.
          Build removes stars, trims, and normalizes to NFC, omitting an empty
          term. Case-insensitive, accent-sensitive within Latin casing; stored
          NFC is assumed, not enforced.
Order     Required strings or numbers. Build resolves the requested order, or
          the first field ascending; id breaks ties in the same direction.
*/

import type { Dictionary } from './adt.ts'
import type { Instantiable } from './instance.ts'
import type { FieldAdapter } from './make-adapter.ts'
import type { NominalType } from './nominal-type.ts'

/** Sort direction; cursors must match the query's direction. */
export type QueryDirection = 'asc' | 'desc'

/** The query grammar; stores handle this union exhaustively. */
export type QueryOperator = 'eq' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'hasAny' | 'hasAll'

/** Scalar values supported by the query contract. */
export type QueryScalar = string | number | boolean

/** Non-empty readonly values; non-emptiness is a compile-time constraint. */
export type QuerySet<V> = readonly [V, ...V[]]

/** Equality and membership for scalar fields. */
export type ScalarOperators<V> = {
  readonly eq?: V
  readonly in?: QuerySet<V>
}

/** Scalar operators plus ordered comparisons for strings and numbers. */
export type RangeOperators<V> = ScalarOperators<V> & {
  readonly gt?: V
  readonly gte?: V
  readonly lt?: V
  readonly lte?: V
}

/** Membership predicates for compositions of scalar values. */
export type SetOperators<V> = {
  readonly hasAny?: QuerySet<V>
  readonly hasAll?: QuerySet<V>
}

/** Select the operator family for a field after removing absence. */
export type QueryOperators<V> = NonNullable<V> extends readonly (infer Item)[]
  ? [Item] extends [QueryScalar] ? SetOperators<Item> : never
  : NonNullable<V> extends string | number ? RangeOperators<NonNullable<V>>
  : NonNullable<V> extends boolean ? ScalarOperators<NonNullable<V>>
  : never

/** Readonly domain criteria; every supplied field and operator is ANDed. */
export type Criteria<T> = {
  readonly [K in FilterKey<T>]?: QueryOperators<T[K]>
}

/** Readonly serializable query; the symbol exists only in the type. */
declare const queryBrand: unique symbol
export type Query<T> = NominalType<{
  readonly where: Criteria<T>
  readonly search?: { readonly term: string; readonly fields: readonly (keyof T)[] }
  readonly order: { readonly field: keyof T; readonly direction: QueryDirection }
}, typeof queryBrand>

/**
 * Declare filters, optional text search fields, and a required order default.
 * @param spec Adapter fields; search declarations intentionally exclude timestamps.
 * @returns A builder enforcing the declaration's field sets and operators.
 */
export function makeQuery<
  T extends Instantiable,
  F extends FilterKey<T>,
  O extends OrderKey<T>,
  S extends SearchKey<T> = never
>(spec: {
  filter: readonly FieldAdapter<T, F>[]
  search?: readonly FieldAdapter<T, S>[]
  order: readonly [FieldAdapter<T, O>, ...FieldAdapter<T, O>[]]
}) {
  return {
    build<W extends Criteria<Pick<T, F>> = Criteria<Pick<T, F>>>(input: {
      where?: W & ExactCriteria<T, F, W>
      search?: [S] extends [never] ? never : string
      order?: { field: O; direction: QueryDirection }
    } = {}): Query<T> {
      const where: Dictionary = {}
      const source = input.where as Dictionary | undefined
      for (const field of spec.filter) {
        const operators = source?.[field.key as string]
        if (operators !== undefined) where[field.key as string] = copyOperators(operators)
      }
      const term = input.search?.replaceAll('*', '').trim().normalize('NFC')

      // This cast establishes the erased brand at its sole construction boundary.
      return {
        where,
        ...(term ? { search: { term, fields: (spec.search ?? []).map(field => field.key) } } : {}),
        order: input.order
          ? { ...input.order }
          : { field: spec.order[0].key, direction: 'asc' }
      } as unknown as Query<T>
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

/** Criteria names no domain field may claim. */
type ReservedKey = 'and' | 'or' | 'not' | 'search'

/** Fields filterable by type: scalars and compositions of scalars, never reserved. */
type FilterKey<T> = {
  [K in keyof T]-?: K extends ReservedKey ? never
    : NonNullable<T[K]> extends QueryScalar | readonly QueryScalar[] ? K
    : never
}[keyof T]

/** Text fields eligible for declared search. */
type SearchKey<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends string ? K : never
}[keyof T]

/** Required string or number fields eligible for ordering. */
type OrderKey<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never
    : T[K] extends string | number ? K
    : never
}[keyof T]

/**
 * Reject undeclared fields and operators in criteria.
 * Excess-property checks cover literals only; this also rejects extra keys in typed variables.
 */
type ExactCriteria<T, F extends keyof T, W> = {
  [K in keyof W]: K extends F ? {
      [Op in keyof W[K]]: Op extends keyof QueryOperators<T[K]> ? QueryOperators<T[K]>[Op]
        : never
    }
    : never
}

/** Copy one field's supplied operators, cloning set values and dropping absent ones. */
const copyOperators = (input: unknown): Dictionary => {
  const result: Dictionary = {}
  for (const [operator, value] of Object.entries(input as Dictionary)) {
    if (value === undefined) continue
    result[operator] = Array.isArray(value) ? [...value] : value
  }
  return result
}
