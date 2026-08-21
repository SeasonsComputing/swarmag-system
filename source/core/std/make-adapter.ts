/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Adapter maker                                                                ║
║ Metadata-driven domain and storage serialization.                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Builds adapters that map domain abstraction keys to storage columns, including
nested delegate adapters for composed domain objects.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AdapterPatch<T>   Partial domain patch where null clears a stored column.
Adapter<T>        Domain serialization contract.
├ toDomain(source)       Deserialize storage dictionary to domain shape.
└ fromDomain(patch)      Serialize domain patch to storage dictionary.
AdaptDelegate     Column mapping with optional nested adapter delegate.
Adapt<T>          Metadata map from domain keys to storage columns.
makeAdapter(meta) Create an Adapter from metadata.
*/
import { Dictionary, isNullish } from './adt.ts'

/** Contract for domain serialization. Null on any attribute clears its column. */
export type AdapterPatch<T> = { [K in keyof T]?: T[K] | null } & Dictionary
export interface Adapter<T> {
  toDomain(source: Dictionary): T
  fromDomain(patch: AdapterPatch<T>): Dictionary
}

/**
 * Adapt a domain abstraction key to storage column. Storage column may have an Adapter for
 * nested domain abstractions.
 */
export type AdaptDelegate = [string, Adapter<unknown>?]
export type Adapt<T> = { [K in keyof T]: AdaptDelegate }

/** Maker for domain adapters. */
export function makeAdapter<T>(meta: Adapt<T>): Adapter<T> {
  const metadata = Object.entries(meta) as [string, AdaptDelegate][]
  return {
    /** Deserialize: Dictionary -> T */
    toDomain: (source: Dictionary): T => {
      const domain: Dictionary = {}
      for (const [key, adapt] of metadata) {
        const [col, delegate] = adapt
        const value = source[col]
        if (isNullish(value)) continue

        // dictionary -> domain
        if (delegate) {
          if (Array.isArray(value)) {
            domain[key] = value.map(item => delegate.toDomain(item))
          } else if (typeof value === 'object') {
            domain[key] = delegate.toDomain(value as Dictionary)
          }
        } else {
          domain[key] = source[col]
        }
      }
      return domain as T
    },

    /** Serialize: Patch<T> -> Dictionary. */
    fromDomain: (source: AdapterPatch<T>): Dictionary => {
      const target: Dictionary = {}
      for (const key of Object.keys(source)) {
        const adapt = meta[key as keyof T]
        if (!adapt) continue

        const [col, delegate] = adapt
        const value = source[key]
        if (value === undefined) continue

        // null clears the stored column; falsy values write through
        if (value === null) {
          target[col] = null
          continue
        }

        // domain -> dictionary
        if (delegate) {
          if (Array.isArray(value)) {
            target[col] = value.map(item => delegate.fromDomain(item))
          } else if (typeof value === 'object') {
            target[col] = delegate.fromDomain(value as AdapterPatch<unknown>)
          }
        } else {
          target[col] = value
        }
      }
      return target
    }
  }
}
