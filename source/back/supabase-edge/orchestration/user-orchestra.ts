/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User orchestra                                                               ║
║ Shared orchestration for privileged user edge functions.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides administrator authorization over the shared edge caller handshake and
synchronizes Supabase Auth identities with domain user rows. Auth access is
revoked before domain mutation, and domain user writes use the service-role
client because users-table RLS grants no direct writes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserIdRequest           Request payload containing a User id.
UserEdgeContext         Authorized edge invocation context.
UserOrchestraContract   User orchestration contract.
UserOrchestra           User orchestration singleton.
*/

import { Config } from '@back/supabase-edge/config/supabase-config.ts'
import { type DeleteResult } from '@core/api/api-contract.ts'
import { Supabase } from '@core/db/supabase.ts'
import { type EdgeClients, makeSupabaseEdgeAuth } from '@core/service/make-supabase-edge-auth.ts'
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
import { AdapterPatch, HttpCodes, type HttpRequest } from '@core/stdx'
import { type User } from '@domain/abstractions/user.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'
import { validateUserCreate, validateUserUpdate } from '@domain/validators/user-validator.ts'
import { type SupabaseClient } from '@supabase/client'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ────────────────────────────────────────────────────────────────────────────

/** Request payload containing a User id. */
export type UserIdRequest = Instance

/** Authorized edge invocation context. */
export type UserEdgeContext = EdgeClients & { caller: User }

/** User orchestration contract. */
export interface UserOrchestraContract {
  authorizeAdmin(request: HttpRequest): Promise<UserEdgeContext>
  create(input: UserCreate, context: UserEdgeContext): Promise<User>
  update(input: UserUpdate, context: UserEdgeContext): Promise<User>
  delete(input: UserIdRequest, context: UserEdgeContext): Promise<DeleteResult>
  eject(input: UserIdRequest, context: UserEdgeContext): Promise<User>
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/** User orchestration singleton. */
export const UserOrchestra: UserOrchestraContract = {
  async authorizeAdmin(request: HttpRequest): Promise<UserEdgeContext> {
    const { authUserId, ...clients } = await EdgeAuth.verifyCaller(request)
    const caller = await callerUserRow(clients.callerClient, authUserId)
    if (caller.status !== 'active' || !caller.roles.includes('administrator')) {
      throw new HttpServiceError(HttpCodes.forbidden, 'Administrator authorization required')
    }

    return { caller, ...clients }
  },

  async create(input: UserCreate, context: UserEdgeContext): Promise<User> {
    const user = userFromCreate(input)
    await createAuthUser(context, user)

    try {
      return await insertUserRow(context.serviceClient, user)
    } catch (error) {
      await compensateAuthUser(context, user.id)
      throw error
    }
  },

  async update(input: UserUpdate, context: UserEdgeContext): Promise<User> {
    const previousEmail = input.primaryEmail !== undefined
      ? (await getUserRow(context.serviceClient, input.id)).primaryEmail
      : undefined

    const user = await updateUserRow(context.serviceClient, input)
    if (previousEmail === undefined) return user

    try {
      await updateAuthEmail(context, user)
      return user
    } catch (error) {
      await compensateEmailUpdate(context.serviceClient, input.id, previousEmail)
      throw error
    }
  },

  async delete(input: UserIdRequest, context: UserEdgeContext): Promise<DeleteResult> {
    const id = requireId(input)
    await getUserRow(context.serviceClient, id)
    await deleteAuthUser(context, id)
    return deleteUserRow(context.serviceClient, id)
  },

  async eject(input: UserIdRequest, context: UserEdgeContext): Promise<User> {
    const id = requireId(input)
    await getUserRow(context.serviceClient, id)
    await deleteAuthUser(context, id)
    return ejectUserRow(context.serviceClient, id)
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
  if (error) throw new HttpServiceError(statusFromAuth(error), 'Failed to create auth user')
}

// an already-revoked identity is not an error: eject precedes delete in normal flows
const deleteAuthUser = async (context: UserEdgeContext, id: Id): Promise<void> => {
  const { error } = await context.serviceClient.auth.admin.deleteUser(id)
  if (error && statusFromAuth(error) !== HttpCodes.notFound) {
    throw new HttpServiceError(statusFromAuth(error), 'Failed to delete auth user')
  }
}

// compensation must never mask the original failure
const compensateAuthUser = async (context: UserEdgeContext, id: Id): Promise<void> => {
  const { error } = await context.serviceClient.auth.admin.deleteUser(id)
  if (error) console.error('Auth user compensation failed:', id, error)
}

// compensation must never mask the original failure
const compensateEmailUpdate = async (
  client: SupabaseClient,
  id: Id,
  previousEmail: string
): Promise<void> => {
  const { error } = await client
    .from('users')
    .update({ primary_email: previousEmail, updated_at: when() })
    .eq('id', id)
    .is('deleted_at', null)
  if (error) console.error('Domain email compensation failed:', id, error)
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
  if (error) throw new HttpServiceError(statusFromAuth(error), 'Failed to update auth user')
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
  if (updateError) {
    throw new HttpServiceError(statusFromSupabase(updateError), 'Failed to update user')
  }
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

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ────────────────────────────────────────────────────────────────────────────

const EdgeAuth = makeSupabaseEdgeAuth({
  url: Config.get('SUPABASE_URL'),
  publicKey: Config.get('SUPABASE_PUBLIC_KEY'),
  serviceKey: Config.get('SUPABASE_SERVICE_KEY')
})

// an authenticated identity without an active domain row is not an administrator
const callerUserRow = async (client: SupabaseClient, id: Id): Promise<User> => {
  try {
    return await getUserRow(client, id)
  } catch {
    throw new HttpServiceError(HttpCodes.forbidden, 'Administrator authorization required')
  }
}

const requireId = (input: unknown): Id => {
  const body = input as Dictionary
  const error = expectId(body['id'], 'id')
  if (error) throw new HttpServiceError(HttpCodes.unprocessableEntity, error)
  return body['id'] as Id
}

const statusFromSupabase = (error: { code?: string; status?: number }): number => {
  if (error.status) return error.status
  return Supabase.errorToStatus(error as Parameters<typeof Supabase.errorToStatus>[0])
}

const statusFromAuth = (error: { status?: number }): number => error.status ?? HttpCodes.conflict
