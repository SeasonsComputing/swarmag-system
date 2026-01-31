/**
 * Netlify handler for fetching a workflow by id.
 */

import type { Workflow } from '@domain/abstractions/workflow.ts'
import { isNonEmptyString } from '@domain/validators/common-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToWorkflow } from '@serverless-mappings/workflows-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/workflows/get' }

/**
 * Fetch a workflow by id when provided via query string.
 * @param req - API request wrapper containing query parameters.
 * @returns API result with the workflow payload or an error response.
 */
const handle = async (
  req: ApiRequest<undefined, { id?: string }>
): Promise<ApiResponse> => {
  if (req.method !== 'GET') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const workflowId = req.query?.id
  if (!isNonEmptyString(workflowId)) {
    return { statusCode: HttpCodes.badRequest, body: { error: 'id is required' } }
  }

  const { data, error } = await Supabase.client()
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single()

  if (error || !data) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Workflow not found' } }
  }

  let workflow: Workflow
  try {
    workflow = rowToWorkflow(data)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid workflow record returned from Supabase', details: (parseError as Error).message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: workflow } }
}

export default createApiHandler(handle)
