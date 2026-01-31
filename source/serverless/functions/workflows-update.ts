/**
 * Netlify handler for updating workflows.
 */

import type { Workflow } from '@domain/abstractions/workflow.ts'
import { validateWorkflowUpdate, type WorkflowUpdateInput } from '@domain/validators/workflow-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToWorkflow, workflowToRow } from '@serverless-mappings/workflows-mapping.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/workflows/update' }

/**
 * Update an existing workflow while enforcing allowed fields and validation.
 * @param req - API request wrapper containing the update payload.
 * @returns API result with the updated workflow or an error response.
 */
const handle = async (
  req: ApiRequest<WorkflowUpdateInput>
): Promise<ApiResponse> => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateWorkflowUpdate(req.body)
  if (validationError) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: validationError } }
  }

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', req.body.id)
    .single()

  if (fetchError || !existingRow) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Workflow not found' } }
  }

  let current: Workflow
  try {
    current = rowToWorkflow(existingRow)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid workflow record returned from Supabase', details: (parseError as Error).message }
    }
  }

  const now = when()
  const stepsChanged = req.body.steps !== undefined

  const updated: Workflow = {
    ...current,
    name: req.body.name?.trim() ?? current.name,
    description: req.body.description === null ? undefined : req.body.description?.trim() ?? current.description,
    steps: req.body.steps ?? current.steps,
    version: stepsChanged ? current.version + 1 : current.version,
    effectiveFrom: stepsChanged ? now : current.effectiveFrom,
    updatedAt: now
  }

  const { error: updateError } = await supabase
    .from('workflows')
    .update(workflowToRow(updated))
    .eq('id', updated.id)

  if (updateError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to update workflow', details: updateError.message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: updated } }
}

export default createApiHandler(handle)
