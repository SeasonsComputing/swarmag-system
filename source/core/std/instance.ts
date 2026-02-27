/**
 * Specification and factory for Instances
 * Instances are cryptographically-unique-identified and life-cycle aware objects
 */

import { type When, when } from './datetime.ts'
import { type Id, id } from './identifier.ts'

/** Instance type specification */
export type Instantiable = {
  id: Id
  createdAt: When
  updatedAt: When
  deletedAt?: When
}

/** Create shape for an Instantiable by excluding lifecycle-managed fields. */
export type CreateFromInstantiable<T extends Instantiable> = Omit<T, keyof Instantiable>

/** Update shape for an Instantiable: required id plus partial create fields. */
export type UpdateFromInstantiable<T extends Instantiable> =
  & Pick<T, 'id'>
  & Partial<CreateFromInstantiable<T>>

  /**
   * Create an Instantiable conforming instance
   * Allow's id to be overridden; lifecycle state always reset
   */
  export const instance = <T extends Instantiable>(state: Partial<T> = {}): T => {
    const { deletedAt: _, ...rest } = state
    const now = when()
    return { id: id(), ...rest, createdAt: now, updatedAt: now } as T
  }
