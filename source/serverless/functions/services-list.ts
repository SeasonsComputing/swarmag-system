/**
 * Netlify handler for listing services with pagination.
 */

import type { Service } from '@domain/abstractions/service.ts'
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
import { rowToService } from '@serverless-mappings/services-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/services/list' }

/**
 * Handles the service list API request with pagination.
 * @param req - The API request with optional query parameters for limit and cursor.
 * @returns The API result with paginated services or error.
 */
const handle = async (req: ApiRequest<undefined, ListQuery>): Promise<ApiResponse> => {
  if (req.method !== 'GET') return toMethodNotAllowed()

  const limit = clampLimit(req.query?.limit)
  const cursor = parseCursor(req.query?.cursor)
  const rangeEnd = cursor + limit - 1

  const supabase = Supabase.client()

  const { data, error, count } = await supabase.from('services').select('*', { count: 'exact' }).range(cursor, rangeEnd)

  if (error) return toInternalError('Failed to load services', error)

  let services: Service[] = []

  try {
    services = (data ?? []).map(rowToService)
  } catch (parseError) {
    return toInternalError('Invalid service record returned from Supabase', parseError as Error)
  }

  const nextCursor = cursor + services.length
  const hasMore = typeof count === 'number' ? nextCursor < count : services.length === limit

  return { statusCode: HttpCodes.ok, body: { data: services, cursor: nextCursor, hasMore } }
}

export default createApiHandler(handle)
