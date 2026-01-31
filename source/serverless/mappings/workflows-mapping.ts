/**
 * Mappers for converting between Supabase workflow rows and domain Workflows.
 */

import type { Workflow } from '@domain/abstractions/workflow.ts'
import type { Dictionary } from '@utils'

/** Map a domain Workflow into a Supabase row shape. */
export const workflowToRow = (workflow: Workflow) => ({
  id: workflow.id,
  service_id: workflow.serviceId,
  name: workflow.name,
  description: workflow.description ?? null,
  version: workflow.version,
  effective_from: workflow.effectiveFrom,
  steps: workflow.steps,
  locations_required: workflow.locationsRequired ?? null,
  created_at: workflow.createdAt,
  updated_at: workflow.updatedAt,
  payload: workflow
})

/**
 * Convert a Supabase row into a Workflow domain model.
 * Payload is truth - if present, use it directly.
 * Falls back to column mapping for legacy records.
 * @param row - The database row to convert.
 * @returns The mapped Workflow object.
 * @throws Error if required fields are missing.
 */
export const rowToWorkflow = (row: unknown): Workflow => {
  if (!row || typeof row !== 'object') {
    throw new Error('Workflow row is missing required fields')
  }

  const record = row as Dictionary

  // Payload as truth - direct cast if present
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Dictionary
    if (
      typeof payload.id === 'string'
      && typeof payload.serviceId === 'string'
      && typeof payload.name === 'string'
      && typeof payload.version === 'number'
      && typeof payload.effectiveFrom === 'string'
      && Array.isArray(payload.steps)
    ) {
      return payload as unknown as Workflow
    }
  }

  // Legacy fallback - map from columns
  const id = record.id as string
  const serviceId = (record.service_id ?? record.serviceId) as string
  const name = record.name as string
  const version = record.version as number
  const effectiveFrom = (record.effective_from ?? record.effectiveFrom) as string
  const steps = record.steps

  if (
    !id
    || !serviceId
    || !name
    || typeof version !== 'number'
    || !effectiveFrom
    || !Array.isArray(steps)
  ) {
    throw new Error('Workflow row is missing required fields')
  }

  return {
    id,
    serviceId,
    name,
    description: (record.description ?? undefined) as string | undefined,
    version,
    effectiveFrom,
    steps,
    locationsRequired: Array.isArray(record.locations_required ?? record.locationsRequired)
      ? (record.locations_required ?? record.locationsRequired) as Workflow['locationsRequired']
      : undefined,
    createdAt: (record.created_at ?? record.createdAt) as string,
    updatedAt: (record.updated_at ?? record.updatedAt) as string
  }
}
