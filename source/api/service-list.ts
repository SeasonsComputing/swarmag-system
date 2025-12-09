import type { Service } from '@domain/service'
import { Supabase } from '@api/helpers/supabase'
import { type ApiRequest, type ApiResult, withNetlify } from '@api/helpers/handler'

const clampLimit = (value?: string | null): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 25
  }

  return Math.min(parsed, 100)
}

const parseCursor = (value?: string | null): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed
}

type ServiceRow = Partial<Service> & {
  payload?: Service
  [key: string]: unknown
}

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

type ServiceListQuery = {
  limit?: string
  cursor?: string
}

export const handle = async (
  req: ApiRequest<undefined, ServiceListQuery>
): Promise<ApiResult> => {
  if (req.method !== 'GET') {
    return { statusCode: 405, body: { error: 'Method Not Allowed' } }
  }

  const limit = clampLimit(req.query?.limit)
  const cursor = parseCursor(req.query?.cursor)

  const supabase = Supabase.client()
  const rangeEnd = cursor + limit - 1

  const { data, error, count } = await supabase
    .from('services')
    .select('*', { count: 'exact' })
    .range(cursor, rangeEnd)

  if (error) {
    return {
      statusCode: 500,
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
      statusCode: 500,
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
    statusCode: 200,
    body: {
      data: services,
      cursor: nextCursor,
      hasMore,
    },
  }
}

export const handler = withNetlify(handle)
export default handler
