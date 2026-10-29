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
USERS_QUERY_KEY   TanStack Query cache key for the User collection.
UserManagerProps  Props for the User Manager route workbench.
└ onCancel        Return to the dashboard.
UserManager       User collection and editor host.
*/

import { listAll } from '@core/stdx'
import type { User } from '@domain/abstractions/user.ts'
import { api } from '@front/api/api.ts'
import { scopes } from '@front/api/scopes.ts'
import { StatusBadge } from '@front/app/shell/status-badge.tsx'
import { createQuery } from '@tanstack/solid-query'
import { PanelRowIdentity } from '@ux/shell/panel/panel-row-identity.tsx'
import type { AbstractionManagerContract } from '@ux/shell/workbench/abstraction-manager-contract.ts'
import { AbstractionManager } from '@ux/shell/workbench/abstraction-manager.tsx'
import { UiText } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { createUserState, userDraft } from './user-state.ts'
import type { UserDraft } from './user-state.ts'
import { UserStepDetail } from './user-step-detail.tsx'

import './user-manager.css'

/** TanStack Query cache key for the User collection. */
export const USERS_QUERY_KEY = ['users'] as const

/** Props for the User Manager route workbench. */
export type UserManagerProps = {
  onCancel: () => void
}

/** User collection and editor host. */
export const UserManager = (props: UserManagerProps): UiComponent => {
  const scope = scopes.Users.detail
  const loadUsers = (): Promise<User[]> => Array.fromAsync(listAll(api.Users))
  const usersQuery = createQuery(() => ({
    queryKey: USERS_QUERY_KEY,
    queryFn: loadUsers
  }))

  const provider: AbstractionManagerContract<User, UserDraft> = {
    formTitle: 'User Manager',
    entityLabel: 'User',
    listColumns: [
      {
        label: 'User',
        render: user => (
          <PanelRowIdentity
            title={user.displayName}
            subtitle={user.primaryEmail}
            annotation={<UserListIdentity user={user} />}
          />
        )
      },
      {
        label: 'Active',
        align: 'center',
        render: user => (
          <StatusBadge
            variant={user.status === 'active' ? 'success' : 'warning'}
            icon={user.status === 'active' ? 'check' : 'minus'}
            label={UiText.label(user.status)}
          />
        )
      }
    ],
    list: () => usersQuery.data ?? [],
    isListLoading: () => usersQuery.isPending,
    listError: () => usersQuery.error,
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
      <AbstractionManager provider={provider} onCancel={props.onCancel} />
    </div>
  )
}

/** Supply the User identity's annotation content. */
function UserListIdentity(props: { user: User }): UiComponent {
  return <>{props.user.roles.map(UiText.label).join(', ')}</>
}
