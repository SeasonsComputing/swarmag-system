/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Make auth users API                                                          ║
║ CRUD contract wrapper for auth-synchronized user mutations.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Preserves the standard Users CRUD surface while encapsulating user/auth
synchronization behind the topic API implementation.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AuthUsersContract  Users API contract with auth synchronization operations.
makeAuthUsers      Build the auth-synchronized Users CRUD client, validated before
                   dispatch even though create/update proxy to edge functions.
*/

import type {
  CrudBaseContract,
  CrudListContract,
  DeleteResult,
  ListOptions,
  ListResult,
  PinnedUpdateContract
} from '@core/api/api-contract.ts'
import { checkValidatorError } from '@core/api/api-contract.ts'
import {
  makeBusRuleSupabaseEdgeClient,
  makeBusRuleSupabaseRpcClient,
  makeCrudSupabaseClient
} from '@core/client/make-supabase-client.ts'
import type { CreateFromInstantiable, Dictionary, FromInstantiable, Id, ScopedUpdate } from '@core/std'
import type { User } from '@domain/abstractions/user.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'
import { validateUserCreate, validateUserUpdate } from '@domain/validators/user-validator.ts'

type AllUserKeys = Extract<keyof typeof UserAdapter, keyof FromInstantiable<User>>

/** Users API contract with auth synchronization operations. */
export type AuthUsersContract =
  & CrudBaseContract<User>
  & PinnedUpdateContract<User, AllUserKeys>
  & CrudListContract<User>
  & {
    eject(id: Id): Promise<User>
    hasAccess(email: string): Promise<boolean>
  }

/** Build the auth-synchronized Users CRUD client. */
export const makeAuthUsers = (): AuthUsersContract => {
  const users = makeCrudSupabaseClient<User>({
    table: 'users',
    adapter: UserAdapter,
    validator: {
      validateCreate: validateUserCreate,
      validateUpdate: validateUserUpdate
    }
  })
  const create = makeBusRuleSupabaseEdgeClient<Dictionary, User>({ fn: 'user-create' })
  const update = makeBusRuleSupabaseEdgeClient<Dictionary, User>({ fn: 'user-update' })
  const remove = makeBusRuleSupabaseEdgeClient<Dictionary, DeleteResult>({ fn: 'user-delete' })
  const eject = makeBusRuleSupabaseEdgeClient<Dictionary, User>({ fn: 'user-eject' })
  const hasAccess = makeBusRuleSupabaseRpcClient<{ email: string }, boolean>({ fn: 'user_has_access' })

  return {
    /**
     * Validate, then create a domain user and provision a Supabase Auth identity.
     * @param input User creation payload.
     * @returns The newly created domain user.
     */
    create: (input: CreateFromInstantiable<User>): Promise<User> => {
      checkValidatorError(validateUserCreate(input))
      return create.run(input as Dictionary)
    },

    /**
     * Delete a domain user and revoke the Supabase Auth identity.
     * @param id Id of the user to delete.
     * @returns Deletion result.
     */
    delete: (id: Id): Promise<DeleteResult> => remove.run({ id }),

    /**
     * Eject a user by revoking Auth access while preserving domain history.
     * @param id Id of the user to eject.
     * @returns The updated inactive domain user.
     */
    eject: (id: Id): Promise<User> => eject.run({ id }),

    /**
     * Retrieve a domain user by id.
     * @param id Id of the user to retrieve.
     * @returns The domain user.
     */
    get: (id: Id): Promise<User> => users.get(id),

    /**
     * List domain users.
     * @param options Optional pagination and filter options.
     * @returns Paginated list result.
     */
    list: (options?: ListOptions): Promise<ListResult<User>> => users.list(options),

    /**
     * Check whether an email belongs to an active registered user.
     * @param input Email access-check payload.
     * @returns True when the email may start OTP login.
     */
    hasAccess: (email: string): Promise<boolean> => hasAccess.run({ email }),

    /**
     * Validate, then update a domain user and synchronize the Supabase Auth identity.
     * @param input User update payload.
     * @returns The updated domain user.
     */
    update: (input: ScopedUpdate<User, AllUserKeys>): Promise<User> => {
      checkValidatorError(validateUserUpdate(input))
      return update.run(input as Dictionary)
    }
  }
}
