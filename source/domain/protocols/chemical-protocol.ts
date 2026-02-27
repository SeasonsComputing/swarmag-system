/**
 * Protocol input shapes for Chemical boundary operations.
 */

import type {
  CreateFromInstantiable,
  UpdateFromInstantiable
} from '@core-std'
import type { Chemical } from '@domain/abstractions/chemical.ts'

/** Input for creating a Chemical. */
export type ChemicalCreate = CreateFromInstantiable<Chemical>

/** Input for updating a Chemical. */
export type ChemicalUpdate = UpdateFromInstantiable<Chemical>
