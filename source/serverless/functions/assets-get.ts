/**
 * Netlify handler for fetching an asset by id.
 */

import type { Asset } from '@domain/abstractions/asset.ts'
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
import { rowToAsset } from '@serverless-mappings/assets-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/assets/get' }

/**
 * Fetch an asset by id when provided via query string.
 * @param req - API request wrapper containing query parameters.
 * @returns API result with the asset payload or an error response.
 */
const handle = async (req: ApiRequest<undefined, { id?: string }>): Promise<ApiResponse> => {
  if (req.method !== 'GET') return toMethodNotAllowed()

  const assetId = req.query?.id
  if (!isNonEmptyString(assetId)) return toBadRequest('id is required')

  const { data, error } = await Supabase.client().from('assets').select('*').eq('id', assetId).single()

  if (error || !data) return toNotFound('Asset not found')

  let asset: Asset
  try {
    asset = rowToAsset(data)
  } catch (parseError) {
    return toInternalError('Invalid asset record from database', parseError)
  }

  return toOk(asset)
}

export default createApiHandler(handle)
