/**
 * Typed SDK for User operations against the serverless runtime.
 */

import { makeApiClient } from '@api/lib/api-client-binding.ts'
import type { User } from '@domain/abstractions/common.ts'
import type { UserCreateInput, UserUpdateInput } from '@domain/protocol/common-protocol.ts'

const UsersApi = makeApiClient<User, UserCreateInput, UserUpdateInput>({
  basePath: '/api/users'
})

export { UsersApi }
