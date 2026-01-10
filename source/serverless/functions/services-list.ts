/**
 * Netlify handler for listing services with pagination.
 */

import type { Service } from '@domain/service.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { clampLimit, parseCursor, type ListQuery, isIdArray } from '@serverless-lib/db-binding.ts'
import { HttpCodes, type ApiRequest, type ApiResponse } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'

/**
 * Edge function path config
 */
export const config = { path: "/api/services/list" };

/**
 * Type guard for supported service categories.
 * @param value Potential category value.
 * @returns True when the value matches a known category.
 */
const isServiceCategory = (value: unknown): value is Service['category'] =>
  value === 'aerial-drone-services' ||
  value === 'ground-machinery-services'

/**
 * Converts a ServiceRow to Service, either from payload or raw row data.
 * @param row The database row to convert.
 * @returns The mapped Service object.
 * @throws Error if required fields are missing.
 */
const rowToService = (row: unknown): Service => {
  if (!row || typeof row !== 'object') {
    throw new Error('Service row is missing required fields')
  }

  const record = row as Record<string, unknown>
  if (record.payload && typeof record.payload === 'object') {
    const payload = record.payload as Record<string, unknown>
    if (
      typeof payload.id === 'string' &&
      typeof payload.name === 'string' &&
      typeof payload.sku === 'string' &&
      isServiceCategory(payload.category) &&
      isIdArray(payload.requiredAssetTypes) &&
      typeof payload.createdAt === 'string' &&
      typeof payload.updatedAt === 'string'
    ) {
      return {
        id: payload.id,
        name: payload.name,
        sku: payload.sku,
        description: typeof payload.description === 'string' ? payload.description : undefined,
        category: payload.category,
        requiredAssetTypes: payload.requiredAssetTypes,
        notes: Array.isArray(payload.notes) ? payload.notes : undefined,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      }
    }
  }

  if (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.sku === 'string' &&
    isServiceCategory(record.category) &&
    isIdArray(record.requiredAssetTypes) &&
    typeof record.createdAt === 'string' &&
    typeof record.updatedAt === 'string'
  ) {
    return {
      id: record.id,
      name: record.name,
      sku: record.sku,
      description: typeof record.description === 'string' ? record.description : undefined,
      category: record.category,
      requiredAssetTypes: record.requiredAssetTypes,
      notes: Array.isArray(record.notes) ? record.notes : undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
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
    services = (data ?? []).map(rowToService)
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

export default createApiHandler(handle)
