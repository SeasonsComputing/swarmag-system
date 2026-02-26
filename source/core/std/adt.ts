/**
 * Standard algebraic data type aliases and containers.
 */

/** String-keyed dictionary with configurable value type. */
export type Dictionary<V = unknown> = Record<string, V>

/** String-keyed dictionary where all values are strings. */
export type StringDictionary = Dictionary<string>

/** Set specialized for string membership collections. */
export class StringSet extends Set<string> {}
