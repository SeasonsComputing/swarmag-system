/**
 * Netlify handler for listing users with pagination.
 */

import type { User } from '@domain/common.ts'
import { Supabase } from '@serverless-lib/supabase.ts'
import { clampLimit, parseCursor, type ListQuery } from '@serverless-lib/db-binding.ts'
import { HttpCodes, type ApiRequest, type ApiResponse } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { rowToUser } from '@serverless-mappings/users-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: "/api/users/list" };

/**
 * Handles the user list API request with pagination.
 * @param req - The API request with optional query parameters for limit and cursor.
 * @returns The API result with paginated users or error.
 */
const handle = async (
  req: ApiRequest<undefined, ListQuery>
): Promise<ApiResponse> => {
  if (req.method !== 'GET') {
    return {
      statusCode: HttpCodes.methodNotAllowed,
      body: { error: 'Method Not Allowed' },
    }
  }

  const limit = clampLimit(req.query?.limit)
  const cursor = parseCursor(req.query?.cursor)
  const rangeEnd = cursor + limit - 1

  const supabase = Supabase.client()
  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .range(cursor, rangeEnd)

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: {
        error: 'Failed to load users',
        details: error.message,
      },
    }
  }

  let users: User[] = []
  try {
    users = (data ?? []).map(rowToUser)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: {
        error: 'Invalid user record returned from Supabase',
        details: (parseError as Error).message,
      },
    }
  }

  const nextCursor = cursor + users.length
  const hasMore =
    typeof count === 'number' ? nextCursor < count : users.length === limit

  return {
    statusCode: HttpCodes.ok,
    body: {
      data: users,
      cursor: nextCursor,
      hasMore,
    },
  }
}

export default createApiHandler(handle)
