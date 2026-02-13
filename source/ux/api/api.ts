/**
 * Typed SDK for User operations against the serverless runtime.
 */

import type { User } from '@domain/abstractions/user.ts'
import type { UserCreateInput, UserUpdateInput } from '@domain/protocol/user-protocol.ts'
import { makeApiClient } from './api-client.ts'

const api = {
  Users: makeApiClient<User, UserCreateInput, UserUpdateInput>({ basePath: '/api/users' })
}

export { api }
