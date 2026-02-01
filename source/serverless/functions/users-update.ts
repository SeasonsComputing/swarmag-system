/**
 * Netlify handler for updating users.
 */

import type { User } from '@domain/abstractions/user.ts'
import type { UserUpdateInput } from '@domain/protocol/user-protocol.ts'
import { validateUserUpdateInput } from '@domain/validators/user-validators.ts'
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
import { rowToUser, userToRow } from '@serverless-mappings/users-mapping.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/users/update' }

/**
 * Update an existing user while enforcing allowed fields and validation.
 * @param req API request wrapper containing the update payload.
 * @returns API result with the updated user or an error response.
 */
const handle = async (req: ApiRequest<UserUpdateInput>): Promise<ApiResponse> => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') return toMethodNotAllowed()

  const validationError = validateUserUpdateInput(req.body)
  if (validationError) return toUnprocessable(validationError)

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase.from('users').select('*').eq('id', req.body.id).is(
    'deleted_at',
    null
  ).single()

  if (fetchError || !existingRow) return toNotFound('User not found')

  let current: User
  try {
    current = rowToUser(existingRow)
  } catch (parseError) {
    return toInternalError('Invalid user record from database', parseError)
  }

  const updated: User = { ...current, displayName: req.body.displayName?.trim() ?? current.displayName,
    primaryEmail: req.body.primaryEmail?.trim() ?? current.primaryEmail,
    phoneNumber: req.body.phoneNumber?.trim() ?? current.phoneNumber,
    avatarUrl: req.body.avatarUrl === null ? undefined : req.body.avatarUrl?.trim() ?? current.avatarUrl,
    roles: req.body.roles === null ? undefined : req.body.roles ?? current.roles,
    status: req.body.status ?? current.status, updatedAt: when() }

  const { error: updateError } = await supabase.from('users').update(userToRow(updated)).eq('id', updated.id)

  if (updateError) return toInternalError('Failed to update user', updateError)

  return toOk(updated)
}

export default createApiHandler(handle)
