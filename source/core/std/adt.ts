/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Algebraic data primitives                                                    ║
║ Shared dictionary, string-set, and fingerprint utilities.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides foundational data containers and low-level utilities consumed across
the system through the core standard import surface.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Dictionary<V>        String-keyed dictionary with configurable value type.
isDictionary(value)  Check whether value is a plain or null-prototype object.
StringDictionary     String-keyed dictionary where all values are strings.
StringSet            Set specialized for string membership collections.
djb2hash(str)        Compute a djb2 fingerprint of a string.
*/

/** String-keyed dictionary with configurable value type. */
export type Dictionary<V = unknown> = Record<string, V>

/** Check whether value is a dictionary: a plain or null-prototype object. */
export const isDictionary = (value: unknown): value is Dictionary => {
  if (value === null || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** String-keyed dictionary where all values are strings. */
export type StringDictionary = Dictionary<string>

/** Set specialized for string membership collections. */
export class StringSet extends Set<string> {}

/** Compute a djb2 fingerprint of a string. */
export const djb2hash = (str: string): string => {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash & hash
  }
  return hash.toString(36)
}
