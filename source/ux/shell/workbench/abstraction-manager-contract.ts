/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Abstraction manager contract                                                 ║
║ Domain-record specializations of the Manager provider types.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Preserves the provider API for managers of domain records.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AbstractionActionConfirmation  Confirmation copy for a consequential action.
AbstractionAction              A named action on a domain record.
AbstractionListColumn          One labelled, aligned column and its item content.
AbstractionDetail              Steps and aggregate draft for one opened record.
AbstractionManagerContract     Provider contract for domain-record managers.
*/

import type { Instantiable } from '@core/std'
import type {
  ManagerAction,
  ManagerActionConfirmation,
  ManagerContract,
  ManagerDetail,
  ManagerListColumn
} from './manager-contract.ts'

/** Confirmation copy for a consequential domain-record action. */
export type AbstractionActionConfirmation<T extends Instantiable> = ManagerActionConfirmation<T>

/** A named action executable on a domain record. */
export type AbstractionAction<T extends Instantiable> = ManagerAction<T>

/** Steps and aggregate draft for one opened record. */
export type AbstractionDetail<Draft> = ManagerDetail<Draft>

/** One labelled, aligned list column and its record content. */
export type AbstractionListColumn<T extends Instantiable> = ManagerListColumn<T>

/** Provider contract for the domain-record specialization of Manager. */
export type AbstractionManagerContract<T extends Instantiable, Draft> = ManagerContract<T, Draft>
