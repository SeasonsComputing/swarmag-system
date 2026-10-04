/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User manager                                                                 ║
║ User management provider.                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes the User workbench with its collection, draft state, and Direct writes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserManagerProps  Route modal cancellation contract.
UserManager       User management workbench.
*/

import type { User } from '@domain/abstractions/user.ts'
import { api } from '@front/api/api.ts'
import { scopes } from '@front/api/form-scopes.ts'
import { For, Show } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'
import type { AbstractionManagerContract } from '@ux/shell/workbench/abstraction-manager-contract.ts'
import { AbstractionManager } from '@ux/shell/workbench/abstraction-manager.tsx'
import { UiAlert, UiLayout, UiTableCell, UiText } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { createUserState, userDraft } from './user-state.ts'
import type { UserDraft } from './user-state.ts'
import { UserStepDetail } from './user-step-detail.tsx'

import './user-manager.css'

/** Props for the user manager route modal. */
export type UserManagerProps = {
  onCancel: () => void
}

/** User manager component. */
export const UserManager = (props: UserManagerProps): UiComponent => {
  const scope = scopes.Users.detail
  const usersQuery = createQuery(() => ({ queryKey: USERS_QUERY_KEY, queryFn: loadUsers }))

  const userManager: AbstractionManagerContract<User, UserDraft> = {
    formTitle: 'User Manager',
    entityLabel: 'User',
    listColumns: ['User', 'Active'],
    list: () => usersQuery.data ?? [],
    isListLoading: () => usersQuery.isPending,
    itemLabel: user => user.displayName,
    refresh: async () => {
      await usersQuery.refetch()
    },
    create: draft => api.Users.create(scope.toCreate(draft)),
    update: (user, draft) => api.Users.update(scope.toUpdate(user.id, draft)),
    actions: [
      {
        name: 'delete',
        label: 'Delete',
        icon: 'minus',
        confirmation: {
          title: 'Delete user?',
          message: user =>
            `Delete ${user.displayName} and remove their application access? This cannot be undone.`
        },
        handler: async user => {
          await api.Users.delete(user.id)
        }
      },
      {
        name: 'eject',
        label: 'Eject',
        icon: 'exit',
        confirmation: {
          title: 'Eject user?',
          message: user =>
            `Eject ${user.displayName}? This removes their sign-in identity and marks the user inactive.`
        },
        handler: async user => {
          await api.Users.eject(user.id)
        }
      }
    ],
    renderListCells: user => <UserListCells user={user} />,
    detail: user => {
      const state = createUserState(user)
      return {
        steps: [{
          name: 'detail',
          title: 'User details',
          render: context => <UserStepDetail context={context} state={state} />
        }],
        draft: () => userDraft(state)
      }
    }
  }

  return (
    <div data-app='users-page'>
      <Show when={usersQuery.error}>
        <UiAlert variant='danger'>{errorMessage(usersQuery.error)}</UiAlert>
      </Show>
      <AbstractionManager onCancel={props.onCancel} provider={userManager} />
    </div>
  )
}

/** Query key for the users list. */
const USERS_QUERY_KEY = ['users'] as const

/** Loads the user list for the user manager. */
async function loadUsers(): Promise<User[]> {
  const result = await api.Users.list({ limit: 100 })
  return result.data
}

/** Renders table cells for one user. */
function UserListCells(props: { user: User }): UiComponent {
  return (
    <>
      <UiTableCell>
        <UiLayout variant='block-fit' gap='none'>
          <span>{props.user.displayName}</span>
          <span data-app='user-list-email'>{props.user.primaryEmail}</span>
          <span data-app='user-list-roles'>
            <For each={props.user.roles}>
              {(role, index) => (
                <>
                  {index() > 0 ? ', ' : ''}
                  <span data-app='user-list-role'>{UiText.label(role)}</span>
                </>
              )}
            </For>
          </span>
        </UiLayout>
      </UiTableCell>
      <UiTableCell>
        <span data-app='user-status-pill' data-app-status={props.user.status}>
          <span
            aria-label={UiText.label(props.user.status)}
            data-app='user-status'
            role='img'
            title={UiText.label(props.user.status)}
          />
        </span>
      </UiTableCell>
    </>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'User operation failed.'
}
