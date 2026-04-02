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

/** Contract to update an Instantiable. */
export type UpdateFromInstantiable<T extends Instantiable> =
  & Pick<T, 'id'>
  & Partial<FromInstantiable<T>>

/** Contract to create an InstantiableOnly. */
export type CreateFromInstantiableOnly<T extends InstantiableOnly> = FromInstantiableOnly<T>
