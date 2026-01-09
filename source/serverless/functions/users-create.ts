/**
 * Netlify handler for creating users.
 */

import type { User } from '@domain/common.ts'
import { id } from '@utils/identifier.ts'
import { when } from '@utils/datetime.ts'
import { Supabase } from '@serverless-lib/supabase.ts'
import { HttpCodes, type ApiRequest, type ApiResponse } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { userToRow } from '@serverless-mappings/user-mapping.ts'
import { validateUserCreateInput, type UserCreateInput } from '@domain/common-validators.ts'

/**
 * Edge function path config
 */
export const config = { path: "/api/users/create" };

/**
 * Create a new user record when the request payload is valid.
 * @param req Netlify-friendly API request wrapper containing the body.
 * @returns API result with created user or an error response.
 */
const handle = async (
  req: ApiRequest<UserCreateInput>
): Promise<ApiResponse> => {
  if (req.method !== 'POST') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateUserCreateInput(req.body)
  if (validationError) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: validationError } }
  }

  const now = when()
  const user: User = {
    id: id(),
    displayName: req.body.displayName.trim(),
    primaryEmail: req.body.primaryEmail.trim(),
    phoneNumber: req.body.phoneNumber.trim(),
    avatarUrl: req.body.avatarUrl?.trim(),
    roles: req.body.roles,
    status: req.body.status ?? 'active',
    createdAt: now,
    updatedAt: now,
    deletedAt: undefined,
  }

  const { error } = await Supabase.client()
    .from('users')
    .insert(userToRow(user))

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to create user', details: error.message },
    }
  }

  return { statusCode: HttpCodes.created, body: { data: user } }
}

export default createApiHandler(handle)
