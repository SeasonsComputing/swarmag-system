/**
 * Netlify handler for listing assets with pagination.
 */

import type { Asset } from '@domain/abstractions/asset.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { clampLimit, type ListQuery, parseCursor } from '@serverless-lib/db-binding.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToAsset } from '@serverless-mappings/assets-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/assets/list' }

/**
 * Handles the asset list API request with pagination.
 * @param req - The API request with optional query parameters for limit and cursor.
 * @returns The API result with paginated assets or error.
 */
const handle = async (
  req: ApiRequest<undefined, ListQuery>
): Promise<ApiResponse> => {
  if (req.method !== 'GET') {
    return {
      statusCode: HttpCodes.methodNotAllowed,
      body: { error: 'Method Not Allowed' }
    }
  }

  const limit = clampLimit(req.query?.limit)
  const cursor = parseCursor(req.query?.cursor)
  const rangeEnd = cursor + limit - 1

  const supabase = Supabase.client()
  const { data, error, count } = await supabase
    .from('assets')
    .select('*', { count: 'exact' })
    .range(cursor, rangeEnd)

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: {
        error: 'Failed to load assets',
        details: error.message
      }
    }
  }

  let assets: Asset[] = []
  try {
    assets = (data ?? []).map(rowToAsset)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: {
        error: 'Invalid asset record returned from Supabase',
        details: (parseError as Error).message
      }
    }
  }

  const nextCursor = cursor + assets.length
  const hasMore = typeof count === 'number' ? nextCursor < count : assets.length === limit

  return {
    statusCode: HttpCodes.ok,
    body: {
      data: assets,
      cursor: nextCursor,
      hasMore
    }
  }
}

export default createApiHandler(handle)
