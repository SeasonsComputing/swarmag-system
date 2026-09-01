/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Mutation protocol primitives                                                 ║
║ Create and update payload shapes derived from lifecycle abstractions.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides reusable protocol shapes for creating and updating Instantiable and
InstantiableOnly abstractions at system boundaries.

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
export type CreateFromInstantiable<T extends Instantiable> = FromInstantiable<T>

/** Contract to update an Instantiable. Optional attributes admit null to clear the stored value. */
export type UpdateFromInstantiable<T extends Instantiable> =
  & Pick<T, 'id'>
  & {
    [K in keyof FromInstantiable<T>]?: undefined extends FromInstantiable<T>[K]
      ? FromInstantiable<T>[K] | null
      : FromInstantiable<T>[K]
  }

/**
 * Contract to update declared fields of an Instantiable.
 * Fields inside the declared scope are required.
 */
export type ScopedUpdate<T extends Instantiable, K extends keyof FromInstantiable<T>> =
  & Pick<T, 'id'>
  & {
    [P in K]-?: OptionalKey<FromInstantiable<T>, P> extends true
      ? FromInstantiable<T>[P] | null | undefined
      : FromInstantiable<T>[P]
  }

type OptionalKey<T, K extends keyof T> = Record<string, never> extends Pick<T, K> ? true : false

/** Contract to create an InstantiableOnly. */
export type CreateFromInstantiableOnly<T extends InstantiableOnly> = FromInstantiableOnly<T>
