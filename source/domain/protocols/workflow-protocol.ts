/**
 * Protocol input shapes for Workflow boundary operations.
 */

import type { CreateFromInstantiable } from '@core-std'
import type { Workflow } from '@domain/abstractions/workflow.ts'

/** Input for creating a Workflow. */
export type WorkflowCreate = CreateFromInstantiable<Workflow>
