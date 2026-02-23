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

/**
 * Create an Instantiable conforming instance
 * Allow's id to be overridden; lifecycle state always reset
 */
export const instance = <T extends Instantiable>(state: Partial<T> = {}): T => {
  const { deletedAt: _, ...rest } = state
  const now = when()
  return { id: id(), ...rest, createdAt: now, updatedAt: now } as T
}
