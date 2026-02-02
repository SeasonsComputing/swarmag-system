/**
 * Netlify handler for deleting workflows.
 */

import { isNonEmptyString } from '@domain/validators/helper-validators.ts'
import {
  type ApiRequest,
  type ApiResponse,
  HttpCodes,
  toInternalError,
  toMethodNotAllowed,
  toNotFound,
  toUnprocessable
} from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/workflows/delete' }

/**
 * Delete a workflow by id (hard delete).
 * @param req - API request wrapper containing the workflow id to delete.
 * @returns API result with deletion metadata or an error response.
 */
const handle = async (req: ApiRequest<{ id?: string }>): Promise<ApiResponse> => {
  if (req.method !== 'DELETE') return toMethodNotAllowed()

  const workflowId = req.body?.id
  if (!isNonEmptyString(workflowId)) return toUnprocessable('id is required')

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase.from('workflows').select(
    'id'
  ).eq('id', workflowId).single()

  if (fetchError || !existingRow) return toNotFound('Workflow not found')

  const { error: deleteError } = await supabase.from('workflows').delete().eq('id', workflowId)

  if (deleteError) return toInternalError('Failed to delete workflow', deleteError)

  return { statusCode: HttpCodes.ok, body: { data: { id: workflowId, deletedAt: when() } } }
}

export default createApiHandler(handle)
