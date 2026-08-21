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
  & Clearable<FromInstantiable<T>>

/** Patch shape where optional attributes additionally admit null as a clear marker. */
type Clearable<T> = {
  [K in keyof T]?: undefined extends T[K] ? T[K] | null : T[K]
}

/** Contract to create an InstantiableOnly. */
export type CreateFromInstantiableOnly<T extends InstantiableOnly> = FromInstantiableOnly<T>
