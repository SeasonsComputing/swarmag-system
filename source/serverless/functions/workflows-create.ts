/**
 * Netlify handler for creating workflows.
 */

import type { Workflow } from '@domain/abstractions/workflow.ts'
import {
  validateWorkflowCreate,
  type WorkflowCreateInput
} from '@domain/validators/workflow-validators.ts'
import {
  type ApiRequest,
  type ApiResponse,
  toCreated,
  toInternalError,
  toMethodNotAllowed,
  toUnprocessable
} from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { workflowToRow } from '@serverless-mappings/workflows-mapping.ts'
import { id, when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/workflows/create' }

/**
 * Create a new workflow record when the request payload is valid.
 * @param req - Netlify-friendly API request wrapper containing the body.
 * @returns API result with created workflow or an error response.
 */
const handle = async (req: ApiRequest<WorkflowCreateInput>): Promise<ApiResponse> => {
  if (req.method !== 'POST') return toMethodNotAllowed()

  const validationError = validateWorkflowCreate(req.body)
  if (validationError) return toUnprocessable(validationError)

  const now = when()
  const workflow: Workflow = {
    id: id(),
    serviceId: req.body.serviceId,
    name: req.body.name.trim(),
    description: req.body.description?.trim(),
    version: 1,
    effectiveFrom: now,
    steps: req.body.steps,
    locationsRequired: undefined,
    createdAt: now,
    updatedAt: now
  }

  const { error } = await Supabase.client().from('workflows').insert(workflowToRow(workflow))

  if (error) return toInternalError('Failed to create workflow', error)

  return toCreated(workflow)
}

export default createApiHandler(handle)
