/**
 * Specification and factory for Instances.
 */

import { type When, when } from './datetime.ts'
import { type Id, id } from './identifier.ts'

/** Type instance specifications. */
export type Instance = { id: Id }
export type InstantiableOnly = Instance & { createdAt: When }
export type Instantiable = InstantiableOnly & { updatedAt: When; deletedAt?: When }

/** Types with Instance specifications removed.  */
export type FromInstance<T extends Instance> = Omit<T, keyof Instance>
export type FromInstantiableOnly<T extends InstantiableOnly> = Omit<T, keyof InstantiableOnly>
export type FromInstantiable<T extends Instantiable> = Omit<T, keyof Instantiable>

/** Instance factory. */
export const instance = <T extends Instance>(
  state: FromInstance<T>
): T => ({ id: id(), ...state } as T)

/** InstantiableOnly factory. */
export const instantiableOnly = <T extends InstantiableOnly>(
  state: FromInstantiableOnly<T>
): T => ({ id: id(), ...state, createdAt: when() } as T)

/** Instantiable factory. */
export const instantiable = <T extends Instantiable>(
  state: FromInstantiable<T>
): T => {
  const now = when()
  return { id: id(), ...state, createdAt: now, updatedAt: now } as T
}
