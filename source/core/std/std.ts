/**
 * Core standard barrel.
 *
 * Single import surface for shared core primitives:
 * - ADT helpers (`Dictionary`, `StringDictionary`, `StringSet`)
 * - Identity/time (`Id`, `When`)
 * - Lifecycle (`Instantiable`, `instance`)
 * - Relation primitives (`Composition*`, `Association*`)
 * - Generic validators (`ValidatorError`, `notValid`, `is*`)
 */
export * from './adt.ts'
export * from './datetime.ts'
export * from './identifier.ts'
export * from './instance.ts'
export * from './relations.ts'
export * from './validators.ts'
