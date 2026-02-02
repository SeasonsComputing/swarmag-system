/**
 * Netlify handler for fetching a service by id.
 */

import type { Service } from '@domain/abstractions/service.ts'
import { isNonEmptyString } from '@domain/validators/helper-validators.ts'
import {
  type ApiRequest,
  type ApiResponse,
  toBadRequest,
  toInternalError,
  toMethodNotAllowed,
  toNotFound,
  toOk
} from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToService } from '@serverless-mappings/services-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/services/get' }

/**
 * Fetch a service by id when provided via query string.
 * @param req - API request wrapper containing query parameters.
 * @returns API result with the service payload or an error response.
 */
const handle = async (req: ApiRequest<undefined, { id?: string }>): Promise<ApiResponse> => {
  if (req.method !== 'GET') return toMethodNotAllowed()

  const serviceId = req.query?.id
  if (!isNonEmptyString(serviceId)) return toBadRequest('id is required')

  const { data, error } = await Supabase.client().from('services').select('*').eq('id',
    serviceId).single()

  if (error || !data) return toNotFound('Service not found')

  let service: Service
  try {
    service = rowToService(data)
  } catch (parseError) {
    return toInternalError('Invalid service record returned from Supabase',
      parseError as Error)
  }

  return toOk(service)
}

export default createApiHandler(handle)
