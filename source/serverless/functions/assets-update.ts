/**
 * Netlify handler for updating assets.
 */

import type { Asset } from '@domain/abstractions/asset.ts'
import { type AssetUpdateInput, validateAssetUpdate } from '@domain/validators/asset-validators.ts'
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
import { assetToRow, rowToAsset } from '@serverless-mappings/assets-mapping.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/assets/update' }

/**
 * Update an existing asset while enforcing allowed fields and validation.
 * @param req - API request wrapper containing the update payload.
 * @returns API result with the updated asset or an error response.
 */
const handle = async (req: ApiRequest<AssetUpdateInput>): Promise<ApiResponse> => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') return toMethodNotAllowed()

  const validationError = validateAssetUpdate(req.body)
  if (validationError) return toUnprocessable(validationError)

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase.from('assets').select('*').eq('id', req.body.id)
    .single()

  if (fetchError || !existingRow) return toNotFound('Asset not found')

  let current: Asset
  try {
    current = rowToAsset(existingRow)
  } catch (parseError) {
    return toInternalError('Invalid asset record from database', parseError)
  }

  const updated: Asset = { ...current, label: req.body.label?.trim() ?? current.label,
    description: req.body.description === null ? undefined : req.body.description?.trim() ?? current.description,
    serialNumber: req.body.serialNumber === null ? undefined : req.body.serialNumber?.trim() ?? current.serialNumber,
    type: req.body.type ?? current.type, status: req.body.status ?? current.status, updatedAt: when() }

  const { error: updateError } = await supabase.from('assets').update(assetToRow(updated)).eq('id', updated.id)

  if (updateError) return toInternalError('Failed to update asset', updateError)

  return toOk(updated)
}

export default createApiHandler(handle)
