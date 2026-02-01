/**
 * Netlify handler for updating services.
 */

import type { Service } from '@domain/abstractions/service.ts'
import { type ServiceUpdateInput, validateServiceUpdate } from '@domain/validators/service-validators.ts'
import {
  type ApiRequest,
  type ApiResponse,
  toInternalError,
  toMethodNotAllowed,
  toNotFound,
  toOk,
  toUnprocessable
} from '@serverless-lib/api-binding.ts'
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
const handle = async (req: ApiRequest<ServiceUpdateInput>): Promise<ApiResponse> => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') return toMethodNotAllowed()

  const validationError = validateServiceUpdate(req.body)
  if (validationError) return toUnprocessable(validationError)

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase.from('services').select('*').eq('id', req.body.id)
    .single()

  if (fetchError || !existingRow) return toNotFound('Service not found')

  let current: Service
  try {
    current = rowToService(existingRow)
  } catch (parseError) {
    return toInternalError('Invalid service record returned from Supabase', parseError as Error)
  }

  const updated: Service = { ...current, name: req.body.name?.trim() ?? current.name,
    sku: req.body.sku?.trim() ?? current.sku,
    description: req.body.description === null ? undefined : req.body.description?.trim() ?? current.description,
    category: req.body.category ?? current.category,
    requiredAssetTypes: req.body.requiredAssetTypes ?? current.requiredAssetTypes, updatedAt: when() }

  const { error: updateError } = await supabase.from('services').update(serviceToRow(updated)).eq('id', updated.id)

  if (updateError) return toInternalError('Failed to update service', updateError)

  return toOk(updated)
}

export default createApiHandler(handle)
