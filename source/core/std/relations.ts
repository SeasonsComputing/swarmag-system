/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Relation primitives                                                          ║
║ Composition and association shapes with cardinality guards.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines canonical relationship primitives for embedded compositions and foreign
key associations, plus guards and accessors for composition cardinality.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CompositionOne<T>               Embedded subordinate with exactly one value.
CompositionOptional<T>          Embedded subordinate with zero or one values.
CompositionMany<T>              Embedded subordinate with zero or more values.
CompositionPositive<T>          Embedded subordinate with one or more values.
isCompositionOne(value, guard)  Check exactly-one composition cardinality.
isCompositionOptional(...)      Check optional composition cardinality.
isCompositionMany(value, guard) Check many composition cardinality.
isCompositionPositive(...)      Check positive composition cardinality.
demandOne(c)                    Extract the value from a CompositionOne.
optionalOne(c)                  Extract value from a CompositionOptional.
AssociationOne<T>               Required FK reference to a lifecycle row.
AssociationOptional<T>          Optional FK reference to a lifecycle row.
AssociationJunction<T>          Junction FK reference in an m:m row.
*/

import type { Id } from './identifier.ts'

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
  guard: (v: unknown) => v is T
): value is CompositionOne<T> => Array.isArray(value) && value.length === 1 && guard(value[0])

/** Returns true if value is an array of 0 or 1 elements satisfying guard. */
export const isCompositionOptional = <T>(
  value: unknown,
  guard: (v: unknown) => v is T
): value is CompositionOptional<T> =>
  Array.isArray(value) && value.length <= 1 && (value.length === 0 || guard(value[0]))

/** Returns true if value is an array where every element satisfies guard. */
export const isCompositionMany = <T>(
  value: unknown,
  guard: (v: unknown) => v is T
): value is CompositionMany<T> => Array.isArray(value) && value.every(guard)

/** Returns true if value is a non-empty array where every element satisfies guard. */
export const isCompositionPositive = <T>(
  value: unknown,
  guard: (v: unknown) => v is T
): value is CompositionPositive<T> => Array.isArray(value) && value.length >= 1 && value.every(guard)

/**
 * Extracts the single value from a CompositionOne.
 * Caller must pre-validate with isCompositionOne — no gratutious defensive check per governance.
 */
export const demandOne = <T>(c: CompositionOne<T>): T => c[0] as T

/** Extracts the value from a CompositionOptional, or undefined if empty. */
export const optionalOne = <T>(c: CompositionOptional<T>): T | undefined => c[0]

// ────────────────────────────────────────────────────────────────────────────
// ASSOCIATION
// ────────────────────────────────────────────────────────────────────────────

/**
 * Required FK reference to a type with an independent life-cycle.
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
