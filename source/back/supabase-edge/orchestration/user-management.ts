/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User management orchestration                                                ║
║ Shared orchestration for privileged user-management edge functions.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides Config-backed Supabase clients, caller verification, administrator
authorization, validation, and user row operations for user edge functions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserIdRequest             Request payload containing a User id.
UserEdgeContext           Authorized edge invocation context.
UserManagementContract    User-management orchestration contract.
UserManagement            User-management orchestration singleton.
*/

import { Config } from '@back/supabase-edge/config/supabase-config.ts'
import { type DeleteResult } from '@core/api/api-contract.ts'
import { Supabase } from '@core/db/supabase.ts'
import { HttpServiceError } from '@core/service/wrap-busrule-http-handler.ts'
import {
  type CreateFromInstantiable,
  type Dictionary,
  expectId,
  type Id,
  type Instance,
  instantiable,
  type UpdateFromInstantiable,
  type When,
  when
} from '@core/std'
import { AdapterPatch, HEADER_AUTHORIZATION, HttpCodes, type HttpRequest } from '@core/stdx'
import { type User } from '@domain/abstractions/user.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'
import { validateUserCreate, validateUserUpdate } from '@domain/validators/user-validator.ts'
import { createClient, type SupabaseClient } from '@supabase/client'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ────────────────────────────────────────────────────────────────────────────

/** Request payload containing a User id. */
export type UserIdRequest = Instance

/** Authorized edge invocation context. */
export type UserEdgeContext = {
  caller: User
  callerClient: SupabaseClient
  serviceClient: SupabaseClient
}

