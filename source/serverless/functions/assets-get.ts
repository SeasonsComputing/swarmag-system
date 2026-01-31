/**
 * Netlify handler for fetching an asset by id.
 */

import type { Asset } from '@domain/abstractions/asset.ts'
import { isNonEmptyString } from '@domain/validators/common-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
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
const handle = async (
  req: ApiRequest<undefined, { id?: string }>
): Promise<ApiResponse> => {
  if (req.method !== 'GET') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const assetId = req.query?.id
  if (!isNonEmptyString(assetId)) {
    return { statusCode: HttpCodes.badRequest, body: { error: 'id is required' } }
  }

  const { data, error } = await Supabase.client()
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single()

  if (error || !data) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Asset not found' } }
  }

  let asset: Asset
  try {
    asset = rowToAsset(data)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid asset record returned from Supabase', details: (parseError as Error).message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: asset } }
}

export default createApiHandler(handle)
