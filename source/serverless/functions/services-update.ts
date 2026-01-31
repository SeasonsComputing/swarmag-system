/**
 * Netlify handler for updating services.
 */

import type { Service } from '@domain/abstractions/service.ts'
import { type ServiceUpdateInput, validateServiceUpdate } from '@domain/validators/service-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToService, serviceToRow } from '@serverless-mappings/services-mapping.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/services/update' }

/**
 * Update an existing service while enforcing allowed fields and validation.
 * @param req - API request wrapper containing the update payload.
 * @returns API result with the updated service or an error response.
 */
const handle = async (
  req: ApiRequest<ServiceUpdateInput>
): Promise<ApiResponse> => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateServiceUpdate(req.body)
  if (validationError) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: validationError } }
  }

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase
    .from('services')
    .select('*')
    .eq('id', req.body.id)
    .single()

  if (fetchError || !existingRow) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Service not found' } }
  }

  let current: Service
  try {
    current = rowToService(existingRow)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid service record returned from Supabase', details: (parseError as Error).message }
    }
  }

  const updated: Service = {
    ...current,
    name: req.body.name?.trim() ?? current.name,
    sku: req.body.sku?.trim() ?? current.sku,
    description: req.body.description === null ? undefined : req.body.description?.trim() ?? current.description,
    category: req.body.category ?? current.category,
    requiredAssetTypes: req.body.requiredAssetTypes ?? current.requiredAssetTypes,
    updatedAt: when()
  }

  const { error: updateError } = await supabase
    .from('services')
    .update(serviceToRow(updated))
    .eq('id', updated.id)

  if (updateError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to update service', details: updateError.message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: updated } }
}

export default createApiHandler(handle)
