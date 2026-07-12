/**
 * Use metadata of domain keys to storage columns to make adapters.
 * Supports recursive decomposition for Compositions and Instantiables.
 * Patch semantics: an absent/undefined key leaves its column untouched,
 * null clears the column, and any defined value — including falsy — is
 * written. Storage NULL maps to domain absence.
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
