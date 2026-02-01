/**
 * Netlify handler for soft-deleting users.
 */

import type { User } from '@domain/abstractions/user.ts'
import { isNonEmptyString } from '@domain/validators/helper-validators.ts'
import {
  type ApiRequest,
  type ApiResponse,
  HttpCodes,
  toInternalError,
  toMethodNotAllowed,
  toNotFound,
  toUnprocessable
} from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToUser, userToRow } from '@serverless-mappings/users-mapping.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/users/delete' }

/**
 * Soft-delete a user by marking deleted timestamp while keeping the record.
 * @param req API request wrapper containing the user id to delete.
 * @returns API result with deletion metadata or an error response.
 */
const handle = async (req: ApiRequest<{ id?: string }>): Promise<ApiResponse> => {
  if (req.method !== 'DELETE') return toMethodNotAllowed()

  const userId = req.body?.id
  if (!isNonEmptyString(userId)) return toUnprocessable('id is required')

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase.from('users').select('*').eq('id', userId).is(
    'deleted_at',
    null
  ).single()

  if (fetchError || !existingRow) return toNotFound('User not found')

  let user: User
  try {
    user = rowToUser(existingRow)
  } catch (parseError) {
    return toInternalError('Invalid user record from database', parseError)
  }

  const deletedAt = when()
  const updated: User = { ...user, deletedAt, updatedAt: deletedAt }

  const { error: updateError } = await supabase.from('users').update(userToRow(updated)).eq('id', user.id)

  if (updateError) return toInternalError('Failed to delete user', updateError)

  return { statusCode: HttpCodes.ok, body: { data: { id: user.id, deletedAt } } }
}

export default createApiHandler(handle)
