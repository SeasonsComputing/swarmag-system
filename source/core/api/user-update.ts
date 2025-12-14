import type { User, UserRole } from '@domain/common'
import { when } from '@utils/datetime'
import { Supabase } from '@core/platform/binding'
import {
  HttpCodes,
  type ApiRequest,
  type ApiResult,
  withNetlify,
} from '@core/platform/netlify'
import { mapUserToRow, rowToUser } from '@core/api/user-mapping'

interface UserUpdateBody {
  id: string
  displayName?: string
  primaryEmail?: string
  phoneNumber?: string
  avatarUrl?: string | null
  roles?: UserRole[] | null
  status?: User['status']
}

const isUserStatus = (value: unknown): value is NonNullable<User['status']> =>
  value === 'active' || value === 'inactive'

const validate = (payload: UserUpdateBody): string | null => {
  if (!payload?.id) return 'id is required'
  if (payload.status && !isUserStatus(payload.status)) return 'status must be active or inactive'
  if (payload.roles && !Array.isArray(payload.roles)) return 'roles must be an array of UserRole'
  return null
}

const handle = async (
  req: ApiRequest<UserUpdateBody>
): Promise<ApiResult> => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validate(req.body)
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

  let current: User
  try {
    current = rowToUser(existingRow as any)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid user record returned from Supabase', details: (parseError as Error).message },
    }
  }

  const updated: User = {
    ...current,
    displayName: req.body.displayName?.trim() ?? current.displayName,
    primaryEmail: req.body.primaryEmail?.trim() ?? current.primaryEmail,
    phoneNumber: req.body.phoneNumber?.trim() ?? current.phoneNumber,
    avatarUrl: req.body.avatarUrl === null ? undefined : req.body.avatarUrl?.trim() ?? current.avatarUrl,
    roles: req.body.roles === null ? undefined : req.body.roles ?? current.roles,
    status: req.body.status ?? current.status,
    updatedAt: when(),
  }

  const { error: updateError } = await supabase
    .from('users')
    .update(mapUserToRow(updated))
    .eq('id', updated.id)

  if (updateError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to update user', details: updateError.message },
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: updated } }
}

export default withNetlify(handle)
