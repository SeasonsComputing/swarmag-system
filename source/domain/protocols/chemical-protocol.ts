/**
 * Chemical domain protocols.
 */

import type { CreateFromInstantiable, UpdateFromInstantiable } from '@core-std'
import type { Chemical } from '@domain/abstractions/chemical.ts'

export type ChemicalCreate = CreateFromInstantiable<Chemical>
export type ChemicalUpdate = UpdateFromInstantiable<Chemical>
