/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Abstraction manager                                                          ║
║ Domain-record specialization of the Collection-Detail manager.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Keeps the domain-record manager API stable over Manager.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AbstractionManagerProps  Props for a domain-record manager; extends ManagerProps.
AbstractionManager       Collection-Detail manager for domain records.
*/

import type { Instantiable } from '@core/std'
import type { UiComponent } from '@ux/ui'
import { Manager } from './manager.tsx'
import type { ManagerProps } from './manager.tsx'

/** Props for the domain-record specialization of Manager. */
export type AbstractionManagerProps<T extends Instantiable, Draft> = ManagerProps<T, Draft>

/** Collection-Detail manager for domain records. */
export const AbstractionManager = <T extends Instantiable, Draft>(
  props: AbstractionManagerProps<T, Draft>
): UiComponent => <Manager {...props} />
