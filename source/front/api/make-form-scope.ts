/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Form scope maker                                                             ║
║ Declared draft fields and create/update projections for one form.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Derives a domain-shaped draft from adapter fields. Create supplies declared
out-of-scope defaults; update clears absent in-scope values. Both projections
select draft fields, and the existing scoped adapter translates updates.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FormDraft<T, K>  Domain-shaped attributes owned by one form.
FormScope<T, K>  Adapter and create/update projections for the form.
DraftOf<Scope>  Draft inferred from a scope declaration.
makeFormScope   Declare fields and disjoint create defaults.
*/

import type {
  CreateFromInstantiable,
  Dictionary,
  FromInstantiable,
  Id,
  Instantiable,
  ScopedUpdate
} from '@core/std'
import { makeScopedUpdate } from '@core/stdx'
import type { FieldAdapter, ScopedUpdateAdapter } from '@core/stdx'

/** Domain-shaped attributes owned by one form, preserving optionality. */
export type FormDraft<T extends Instantiable, K extends keyof FromInstantiable<T>> = Pick<
  FromInstantiable<T>,
  K
>

/** Adapter and create/update projections for one declared form. */
export type FormScope<T extends Instantiable, K extends keyof FromInstantiable<T>> = {
  adapter: ScopedUpdateAdapter<T, K>
  toCreate: (draft: FormDraft<T, K>) => CreateFromInstantiable<T>
  toUpdate: (id: Id, draft: FormDraft<T, K>) => ScopedUpdate<T, K>
}

/** Draft inferred from a form-scope declaration. */
export type DraftOf<Scope> = Scope extends { toCreate: (draft: infer Draft) => unknown } ? Draft : never

/**
 * Declare a form's fields and disjoint create defaults.
 * @param spec Adapter fields and defaults for the remaining create attributes.
 * @returns The scoped adapter and field-selected create/update projections.
 */
export function makeFormScope<
  T extends Instantiable,
  K extends keyof FromInstantiable<T>,
  Defaults extends Omit<CreateFromInstantiable<T>, K>
>(spec: {
  fields: readonly FieldAdapter<T, K>[]
  defaults: {
    [P in keyof Defaults]: P extends keyof Omit<CreateFromInstantiable<T>, K> ? Defaults[P] : never
  }
}): FormScope<T, K> {
  return {
    adapter: makeScopedUpdate<T, K>(spec.fields),
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
