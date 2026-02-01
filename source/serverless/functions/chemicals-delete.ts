/**
 * Netlify handler for deleting chemicals.
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
export const config = { path: '/api/chemicals/delete' }

/**
 * Delete a chemical by id (hard delete).
 * @param req - API request wrapper containing the chemical id to delete.
 * @returns API result with deletion metadata or an error response.
 */
const handle = async (req: ApiRequest<{ id?: string }>): Promise<ApiResponse> => {
  if (req.method !== 'DELETE') return toMethodNotAllowed()

  const chemicalId = req.body?.id
  if (!isNonEmptyString(chemicalId)) return toUnprocessable('id is required')

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase.from('chemicals').select('id').eq('id', chemicalId)
    .single()

  if (fetchError || !existingRow) return toNotFound('Chemical not found')

  const { error: deleteError } = await supabase.from('chemicals').delete().eq('id', chemicalId)

  if (deleteError) return toInternalError('Failed to delete chemical', deleteError)

  return { statusCode: HttpCodes.ok, body: { data: { id: chemicalId, deletedAt: when() } } }
}

export default createApiHandler(handle)
