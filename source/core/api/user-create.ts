import type { User, UserRole } from '@domain/common'
import { id } from '@utils/identifier'
import { when } from '@utils/datetime'
import { Supabase } from '@core/platform/supabase'
import {
  HttpCodes,
  type ApiRequest,
  type ApiResult,
  withNetlify,
} from '@core/platform/netlify'

interface UserCreateBody {
  displayName: string
  primaryEmail: string
  phoneNumber: string
  avatarUrl?: string
  roles?: UserRole[]
  status?: User['status']
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

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

const mapToRow = (user: User) => ({
  id: user.id,
  display_name: user.displayName,
  primary_email: user.primaryEmail,
  phone_number: user.phoneNumber,
  avatar_url: user.avatarUrl,
  roles: user.roles,
  status: user.status ?? 'active',
  created_at: user.createdAt,
  updated_at: user.updatedAt,
  deleted_at: user.deletedAt ?? null,
  payload: user,
})

const handle = async (
  req: ApiRequest<UserCreateBody>
): Promise<ApiResult> => {
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
    .insert(mapToRow(user))

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to create user', details: error.message },
    }
  }

  return { statusCode: HttpCodes.created, body: { data: user } }
}

export default withNetlify(handle)
