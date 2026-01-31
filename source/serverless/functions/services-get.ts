/**
 * Netlify handler for fetching a service by id.
 */

import type { Service } from '@domain/abstractions/service.ts'
import { isNonEmptyString } from '@domain/validators/common-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
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
const handle = async (
  req: ApiRequest<undefined, { id?: string }>
): Promise<ApiResponse> => {
  if (req.method !== 'GET') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const serviceId = req.query?.id
  if (!isNonEmptyString(serviceId)) {
    return { statusCode: HttpCodes.badRequest, body: { error: 'id is required' } }
  }

  const { data, error } = await Supabase.client()
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single()

  if (error || !data) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Service not found' } }
  }

  let service: Service
  try {
    service = rowToService(data)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid service record returned from Supabase', details: (parseError as Error).message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: service } }
}

export default createApiHandler(handle)
