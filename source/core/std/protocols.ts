/**
 * Provides reusable contracts for creating and updating Instantiable instances.
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
