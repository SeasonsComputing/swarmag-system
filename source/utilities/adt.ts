/**
 * Generic dictionary type for objects with dynamic keys.
 *
 * Provides a type-safe alternative to plain object indexing.
 * Use this type for objects where keys are dynamic or the value types are
 * heterogeneous. Prefer narrower types when the structure is known.
 */

/**
 * Abstract data types.
 */
export type Dictionary = Record<string, unknown>
export class StringSet extends Set<string> {}
