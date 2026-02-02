/**
 * Netlify handler for listing workflows with pagination.
 */

import type { Workflow } from '@domain/abstractions/workflow.ts'
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
import { rowToWorkflow } from '@serverless-mappings/workflows-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/workflows/list' }

/**
 * Handles the workflow list API request with pagination.
 * @param req - The API request with optional query parameters for limit and cursor.
 * @returns The API result with paginated workflows or error.
 */
const handle = async (req: ApiRequest<undefined, ListQuery>): Promise<ApiResponse> => {
  if (req.method !== 'GET') return toMethodNotAllowed()

  const limit = clampLimit(req.query?.limit)
  const cursor = parseCursor(req.query?.cursor)
  const rangeEnd = cursor + limit - 1

  const supabase = Supabase.client()
  const { data, error, count } = await supabase.from('workflows').select('*', {
    count: 'exact'
  }).range(cursor, rangeEnd)

  if (error) return toInternalError('Failed to load workflows', error)

  let workflows: Workflow[] = []
  try {
    workflows = (data ?? []).map(rowToWorkflow)
  } catch (parseError) {
    return toInternalError('Invalid workflow record returned from Supabase',
      parseError as Error)
  }

  const nextCursor = cursor + workflows.length
  const hasMore = typeof count === 'number' ? nextCursor < count : workflows.length === limit

  return { statusCode: HttpCodes.ok, body: { data: workflows, cursor: nextCursor, hasMore } }
}

export default createApiHandler(handle)
