/**
 * Netlify handler for creating users.
 */

import type { User } from '@domain/abstractions/user.ts'
import { type UserCreateInput } from '@domain/protocol/user-protocol.ts'
import { validateUserCreateInput } from '@domain/validators/user-validators.ts'
import {
  type ApiRequest,
  type ApiResponse,
  toCreated,
  toInternalError,
  toMethodNotAllowed,
  toUnprocessable
} from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { userToRow } from '@serverless-mappings/users-mapping.ts'
import { id, when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/users/create' }

/**
 * Create a new user record when the request payload is valid.
 * @param req Netlify-friendly API request wrapper containing the body.
 * @returns API result with created user or an error response.
 */
const handle = async (req: ApiRequest<UserCreateInput>): Promise<ApiResponse> => {
  if (req.method !== 'POST') return toMethodNotAllowed()

  const validationError = validateUserCreateInput(req.body)
  if (validationError) return toUnprocessable(validationError)

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
    deletedAt: undefined
  }

  const { error } = await Supabase.client().from('users').insert(userToRow(user))

  if (error) return toInternalError('Failed to create user', error)

  return toCreated(user)
}

export default createApiHandler(handle)
