/**
 * Netlify handler for creating users.
 */

import type { User, UserRole } from '@domain/common.ts'
import { id } from '@utils/identifier.ts'
import { when } from '@utils/datetime.ts'
import { Supabase } from '@serverless/lib/supabase.ts'
import { isNonEmptyString } from '@serverless/lib/db-binding.ts'
import {
  HttpCodes,
  type ApiRequest,
  type ApiResponse,
} from '@serverless/lib/api-binding.ts'
import { withNetlify } from '@serverless/lib/netlify.ts'
import { userToRow } from '@serverless/functions/user-mapping.ts'

interface UserCreateBody {
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles?: UserRole[]
  status?: User['status']
}

/**
 * Validate the incoming user create payload.
 * @param payload Partial payload from the request body.
 * @returns Error message string when invalid; otherwise null.
 */
const validate = (payload: UserCreateBody): string | null => {
  if (!isNonEmptyString(payload?.displayName)) return 'displayName is required'
  if (!isNonEmptyString(payload.primaryEmail)) return 'primaryEmail is required'
  if (!isNonEmptyString(payload.phoneNumber)) return 'phoneNumber is required'
  if (payload.status && payload.status !== 'active' && payload.status !== 'inactive') {
    return 'status must be active or inactive'
  }
  if (payload.roles && !Array.isArray(payload.roles)) {
    return 'roles must be an array of UserRole'
  }
  return null
}

/**
 * Create a new user record when the request payload is valid.
 * @param req Netlify-friendly API request wrapper containing the body.
 * @returns API result with created user or an error response.
 */
const handle = async (
  req: ApiRequest<UserCreateBody>
): Promise<ApiResponse> => {
  if (req.method !== 'POST') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validate(req.body)
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

export default withNetlify(handle)