/** User-management orchestration contract. */
export interface UserManagementContract {
  authorizeAdmin(request: HttpRequest): Promise<UserEdgeContext>
  create(input: UserCreate, context: UserEdgeContext): Promise<User>
  update(input: UserUpdate, context: UserEdgeContext): Promise<User>
  delete(input: UserIdRequest, context: UserEdgeContext): Promise<DeleteResult>
  eject(input: UserIdRequest, context: UserEdgeContext): Promise<User>
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/** User-management orchestration singleton. */
export const UserManagement: UserManagementContract = {
  async authorizeAdmin(request: HttpRequest): Promise<UserEdgeContext> {
    const authorization = request.headers[HEADER_AUTHORIZATION]
    const token = bearerToken(authorization)
    if (!token) throw new HttpServiceError(HTTP_UNAUTHORIZED, 'Authentication required')

    const serviceClient = serviceSupabaseClient()
    const { data, error } = await serviceClient.auth.getUser(token)
    if (error || !data.user) throw new HttpServiceError(HTTP_UNAUTHORIZED, 'Authentication required')

    const callerClient = callerSupabaseClient(authorization)
    const caller = await getUserRow(callerClient, data.user.id as Id)
    if (caller.status !== 'active' || !caller.roles.includes('administrator')) {
      throw new HttpServiceError(HTTP_FORBIDDEN, 'Administrator authorization required')
    }

    return { caller, callerClient, serviceClient }
  },

  async create(input: UserCreate, context: UserEdgeContext): Promise<User> {
    const user = userFromCreate(input)
    await createAuthUser(context, user)

    try {
      return await insertUserRow(context.callerClient, user)
    } catch (error) {
      await deleteAuthUser(context, user.id)
      throw error
    }
  },

  async update(input: UserUpdate, context: UserEdgeContext): Promise<User> {
    const user = await updateUserRow(context.callerClient, input)
    if (input.primaryEmail !== undefined) await updateAuthEmail(context, user)
    return user
  },

  async delete(input: UserIdRequest, context: UserEdgeContext): Promise<DeleteResult> {
    const id = requireId(input)
    const result = await deleteUserRow(context.callerClient, id)
    await deleteAuthUser(context, id)
    return result
  },

  async eject(input: UserIdRequest, context: UserEdgeContext): Promise<User> {
    const id = requireId(input)
    const user = await ejectUserRow(context.callerClient, id)
    await deleteAuthUser(context, id)
    return user
  }
}

// ────────────────────────────────────────────────────────────────────────────
// AUTH ADMIN OPERATIONS
// ────────────────────────────────────────────────────────────────────────────

const createAuthUser = async (context: UserEdgeContext, user: User): Promise<void> => {
  const payload: Dictionary = {
    id: user.id,
    email: user.primaryEmail,
    email_confirm: true,
    user_metadata: { displayName: user.displayName }
  }
  const { error } = await context.serviceClient.auth.admin.createUser(
    payload as Parameters<typeof context.serviceClient.auth.admin.createUser>[0]
  )
  if (error) throw new HttpServiceError(HTTP_CONFLICT, 'Failed to create auth user')
}

const deleteAuthUser = async (context: UserEdgeContext, id: Id): Promise<void> => {
  const { error } = await context.serviceClient.auth.admin.deleteUser(id)
  if (error) throw new HttpServiceError(HTTP_CONFLICT, 'Failed to delete auth user')
}

const updateAuthEmail = async (context: UserEdgeContext, user: User): Promise<void> => {
  const payload: Dictionary = {
    email: user.primaryEmail,
    email_confirm: true
  }
  const { error } = await context.serviceClient.auth.admin.updateUserById(
    user.id,
    payload as Parameters<typeof context.serviceClient.auth.admin.updateUserById>[1]
  )
  if (error) throw new HttpServiceError(HTTP_CONFLICT, 'Failed to update auth user')
}

// ────────────────────────────────────────────────────────────────────────────
// DOMAIN USER OPERATIONS
// ────────────────────────────────────────────────────────────────────────────

const userFromCreate = (input: CreateFromInstantiable<User>): User => {
  const error = validateUserCreate(input)
  if (error) throw new HttpServiceError(HttpCodes.unprocessableEntity, error)
  return instantiable<User>(input)
}

const getUserRow = async (client: SupabaseClient, id: Id): Promise<User> => {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw new HttpServiceError(statusFromSupabase(error), 'Failed to get user')
  return UserAdapter.toDomain(data as Dictionary)
}

const insertUserRow = async (client: SupabaseClient, user: User): Promise<User> => {
  const record = UserAdapter.fromDomain(user as AdapterPatch<User>)
  const { data, error } = await client
    .from('users')
    .insert(record)
    .select()
    .single()
  if (error) throw new HttpServiceError(statusFromSupabase(error), 'Failed to create user')
  return UserAdapter.toDomain(data as Dictionary)
}

const updateUserRow = async (
  client: SupabaseClient,
  input: UpdateFromInstantiable<User>
): Promise<User> => {
  const error = validateUserUpdate(input)
  if (error) throw new HttpServiceError(HttpCodes.unprocessableEntity, error)

  const { id, ...patch } = input
  const record = UserAdapter.fromDomain(patch as AdapterPatch<User>)
  if (Object.keys(record).length === 0) return getUserRow(client, id)

  const { data, error: updateError } = await client
    .from('users')
    .update({ ...record, updated_at: when() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()
  if (updateError) throw new HttpServiceError(statusFromSupabase(updateError), 'Failed to update user')
  return UserAdapter.toDomain(data as Dictionary)
}

const deleteUserRow = async (client: SupabaseClient, id: Id): Promise<DeleteResult> => {
  const now = when()
  const { data, error } = await client
    .from('users')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, deleted_at')
    .single()
  if (error) throw new HttpServiceError(statusFromSupabase(error), 'Failed to delete user')
  const row = data as Dictionary
  return { id: row['id'] as Id, deletedAt: row['deleted_at'] as When }
}

const ejectUserRow = async (client: SupabaseClient, id: Id): Promise<User> => {
  const { data, error } = await client
    .from('users')
    .update({ status: 'inactive', updated_at: when() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()
  if (error) throw new HttpServiceError(statusFromSupabase(error), 'Failed to eject user')
  return UserAdapter.toDomain(data as Dictionary)
}

const requireId = (input: unknown): Id => {
  const body = input as Dictionary
  const error = expectId(body['id'], 'id')
  if (error) throw new HttpServiceError(HttpCodes.unprocessableEntity, error)
  return body['id'] as Id
}

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ────────────────────────────────────────────────────────────────────────────

const HTTP_UNAUTHORIZED = 401
const HTTP_FORBIDDEN = 403
const HTTP_CONFLICT = 409

const bearerToken = (authorization: string | undefined): string | null => {
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

const callerSupabaseClient = (authorization: string): SupabaseClient =>
  createClient(Config.get('SUPABASE_URL'), Config.get('SUPABASE_PUBLIC_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: authorization } }
  })

const serviceSupabaseClient = (): SupabaseClient =>
  createClient(Config.get('SUPABASE_URL'), Config.get('SUPABASE_SERVICE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })

const statusFromSupabase = (error: { code?: string; status?: number }): number => {
  if (error.status) return error.status
  return Supabase.errorToStatus(error as Parameters<typeof Supabase.errorToStatus>[0])
}
