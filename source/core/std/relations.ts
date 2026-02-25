/**
 * Relational type primitives for the swarmAg domain model.
 *
 * Two orthogonal concepts:
 *
 * Composition — inward, embedded subordinate values with no independent lifecycle.
 *   Stored as JSONB arrays. Always [] when empty, never null.
 *   All four Composition types resolve to readonly T[] at runtime — cardinality
 *   is a documentation contract enforced at boundaries via the is* guards.
 *   CompositionOne      exactly 1
 *   CompositionOptional 0 or 1
 *   CompositionMany     0 or more
 *   CompositionPositive 1 or more
 *
 * Association — outward, foreign key references to independently lifecycled rows.
 *   Stored as UUID columns. Phantom type parameter carries the referenced type
 *   for documentation and tooling; resolves to Id at runtime.
 *   AssociationOne      required FK — many side of 1:m or true 1:1
 *   AssociationOptional optional FK — nullable column
 *   AssociationJunction FK pair in an m:m junction table — both sides declare this
 */

import type { Id } from '@core-std'

// ────────────────────────────────────────────────────────────────────────────
// COMPOSITION
// ────────────────────────────────────────────────────────────────────────────

/** Embedded subordinate — exactly 1 value. */
export type CompositionOne<T> = readonly T[]

/** Embedded subordinate — 0 or 1 values. */
export type CompositionOptional<T> = readonly T[]

/** Embedded subordinate — 0 or more values. */
export type CompositionMany<T> = readonly T[]

/** Embedded subordinate — 1 or more values. */
export type CompositionPositive<T> = readonly T[]

/** Returns true if value is an array of exactly 1 element satisfying guard. */
export const isCompositionOne = <T>(
  value: unknown,
  guard: (v: unknown) => v is T,
): value is CompositionOne<T> =>
  Array.isArray(value) && value.length === 1 && guard(value[0])

/** Returns true if value is an array of 0 or 1 elements satisfying guard. */
export const isCompositionOptional = <T>(
  value: unknown,
  guard: (v: unknown) => v is T,
): value is CompositionOptional<T> =>
  Array.isArray(value) && value.length <= 1 && (value.length === 0 || guard(value[0]))

/** Returns true if value is an array where every element satisfies guard. */
export const isCompositionMany = <T>(
  value: unknown,
  guard: (v: unknown) => v is T,
): value is CompositionMany<T> =>
  Array.isArray(value) && value.every(guard)

/** Returns true if value is a non-empty array where every element satisfies guard. */
export const isCompositionPositive = <T>(
  value: unknown,
  guard: (v: unknown) => v is T,
): value is CompositionPositive<T> =>
  Array.isArray(value) && value.length >= 1 && value.every(guard)

/**
 * Extracts the single value from a CompositionOne.
 * Caller must pre-validate with isCompositionOne — no defensive check per Constitution §9.5.3.
 */
export const demandOne = <T>(c: CompositionOne<T>): T => c[0] as T

/** Extracts the value from a CompositionOptional, or undefined if empty. */
export const optionalOne = <T>(c: CompositionOptional<T>): T | undefined => c[0]

// ────────────────────────────────────────────────────────────────────────────
// ASSOCIATION
// ────────────────────────────────────────────────────────────────────────────

/**
 * Required FK reference to a type with an independent lifecycle.
 * Phantom type parameter T documents the referenced abstraction.
 * Resolves to Id at runtime.
 */
export type AssociationOne<_T> = Id

/**
 * Optional FK reference — nullable column.
 * Phantom type parameter T documents the referenced abstraction.
 * Resolves to Id | undefined at runtime.
 */
export type AssociationOptional<_T> = Id | undefined

/**
 * Junction FK — one Id in an m:m junction row; both sides of the junction declare this.
 * Phantom type parameter T documents the referenced abstraction.
 * Resolves to Id at runtime.
 */
export type AssociationJunction<_T> = Id
