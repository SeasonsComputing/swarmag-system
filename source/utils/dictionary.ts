/**
 * Generic dictionary type for objects with dynamic keys.
 *
 * Provides a type-safe alternative to plain object indexing.
 * Use this type for objects where keys are dynamic or the value types are
 * heterogeneous. Prefer narrower types when the structure is known.
 */

/**
 * A generic object type with string keys and unknown values.
 */
export type Dictionary = Record<string, unknown>
