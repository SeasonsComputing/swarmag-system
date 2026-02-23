/**
 * Adapters for converting between Dictionary and Workflow domain abstractions.
 */

import type { Dictionary } from '@core-std'
import { notValid } from '@core-std'
import type { Workflow } from '@domain/abstractions/workflow.ts'

/** Convert a Dictionary to a Workflow domain object. */
export const toWorkflow = (dict: Dictionary): Workflow => {
  if (!dict['id']) notValid('Workflow dictionary missing required field: id')
  if (!dict['name']) notValid('Workflow dictionary missing required field: name')
  if (dict['version'] === undefined || dict['version'] === null) {
    notValid('Workflow dictionary missing required field: version')
  }
  if (!dict['created_at']) notValid('Workflow dictionary missing required field: created_at')
  if (!dict['updated_at']) notValid('Workflow dictionary missing required field: updated_at')

  return {
    id: dict['id'] as string,
    name: dict['name'] as string,
    description: dict['description'] as string | undefined,
    version: dict['version'] as number,
    tags: (dict['tags'] ?? []) as Workflow['tags'],
    tasks: (dict['tasks'] ?? []) as Workflow['tasks'],
    createdAt: dict['created_at'] as string,
    updatedAt: dict['updated_at'] as string,
    deletedAt: dict['deleted_at'] as string | undefined
  }
}

/** Convert a Workflow domain object to a Dictionary. */
export const fromWorkflow = (workflow: Workflow): Dictionary => ({
  id: workflow.id,
  name: workflow.name,
  description: workflow.description,
  version: workflow.version,
  tags: workflow.tags,
  tasks: workflow.tasks,
  created_at: workflow.createdAt,
  updated_at: workflow.updatedAt,
  deleted_at: workflow.deletedAt
})
