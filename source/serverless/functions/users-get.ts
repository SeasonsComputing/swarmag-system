/**
 * Netlify handler for fetching a user by id.
 */

import type { User } from '@domain/common.ts'
import { Supabase } from '@serverless-lib/supabase.ts'
import { HttpCodes, type ApiRequest, type ApiResponse } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { rowToUser } from '@serverless-mappings/user-mapping.ts'
import { validateUserGetQuery, type UserGetQuery } from '@domain/common-validators.ts'

/**
 * Edge function path config
 */
export const config = { path: "/api/users/get" };

/**
 * Fetch a user by id when provided via query string.
 * @param req API request wrapper containing query parameters.
 * @returns API result with the user payload or an error response.
 */
const handle = async (
  req: ApiRequest<undefined, UserGetQuery>
): Promise<ApiResponse> => {
  if (req.method !== 'GET') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateUserGetQuery(req.query)
  if (validationError) {
    return { statusCode: HttpCodes.badRequest, body: { error: validationError } }
  }

  const userId = req.query?.id

  const { data, error } = await Supabase.client()
    .from('users')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return { statusCode: HttpCodes.notFound, body: { error: 'User not found' } }
  }

  let user: User
  try {
    user = rowToUser(data)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid user record returned from Supabase', details: (parseError as Error).message },
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: user } }
}

export default createApiHandler(handle)
