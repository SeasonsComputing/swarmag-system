/**
 * Netlify handler for fetching a job by id.
 */

import type { Job } from '@domain/abstractions/job.ts'
import { isNonEmptyString } from '@domain/validators/common-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToJob } from '@serverless-mappings/jobs-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/jobs/get' }

/**
 * Fetch a job by id when provided via query string.
 * @param req - API request wrapper containing query parameters.
 * @returns API result with the job payload or an error response.
 */
const handle = async (
  req: ApiRequest<undefined, { id?: string }>
): Promise<ApiResponse> => {
  if (req.method !== 'GET') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const jobId = req.query?.id
  if (!isNonEmptyString(jobId)) {
    return { statusCode: HttpCodes.badRequest, body: { error: 'id is required' } }
  }

  const { data, error } = await Supabase.client()
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error || !data) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Job not found' } }
  }

  let job: Job
  try {
    job = rowToJob(data)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid job record returned from Supabase', details: (parseError as Error).message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: job } }
}

export default createApiHandler(handle)
