/**
 * Netlify handler for creating services.
 */

import type { Service } from '@domain/abstractions/service.ts'
import { type ServiceCreateInput, validateServiceCreate } from '@domain/validators/service-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { serviceToRow } from '@serverless-mappings/services-mapping.ts'
import { id, when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/services/create' }

/**
 * Create a new service record when the request payload is valid.
 * @param req - Netlify-friendly API request wrapper containing the body.
 * @returns API result with created service or an error response.
 */
const handle = async (
  req: ApiRequest<ServiceCreateInput>
): Promise<ApiResponse> => {
  if (req.method !== 'POST') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateServiceCreate(req.body)
  if (validationError) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: validationError } }
  }

  const now = when()
  const service: Service = {
    id: id(),
    name: req.body.name.trim(),
    sku: req.body.sku.trim(),
    description: req.body.description?.trim(),
    category: req.body.category,
    requiredAssetTypes: req.body.requiredAssetTypes,
    notes: undefined,
    createdAt: now,
    updatedAt: now
  }

  const { error } = await Supabase.client()
    .from('services')
    .insert(serviceToRow(service))

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to create service', details: error.message }
    }
  }

  return { statusCode: HttpCodes.created, body: { data: service } }
}

export default createApiHandler(handle)
