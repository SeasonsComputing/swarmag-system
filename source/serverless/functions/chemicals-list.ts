/**
 * Netlify handler for listing chemicals with pagination.
 */

import type { Chemical } from '@domain/abstractions/chemical.ts'
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
import { rowToChemical } from '@serverless-mappings/chemicals-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/chemicals/list' }

/**
 * Handles the chemical list API request with pagination.
 * @param req - The API request with optional query parameters for limit and cursor.
 * @returns The API result with paginated chemicals or error.
 */
const handle = async (req: ApiRequest<undefined, ListQuery>): Promise<ApiResponse> => {
  if (req.method !== 'GET') return toMethodNotAllowed()

  const limit = clampLimit(req.query?.limit)
  const cursor = parseCursor(req.query?.cursor)
  const rangeEnd = cursor + limit - 1

  const supabase = Supabase.client()
  const { data, error, count } = await supabase.from('chemicals').select('*', {
    count: 'exact'
  }).range(cursor, rangeEnd)

  if (error) return toInternalError('Failed to load chemicals', error)

  let chemicals: Chemical[] = []
  try {
    chemicals = (data ?? []).map(rowToChemical)
  } catch (parseError) {
    return toInternalError('Invalid chemical record from database', parseError)
  }

  const nextCursor = cursor + chemicals.length
  const hasMore = typeof count === 'number' ? nextCursor < count : chemicals.length === limit

  return { statusCode: HttpCodes.ok, body: { data: chemicals, cursor: nextCursor, hasMore } }
}

export default createApiHandler(handle)
