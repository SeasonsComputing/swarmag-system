import { type ID, id } from '@utils/identifier'
import { type When, when } from '@utils/datetime'
import type { JobLogEntry, JobLogType } from '@domain/job'
import type { Attachment, Author, Location } from '@domain/common'
import { Supabase } from '@api/helpers/supabase'
import {
  type ApiRequest,
  type ApiResult,
  withNetlify,
} from '@api/helpers/handler'

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

const validate = (payload: JobLogBody): string | null => {
  if (!payload.jobId) {
    return 'jobId is required'
  }

  if (!payload.planId) {
    return 'planId is required'
  }

  if (!payload.createdBy) {
    return 'createdBy is required'
  }

  if (!payload.type) {
    return 'type is required'
  }

  if (!payload.message) {
    return 'message is required'
  }

  return null
}

export const handle = async (
  req: ApiRequest<JobLogBody>
): Promise<ApiResult> => {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validate(req.body)
  if (validationError) {
    return { statusCode: 422, body: { error: validationError } }
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
      statusCode: 500,
      body: {
        error: 'Failed to append job log entry',
        details: error.message,
      },
    }
  }

  return { statusCode: 201, body: { data: logEntry } }
}

export const handler = withNetlify(handle)
export default handler
