/**
 * Netlify handler for deleting jobs.
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
export const config = { path: '/api/jobs/delete' }

/**
 * Delete a job by id (hard delete).
 * @param req - API request wrapper containing the job id to delete.
 * @returns API result with deletion metadata or an error response.
 */
const handle = async (req: ApiRequest<{ id?: string }>): Promise<ApiResponse> => {
  if (req.method !== 'DELETE') return toMethodNotAllowed()

  const jobId = req.body?.id
  if (!isNonEmptyString(jobId)) return toUnprocessable('id is required')

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase.from('jobs').select('id').eq('id', jobId).single()

  if (fetchError || !existingRow) return toNotFound('Job not found')

  const { error: deleteError } = await supabase.from('jobs').delete().eq('id', jobId)

  if (deleteError) return toInternalError('Failed to delete job', deleteError)

  return { statusCode: HttpCodes.ok, body: { data: { id: jobId, deletedAt: when() } } }
}

export default createApiHandler(handle)
