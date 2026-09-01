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
FieldAdapter<T>   Serialization adapter for one domain field.
AnyFieldAdapter<T>  Union of field adapters for a domain abstraction.
ScopedUpdateAdapter<T, K>  Serialization adapter for a declared field set.
Adapter<T>        Domain serialization contract.
├ toDomain(source)       Deserialize storage dictionary to domain shape.
└ fromDomain(patch)      Serialize domain patch to storage dictionary.
AdaptDelegate     Column mapping with optional nested adapter delegate.
Adapt<T>          Metadata map from domain keys to storage columns.
makeAdapter(meta) Create an Adapter from metadata.
makeScopedUpdate(fields)  Create a scoped update adapter from field adapters.
*/
import { Dictionary, isNullish } from './adt.ts'

/** Contract for domain serialization. Null on any attribute clears its column. */
export type AdapterPatch<T> = { [K in keyof T]?: T[K] | null } & Dictionary

/** Serialization adapter for one domain field. */
export type FieldAdapter<T, K extends keyof T> = {
  readonly key: K
  fromDomain(value: AdapterPatch<T>[K]): Dictionary
}

/** Union of field adapters for a domain abstraction. */
export type AnyFieldAdapter<T> = { [K in keyof T]-?: FieldAdapter<T, K> }[keyof T]

/** Serialization adapter for a declared field set. */
export interface ScopedUpdateAdapter<T, K extends keyof T> {
  fromDomain(patch: Pick<AdapterPatch<T>, K>): Dictionary
}

export type Adapter<T> = {
  toDomain(source: Dictionary): T
  fromDomain(patch: AdapterPatch<T>): Dictionary
} & { [K in keyof T]-?: FieldAdapter<T, K> }

/**
 * Adapt a domain abstraction key to storage column. Storage column may have an Adapter for
 * nested domain abstractions.
 */
export type AdaptDelegate = [string, Adapter<unknown>?]
export type Adapt<T> = { [K in keyof T]: AdaptDelegate }

/** Maker for domain adapters. */
export function makeAdapter<T>(meta: Adapt<T>): Adapter<T> {
  const metadata = Object.entries(meta) as [string, AdaptDelegate][]
  const adapter = {
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
        Object.assign(target, fieldRecord(col, delegate, source[key]))
      }
      return target
    }
  }

  for (const [key, adapt] of metadata) {
    const [col, delegate] = adapt
    Object.assign(adapter, {
      [key]: {
        key,
        fromDomain: (value: AdapterPatch<T>[keyof T]): Dictionary => fieldRecord(col, delegate, value)
      }
    })
  }

  return adapter as Adapter<T>
}

/** Maker for scoped update adapters. */
export function makeScopedUpdate<T, K extends keyof T>(
  fields: readonly FieldAdapter<T, K>[]
): ScopedUpdateAdapter<T, K> {
  return {
    fromDomain: (patch: Pick<AdapterPatch<T>, K>): Dictionary => {
      const record: Dictionary = {}
      for (const field of fields) {
        if (!(field.key in patch)) continue
        Object.assign(record, field.fromDomain(patch[field.key]))
      }
      return record
    }
  }
}

const fieldRecord = (
  col: string,
  delegate: Adapter<unknown> | undefined,
  value: unknown
): Dictionary => {
  const target: Dictionary = {}
  if (value === undefined) return target

  if (value === null) {
    target[col] = null
    return target
  }

  if (delegate) {
    if (Array.isArray(value)) {
      target[col] = value.map(item => delegate.fromDomain(item))
    } else if (typeof value === 'object') {
      target[col] = delegate.fromDomain(value as AdapterPatch<unknown>)
    }
    return target
  }

  target[col] = value
  return target
}
