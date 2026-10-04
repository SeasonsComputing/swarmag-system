/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Scope maker                                                                  ║
║ Declared attributes and create/update projections for one scope.             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Derives a domain-shaped draft from adapter fields. Create supplies declared
out-of-scope defaults; update clears absent in-scope values. Both projections
select draft fields. Adapted declarations add scoped translation for updates.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ScopeDraft<T, K>    Domain-shaped attributes owned by one scope.
Scope<T, K>         Create/update projections for the scope.
AdaptedScope<T, K>  Scope projections with a scoped adapter.
DraftOf<S>          Draft inferred from a scope declaration.
makeScope           Declare fields and disjoint create defaults.
makeAdaptedScope    Declare a scope with scoped adapter translation.
*/

import type { Dictionary } from './adt.ts'
import type { Id } from './identifier.ts'
import type { FromInstantiable, Instantiable } from './instance.ts'
import { makeScopedUpdate } from './make-adapter.ts'
import type { FieldAdapter, ScopedUpdateAdapter } from './make-adapter.ts'
import type { CreateFromInstantiable, ScopedUpdate } from './protocols.ts'

/** Domain-shaped attributes owned by one scope, preserving optionality. */
export type ScopeDraft<T extends Instantiable, K extends keyof FromInstantiable<T>> = Pick<
  FromInstantiable<T>,
  K
>

/** Create/update projections for one declared scope. */
export type Scope<T extends Instantiable, K extends keyof FromInstantiable<T>> = {
  toCreate: (draft: ScopeDraft<T, K>) => CreateFromInstantiable<T>
  toUpdate: (id: Id, draft: ScopeDraft<T, K>) => ScopedUpdate<T, K>
}

/** Scope projections with a scoped adapter for client-side translation. */
export type AdaptedScope<T extends Instantiable, K extends keyof FromInstantiable<T>> =
  & Scope<T, K>
  & { adapter: ScopedUpdateAdapter<T, K> }

/** Draft inferred from a scope declaration. */
export type DraftOf<S> = S extends { toCreate: (draft: infer Draft) => unknown } ? Draft : never

/**
 * Declare a scope's fields and disjoint create defaults.
 * @param spec Adapter fields and defaults for the remaining create attributes.
 * @returns Field-selected create/update projections.
 */
export function makeScope<
  T extends Instantiable,
  K extends keyof FromInstantiable<T>,
  Defaults extends Omit<CreateFromInstantiable<T>, K>
>(spec: {
  fields: readonly FieldAdapter<T, K>[]
  defaults: {
    [P in keyof Defaults]: P extends keyof Omit<CreateFromInstantiable<T>, K> ? Defaults[P] : never
  }
}): Scope<T, K> {
  return {
    toCreate: draft => {
      const source: Dictionary = { ...spec.defaults }
      for (const field of spec.fields) source[field.key as string] = draft[field.key]
      return source as CreateFromInstantiable<T>
    },
    toUpdate: (id, draft) => {
      const source: Dictionary = { id }
      for (const field of spec.fields) source[field.key as string] = draft[field.key] ?? null
      return source as ScopedUpdate<T, K>
    }
  }
}

/**
 * Declare a scope's fields, disjoint create defaults, and scoped translation.
 * @param spec Adapter fields and defaults for the remaining create attributes.
 * @returns Scope projections and the scoped adapter for translated updates.
 */
export function makeAdaptedScope<
  T extends Instantiable,
  K extends keyof FromInstantiable<T>,
  Defaults extends Omit<CreateFromInstantiable<T>, K>
>(spec: {
  fields: readonly FieldAdapter<T, K>[]
  defaults: {
    [P in keyof Defaults]: P extends keyof Omit<CreateFromInstantiable<T>, K> ? Defaults[P] : never
  }
}): AdaptedScope<T, K> {
  return {
    ...makeScope<T, K, Defaults>(spec),
    adapter: makeScopedUpdate<T, K>(spec.fields)
  }
}
