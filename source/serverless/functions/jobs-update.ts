/**
 * Netlify handler for updating jobs.
 */

import type { Job } from '@domain/abstractions/job.ts'
import { type JobUpdateInput, validateJobUpdate } from '@domain/validators/job-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { jobToRow, rowToJob } from '@serverless-mappings/jobs-mapping.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/jobs/update' }

/**
 * Update an existing job while enforcing allowed fields and validation.
 * @param req - API request wrapper containing the update payload.
 * @returns API result with the updated job or an error response.
 */
const handle = async (
  req: ApiRequest<JobUpdateInput>
): Promise<ApiResponse> => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateJobUpdate(req.body)
  if (validationError) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: validationError } }
  }

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', req.body.id)
    .single()

  if (fetchError || !existingRow) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Job not found' } }
  }

  let current: Job
  try {
    current = rowToJob(existingRow)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid job record returned from Supabase', details: (parseError as Error).message }
    }
  }

  const updated: Job = {
    ...current,
    status: req.body.status ?? current.status,
    updatedAt: when()
  }

  const { error: updateError } = await supabase
    .from('jobs')
    .update(jobToRow(updated))
    .eq('id', updated.id)

  if (updateError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to update job', details: updateError.message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: updated } }
}

export default createApiHandler(handle)
