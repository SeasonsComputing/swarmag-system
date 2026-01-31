/**
 * Netlify handler for creating assets.
 */

import type { Asset } from '@domain/abstractions/asset.ts'
import { type AssetCreateInput, validateAssetCreate } from '@domain/validators/asset-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { assetToRow } from '@serverless-mappings/assets-mapping.ts'
import { id, when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/assets/create' }

/**
 * Create a new asset record when the request payload is valid.
 * @param req - Netlify-friendly API request wrapper containing the body.
 * @returns API result with created asset or an error response.
 */
const handle = async (
  req: ApiRequest<AssetCreateInput>
): Promise<ApiResponse> => {
  if (req.method !== 'POST') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateAssetCreate(req.body)
  if (validationError) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: validationError } }
  }

  const now = when()
  const asset: Asset = {
    id: id(),
    label: req.body.label.trim(),
    description: req.body.description?.trim(),
    serialNumber: req.body.serialNumber?.trim(),
    type: req.body.type,
    status: req.body.status ?? 'active',
    attachments: undefined,
    createdAt: now,
    updatedAt: now
  }

  const { error } = await Supabase.client()
    .from('assets')
    .insert(assetToRow(asset))

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to create asset', details: error.message }
    }
  }

  return { statusCode: HttpCodes.created, body: { data: asset } }
}

export default createApiHandler(handle)
