import type { Service } from '@domain/service'
import { Supabase } from '@api/platform/supabase'
import {
  HttpCodes,
  type ApiRequest,
  type ApiResult,
  withNetlify,
} from '@api/platform/netlify'

/** Raw database row structure for services, possibly with nested payload. */
type ServiceRow = Partial<Service> & {
  payload?: Service
  [key: string]: unknown
}

/** Query string parameters for service list API requests. */
type ServiceListQuery = {
  limit?: string
  cursor?: string
}

/**
 * Converts a ServiceRow to Service, either from payload or raw row data.
 * @param row - The database row to convert.
 * @returns The mapped Service object.
 * @throws Error if required fields are missing.
 */
const rowToService = (row: ServiceRow): Service => {
  if (row.payload) return row.payload

  if (
    typeof row.id === 'string' &&
    typeof row.slug === 'string' &&
    typeof row.name === 'string'
  ) {
    return row as Service
  }

  throw new Error('Service row is missing required fields')
}

/**
 * Handles the service list API request with pagination.
 * @param req - The API request with optional query parameters for limit and cursor.
 * @returns The API result with paginated services or error.
 */
export const handle = async (
  req: ApiRequest<undefined, ServiceListQuery>
): Promise<ApiResult> => {
  if (req.method !== 'GET') {
    return {
      statusCode: HttpCodes.methodNotAllowed,
      body: { error: 'Method Not Allowed' },
    }
  }

  const limit = Supabase.clampLimit(req.query?.limit)
  const cursor = Supabase.parseCursor(req.query?.cursor)
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
