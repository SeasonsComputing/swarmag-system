/**
 * Netlify handler for fetching a user by id.
 */

import type { User } from '@domain/abstractions/user.ts'
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
import { rowToUser } from '@serverless-mappings/users-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/users/get' }

/**
 * Fetch a user by id when provided via query string.
 * @param req API request wrapper containing query parameters.
 * @returns API result with the user payload or an error response.
 */
const handle = async (req: ApiRequest<undefined, { id?: string }>): Promise<ApiResponse> => {
  if (req.method !== 'GET') return toMethodNotAllowed()

  const userId = req.query?.id
  if (!isNonEmptyString(userId)) return toBadRequest('id is required')

  const { data, error } = await Supabase.client().from('users').select('*').eq('id', userId).is('deleted_at', null)
    .single()

  if (error || !data) return toNotFound('User not found')

  let user: User
  try {
    user = rowToUser(data)
  } catch (parseError) {
    return toInternalError('Invalid user record from database', parseError)
  }

  return toOk(user)
}

export default createApiHandler(handle)
