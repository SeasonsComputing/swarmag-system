/**
 * Netlify handler for fetching a chemical by id.
 */

import type { Chemical } from '@domain/abstractions/chemical.ts'
import { isNonEmptyString } from '@domain/validators/common-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToChemical } from '@serverless-mappings/chemicals-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/chemicals/get' }

/**
 * Fetch a chemical by id when provided via query string.
 * @param req - API request wrapper containing query parameters.
 * @returns API result with the chemical payload or an error response.
 */
const handle = async (
  req: ApiRequest<undefined, { id?: string }>
): Promise<ApiResponse> => {
  if (req.method !== 'GET') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const chemicalId = req.query?.id
  if (!isNonEmptyString(chemicalId)) {
    return { statusCode: HttpCodes.badRequest, body: { error: 'id is required' } }
  }

  const { data, error } = await Supabase.client()
    .from('chemicals')
    .select('*')
    .eq('id', chemicalId)
    .single()

  if (error || !data) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Chemical not found' } }
  }

  let chemical: Chemical
  try {
    chemical = rowToChemical(data)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid chemical record returned from Supabase', details: (parseError as Error).message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: chemical } }
}

export default createApiHandler(handle)
