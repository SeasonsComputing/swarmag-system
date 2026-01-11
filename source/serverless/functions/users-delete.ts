/**
 * Netlify handler for soft-deleting users.
 */

import { type UserDeleteInput, validateUserDeleteInput } from '@domain/common-validators.ts'
import type { User } from '@domain/common.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToUser, userToRow } from '@serverless-mappings/users-mapping.ts'
import { when } from '@utils/datetime.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/users/delete' }

/**
 * Soft-delete a user by marking deleted timestamp while keeping the record.
 * @param req API request wrapper containing the user id to delete.
 * @returns API result with deletion metadata or an error response.
 */
const handle = async (
  req: ApiRequest<UserDeleteInput>
): Promise<ApiResponse> => {
  if (req.method !== 'DELETE') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateUserDeleteInput(req.body)
  if (validationError) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: validationError } }
  }

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.body.id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existingRow) {
    return { statusCode: HttpCodes.notFound, body: { error: 'User not found' } }
  }

  let user: User
  try {
    user = rowToUser(existingRow)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid user record returned from Supabase', details: (parseError as Error).message }
    }
  }

  const deletedAt = when()
  const updated: User = { ...user, deletedAt, updatedAt: deletedAt }

  const { error: updateError } = await supabase
    .from('users')
    .update(userToRow(updated))
    .eq('id', user.id)

  if (updateError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to delete user', details: updateError.message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: { id: user.id, deletedAt } } }
}

export default createApiHandler(handle)
