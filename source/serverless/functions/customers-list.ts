/**
 * Netlify handler for listing customers with pagination.
 */

import type { Customer } from '@domain/abstractions/customer.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { clampLimit, type ListQuery, parseCursor } from '@serverless-lib/db-binding.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToCustomer } from '@serverless-mappings/customers-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/customers/list' }

/**
 * Handles the customer list API request with pagination.
 * @param req - The API request with optional query parameters for limit and cursor.
 * @returns The API result with paginated customers or error.
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
    .from('customers')
    .select('*', { count: 'exact' })
    .range(cursor, rangeEnd)

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: {
        error: 'Failed to load customers',
        details: error.message
      }
    }
  }

  let customers: Customer[] = []
  try {
    customers = (data ?? []).map(rowToCustomer)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: {
        error: 'Invalid customer record returned from Supabase',
        details: (parseError as Error).message
      }
    }
  }

  const nextCursor = cursor + customers.length
  const hasMore = typeof count === 'number' ? nextCursor < count : customers.length === limit

  return {
    statusCode: HttpCodes.ok,
    body: {
      data: customers,
      cursor: nextCursor,
      hasMore
    }
  }
}

export default createApiHandler(handle)
