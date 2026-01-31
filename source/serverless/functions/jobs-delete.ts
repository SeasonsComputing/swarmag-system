/**
 * Netlify handler for deleting jobs.
 */

import { isNonEmptyString } from '@domain/validators/common-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
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
const handle = async (
  req: ApiRequest<{ id?: string }>
): Promise<ApiResponse> => {
  if (req.method !== 'DELETE') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const jobId = req.body?.id
  if (!isNonEmptyString(jobId)) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: 'id is required' } }
  }

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', jobId)
    .single()

  if (fetchError || !existingRow) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Job not found' } }
  }

  const { error: deleteError } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)

  if (deleteError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to delete job', details: deleteError.message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: { id: jobId, deletedAt: when() } } }
}

export default createApiHandler(handle)
