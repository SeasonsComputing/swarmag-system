/**
 * Netlify handler for fetching a chemical by id.
 */

import type { Chemical } from '@domain/abstractions/chemical.ts'
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
const handle = async (req: ApiRequest<undefined, { id?: string }>): Promise<ApiResponse> => {
  if (req.method !== 'GET') return toMethodNotAllowed()

  const chemicalId = req.query?.id
  if (!isNonEmptyString(chemicalId)) return toBadRequest('id is required')

  const { data, error } = await Supabase.client().from('chemicals').select('*').eq('id',
    chemicalId).single()

  if (error || !data) return toNotFound('Chemical not found')

  let chemical: Chemical
  try {
    chemical = rowToChemical(data)
  } catch (parseError) {
    return toInternalError('Invalid chemical record from database', parseError)
  }

  return toOk(chemical)
}

export default createApiHandler(handle)
