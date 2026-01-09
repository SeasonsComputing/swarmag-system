/**
 * Netlify handler for appending job log entries.
 */

import { id } from '@utils/identifier.ts'
import { type When, when } from '@utils/datetime.ts'
import type { JobLogEntry } from '@domain/job.ts'
import { HttpCodes, type ApiRequest, type ApiResponse } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/supabase.ts'
import { validateJobLogAppendInput, type JobLogAppendInput } from '@domain/job-validators.ts'

/**
 * Edge function path config
 */
export const config = { path: "/api/jobs-log/append" };

/**
 * Handles the job log append API request.
 * @param req - The API request containing job log entry details.
 * @returns The API result with created log entry or error.
 */
const handle = async (
  req: ApiRequest<JobLogAppendInput>
): Promise<ApiResponse> => {
  if (req.method !== 'POST') {
    return { 
      statusCode: HttpCodes.methodNotAllowed, 
      body: { error: 'Method Not Allowed' } 
    }
  }

  const validationError = validateJobLogAppendInput(req.body)
  if (validationError) {
    return { 
      statusCode: HttpCodes.unprocessableEntity, 
      body: { error: validationError } 
    }
  }

  const now: When = when()
  const logEntry: JobLogEntry = {
    id: id(),
    jobId: req.body.jobId,
    planId: req.body.planId,
    type: req.body.type,
    message: req.body.message,
    occurredAt: req.body.occurredAt ?? now,
    createdAt: now,
    createdBy: req.body.createdBy,
    location: req.body.location,
    attachments: req.body.attachments,
    payload: req.body.payload,
  }

  const supabase = Supabase.client()
  
  const { error } = await supabase.from('job_logs').insert({
    id: logEntry.id,
    job_id: logEntry.jobId,
    plan_id: logEntry.planId,
    type: logEntry.type,
    occurred_at: logEntry.occurredAt,
    created_at: logEntry.createdAt,
    payload: logEntry,
  })

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: {
        error: 'Failed to append job log entry',
        details: error.message,
      },
    }
  }

  return { statusCode: HttpCodes.created, body: { data: logEntry } }
}

export default createApiHandler(handle)
