/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Form scope maker                                                             ║
║ Declared draft fields and create/update projections for one form.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Derives a domain-shaped draft from adapter fields. Create supplies declared
out-of-scope defaults; update clears absent in-scope values. Both projections
select draft fields. Adapted declarations add scoped translation for updates.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FormDraft<T, K>         Domain-shaped attributes owned by one form.
FormScope<T, K>         Create/update projections for the form.
AdaptedFormScope<T, K>  Form projections with a scoped adapter.
DraftOf<Scope>          Draft inferred from a scope declaration.
makeFormScope           Declare fields and disjoint create defaults.
makeAdaptedFormScope    Declare a form with scoped adapter translation.
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

/** Create/update projections for one declared form. */
export type FormScope<T extends Instantiable, K extends keyof FromInstantiable<T>> = {
  toCreate: (draft: FormDraft<T, K>) => CreateFromInstantiable<T>
  toUpdate: (id: Id, draft: FormDraft<T, K>) => ScopedUpdate<T, K>
}

/** Form projections with a scoped adapter for client-side translation. */
export type AdaptedFormScope<T extends Instantiable, K extends keyof FromInstantiable<T>> =
  & FormScope<T, K>
  & { adapter: ScopedUpdateAdapter<T, K> }

/** Draft inferred from a form-scope declaration. */
export type DraftOf<Scope> = Scope extends { toCreate: (draft: infer Draft) => unknown } ? Draft : never

/**
 * Declare a form's fields and disjoint create defaults.
 * @param spec Adapter fields and defaults for the remaining create attributes.
 * @returns Field-selected create/update projections.
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
 * Declare a form's fields, disjoint create defaults, and scoped translation.
 * @param spec Adapter fields and defaults for the remaining create attributes.
 * @returns Form projections and the scoped adapter for translated updates.
 */
export function makeAdaptedFormScope<
  T extends Instantiable,
  K extends keyof FromInstantiable<T>,
  Defaults extends Omit<CreateFromInstantiable<T>, K>
>(spec: {
  fields: readonly FieldAdapter<T, K>[]
  defaults: {
    [P in keyof Defaults]: P extends keyof Omit<CreateFromInstantiable<T>, K> ? Defaults[P] : never
  }
}): AdaptedFormScope<T, K> {
  return {
    ...makeFormScope<T, K, Defaults>(spec),
    adapter: makeScopedUpdate<T, K>(spec.fields)
  }
}
