/**
 * Standard algebraic data type aliases and containers.
 */

/** String-keyed dictionary with configurable value type. */
export type Dictionary<V = unknown> = Record<string, V>

/** String-keyed dictionary where all values are strings. */
export type StringDictionary = Dictionary<string>

/** Set specialized for string membership collections. */
export class StringSet extends Set<string> {}

/** Check whether value is undefined or null. */
export const isNullish = (value: unknown): value is undefined | null =>
  value === undefined || value === null

/** Compute a djb2 fingerprint of a string. */
export const djb2hash = (str: string): string => {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash & hash
  }
  return hash.toString(36)
}
