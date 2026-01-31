/**
 * Netlify handler for deleting chemicals.
 */

import { isNonEmptyString } from '@domain/validators/common-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
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
const handle = async (
  req: ApiRequest<{ id?: string }>
): Promise<ApiResponse> => {
  if (req.method !== 'DELETE') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const chemicalId = req.body?.id
  if (!isNonEmptyString(chemicalId)) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: 'id is required' } }
  }

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase
    .from('chemicals')
    .select('id')
    .eq('id', chemicalId)
    .single()

  if (fetchError || !existingRow) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Chemical not found' } }
  }

  const { error: deleteError } = await supabase
    .from('chemicals')
    .delete()
    .eq('id', chemicalId)

  if (deleteError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to delete chemical', details: deleteError.message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: { id: chemicalId, deletedAt: when() } } }
}

export default createApiHandler(handle)
