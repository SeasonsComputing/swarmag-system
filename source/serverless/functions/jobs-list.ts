/**
 * Netlify handler for listing jobs with pagination.
 */

import type { Job } from '@domain/abstractions/job.ts'
import {
  type ApiRequest,
  type ApiResponse,
  HttpCodes,
  toInternalError,
  toMethodNotAllowed
} from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { clampLimit, type ListQuery, parseCursor } from '@serverless-lib/db-binding.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToJob } from '@serverless-mappings/jobs-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/jobs/list' }

/**
 * Handles the job list API request with pagination.
 * @param req - The API request with optional query parameters for limit and cursor.
 * @returns The API result with paginated jobs or error.
 */
const handle = async (req: ApiRequest<undefined, ListQuery>): Promise<ApiResponse> => {
  if (req.method !== 'GET') return toMethodNotAllowed()

  const limit = clampLimit(req.query?.limit)
  const cursor = parseCursor(req.query?.cursor)
  const rangeEnd = cursor + limit - 1

  const supabase = Supabase.client()
  const { data, error, count } = await supabase.from('jobs').select('*', { count: 'exact' }).range(cursor, rangeEnd)

  if (error) return toInternalError('Failed to load jobs', error)

  let jobs: Job[] = []
  try {
    jobs = (data ?? []).map(rowToJob)
  } catch (parseError) {
    return toInternalError('Invalid job record returned from Supabase', parseError as Error)
  }

  const nextCursor = cursor + jobs.length
  const hasMore = typeof count === 'number' ? nextCursor < count : jobs.length === limit

  return { statusCode: HttpCodes.ok, body: { data: jobs, cursor: nextCursor, hasMore } }
}

export default createApiHandler(handle)
