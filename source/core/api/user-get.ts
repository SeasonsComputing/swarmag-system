import type { User } from '@domain/common'
import { Supabase } from '@core/platform/binding'
import {
  HttpCodes,
  type ApiRequest,
  type ApiResult,
  withNetlify,
} from '@core/platform/netlify'
import { rowToUser } from '@core/api/user-mapping'

type UserGetQuery = { id?: string }

const handle = async (
  req: ApiRequest<undefined, UserGetQuery>
): Promise<ApiResult> => {
  if (req.method !== 'GET') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const userId = req.query?.id
  if (!userId) {
    return { statusCode: HttpCodes.badRequest, body: { error: 'id is required' } }
  }

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
    user = rowToUser(data as any)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid user record returned from Supabase', details: (parseError as Error).message },
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: user } }
}

export default withNetlify(handle)
