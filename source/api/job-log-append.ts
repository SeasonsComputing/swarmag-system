import { type ID, id } from '@utils/identifier'
import { type When, when } from '@utils/datetime'
import type { JobLogEntry, JobLogType } from '@domain/job'
import type { Attachment, Author, Location } from '@domain/common'
import { Supabase } from '@api/platform/supabase'
import {
  HttpCodes,
  type ApiRequest,
  type ApiResult,
  withNetlify,
} from '@api/platform/netlify'

/** Body structure for job log append API requests. */
interface JobLogBody {
  jobId: ID
  planId: ID
  type: JobLogType
  message: string
  location?: Location
  attachments?: Attachment[]
  payload?: Record<string, unknown>
  createdBy: Author
  occurredAt?: When
}

/**
 * Validates the job log append payload.
 * @param payload - The job log body to validate.
 * @returns A string error message if invalid, null if valid.
 */
const validate = (payload: JobLogBody): string | null => {
  if (!payload?.jobId) return 'jobId is required'
  if (!payload.planId) return 'planId is required'
  if (!payload.createdBy) return 'createdBy is required'
  if (!payload.type) return 'type is required'
  if (!payload.message) return 'message is required'
  return null
}

/**
 * Handles the job log append API request.
 * @param req - The API request containing job log entry details.
 * @returns The API result with created log entry or error.
 */
export const handle = async (
  req: ApiRequest<JobLogBody>
): Promise<ApiResult> => {
  if (req.method !== 'POST') {
    return { 
      statusCode: HttpCodes.methodNotAllowed, 
      body: { error: 'Method Not Allowed' } 
    }
  }

  const validationError = validate(req.body)
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

export default withNetlify(handle)
