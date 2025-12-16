/**
 * Netlify handler for soft-deleting users.
 */

import type { User } from '@domain/common'
import { when } from '@utils/datetime'
import { Supabase } from '@core/platform/supabase'
import {
  HttpCodes,
  type ApiRequest,
  type ApiResult,
} from '@core/platform/api-binding'
import { withNetlify } from '@core/platform/netlify'
import { mapUserToRow, rowToUser } from '@core/api/user-mapping'

interface UserDeleteBody { id: string }

const handle = async (
  req: ApiRequest<UserDeleteBody>
): Promise<ApiResult> => {
  if (req.method !== 'DELETE') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  if (!req.body?.id) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: 'id is required' } }
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
    user = rowToUser(existingRow as any)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid user record returned from Supabase', details: (parseError as Error).message },
    }
  }

  const deletedAt = when()
  const updated: User = { ...user, deletedAt, updatedAt: deletedAt }

  const { error: updateError } = await supabase
    .from('users')
    .update(mapUserToRow(updated))
    .eq('id', user.id)

  if (updateError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to delete user', details: updateError.message },
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: { id: user.id, deletedAt } } }
}

export default withNetlify(handle)
