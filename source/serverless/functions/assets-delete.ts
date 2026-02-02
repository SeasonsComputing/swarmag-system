/**
 * Netlify handler for deleting assets.
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
export const config = { path: '/api/assets/delete' }

/**
 * Delete an asset by id (hard delete).
 * @param req - API request wrapper containing the asset id to delete.
 * @returns API result with deletion metadata or an error response.
 */
const handle = async (req: ApiRequest<{ id?: string }>): Promise<ApiResponse> => {
  if (req.method !== 'DELETE') return toMethodNotAllowed()

  const assetId = req.body?.id
  if (!isNonEmptyString(assetId)) return toUnprocessable('id is required')

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase.from('assets').select('id')
    .eq('id', assetId).single()

  if (fetchError || !existingRow) return toNotFound('Asset not found')

  const { error: deleteError } = await supabase.from('assets').delete().eq('id', assetId)

  if (deleteError) return toInternalError('Failed to delete asset', deleteError)

  return { statusCode: HttpCodes.ok, body: { data: { id: assetId, deletedAt: when() } } }
}

export default createApiHandler(handle)
