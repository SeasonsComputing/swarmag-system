/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Nominal type primitive                                                       ║
║ Phantom identity keyed by a producer's private symbol.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Names the nominal type idiom for primitive and object types. Each producer
declares its own private unique symbol; the brand emits no runtime property.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
NominalType  Base type carrying a producer-owned phantom brand.
*/

/** A base type distinguished by its producer's private symbol. */
export type NominalType<T, B extends symbol> = T & { readonly [K in B]: true }
