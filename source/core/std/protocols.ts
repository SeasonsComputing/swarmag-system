/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Mutation protocol primitives                                                 ║
║ Create and update payload shapes derived from lifecycle abstractions.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides reusable protocol shapes for creating and updating Instantiable and
InstantiableOnly abstractions at system boundaries.
Protocol derivation preserves each constituent of a union.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CreateFromInstantiable<T>      Create payload for an Instantiable abstraction.
UpdateFromInstantiable<T>      Update payload with id and clearable attributes.
ScopedUpdate<T, K>             Update payload restricted to declared fields.
CreateFromInstantiableOnly<T>  Create payload for InstantiableOnly abstraction.
*/

import type {
  FromInstantiable,
  FromInstantiableOnly,
  Instantiable,
  InstantiableOnly
} from './instance.ts'

/** Contract to create an Instantiable. */
export type CreateFromInstantiable<T extends Instantiable> = T extends unknown ? FromInstantiable<T>
  : never

/** Contract to update an Instantiable. Optional attributes admit null to clear the stored value. */
export type UpdateFromInstantiable<T extends Instantiable> = T extends unknown ?
    & Pick<T, 'id'>
    & {
      [K in keyof FromInstantiable<T>]?: undefined extends FromInstantiable<T>[K]
        ? FromInstantiable<T>[K] | null
        : FromInstantiable<T>[K]
    }
  : never

/**
 * Contract to update declared fields of an Instantiable.
 * Fields inside the declared scope are required; values admitting undefined also admit null.
 * Union scopes select common fields; a constituent supplies its variant-specific fields.
 */
export type ScopedUpdate<T extends Instantiable, K extends keyof FromInstantiable<T>> = T extends unknown
  ?
    & Pick<T, 'id'>
    & {
      [P in K]-?: undefined extends FromInstantiable<T>[P] ? FromInstantiable<T>[P] | null
        : FromInstantiable<T>[P]
    }
  : never

/** Contract to create an InstantiableOnly. */
export type CreateFromInstantiableOnly<T extends InstantiableOnly> = T extends unknown
  ? FromInstantiableOnly<T>
  : never
