/**
 * Netlify handler for deleting services.
 */

import { isNonEmptyString } from '@domain/validators/helper-validators.ts'
import {
  type ApiRequest,
  type ApiResponse,
  HttpCodes,
  toInternalError,
  toMethodNotAllowed,
  toNotFound,
  toUnprocessable
} from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/services/delete' }

/**
 * Delete a service by id (hard delete since services don't have soft delete).
 * @param req - API request wrapper containing the service id to delete.
 * @returns API result with deletion metadata or an error response.
 */
const handle = async (req: ApiRequest<{ id?: string }>): Promise<ApiResponse> => {
  if (req.method !== 'DELETE') return toMethodNotAllowed()

  const serviceId = req.body?.id
  if (!isNonEmptyString(serviceId)) return toUnprocessable('id is required')

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase.from('services').select('id').eq('id', serviceId)
    .single()

  if (fetchError || !existingRow) return toNotFound('Service not found')

  const { error: deleteError } = await supabase.from('services').delete().eq('id', serviceId)

  if (deleteError) return toInternalError('Failed to delete service', deleteError)

  return { statusCode: HttpCodes.ok, body: { data: { id: serviceId, deletedAt: when() } } }
}

export default createApiHandler(handle)
