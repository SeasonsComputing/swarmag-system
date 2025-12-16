/**
 * Netlify handler for listing services with pagination.
 */

import type { Service } from '@domain/service'
import { Supabase } from '@core/platform/supabase'
import { clampLimit, parseCursor, type ListQuery, type Row, isIdArray } from '@core/platform/db-binding'
import {
  HttpCodes,
  type ApiRequest,
  type ApiResult,
} from '@core/platform/api-binding'
import { withNetlify } from '@core/platform/netlify'

/**
 * Converts a ServiceRow to Service, either from payload or raw row data.
 * @param row - The database row to convert.
 * @returns The mapped Service object.
 * @throws Error if required fields are missing.
 */
const isServiceCategory = (value: unknown): value is Service['category'] =>
  value === 'aerial-drone-services' ||
  value === 'ground-machinery-services'

type ServiceRow = Row<Service>

const rowToService = (row: Row<Service>): Service => {
  if (row.payload) return row.payload

  if (
    typeof row.id === 'string' &&
    typeof row.name === 'string' &&
    typeof row.sku === 'string' &&
    isServiceCategory(row.category) &&
    isIdArray(row.requiredAssetTypes) &&
    typeof row.createdAt === 'string' &&
    typeof row.updatedAt === 'string'
  ) {
    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      description: row.description,
      category: row.category,
      requiredAssetTypes: row.requiredAssetTypes,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  throw new Error('Service row is missing required fields')
}

/**
 * Handles the service list API request with pagination.
 * @param req - The API request with optional query parameters for limit and cursor.
 * @returns The API result with paginated services or error.
 */
const handle = async (
  req: ApiRequest<undefined, ListQuery>
): Promise<ApiResult> => {
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
    .from('services')
    .select('*', { count: 'exact' })
    .range(cursor, rangeEnd)

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: {
        error: 'Failed to load services',
        details: error.message,
      },
    }
  }

  let services: Service[] = []

  try {
    services = ((data ?? []) as ServiceRow[]).map(rowToService)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: {
        error: 'Invalid service record returned from Supabase',
        details: (parseError as Error).message,
      },
    }
  }

  const nextCursor = cursor + services.length
  const hasMore =
    typeof count === 'number' ? nextCursor < count : services.length === limit

  return {
    statusCode: HttpCodes.ok,
    body: {
      data: services,
      cursor: nextCursor,
      hasMore,
    },
  }
}

export default withNetlify(handle)
