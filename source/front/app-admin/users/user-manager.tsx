/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User manager                                                                 ║
║ User management provider.                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import type { User } from '@domain/abstractions/user.ts'
import { api } from '@front/api/api.ts'
import { type UserDraft, UserEditor } from '@front/app-admin/users/user-manager-editor.tsx'
import type { AbstractionManagerContract } from '@front/ux/shell/abstraction-manager-contract.ts'
import { AbstractionManager } from '@front/ux/shell/abstraction-manager.tsx'
import { labelFromKebabCase, UiAlert, type UiComponent, UiLayout, UiTableCell } from '@front/ux/ui'
import { For, Show } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'

import './user-manager.css'

/** Loads the user list for the user manager. */
async function loadUsers(): Promise<User[]> {
  const result = await api.Users.list({ limit: 100 })
  return result.data
}

/** Query key for the users list. */
const USERS_QUERY_KEY = ['users'] as const

/** Props for the user manager route modal. */
export type UserManagerProps = {
  onCancel: () => void
}

/** User manager component. */
export const UserManager = (props: UserManagerProps): UiComponent => {
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
    create: draft => api.Users.create(draft),
    update: (user, draft) =>
      api.Users.update({
        id: user.id,
        ...draft
      }),
    actions: [
      {
        name: 'delete',
        label: 'Delete',
        icon: 'trash',
        variant: 'danger',
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
        variant: 'danger',
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
    renderForm: (user, context) => <UserEditor context={context} user={user} />
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
                  <span data-app='user-list-role'>{labelFromKebabCase(role)}</span>
                </>
              )}
            </For>
          </span>
        </UiLayout>
      </UiTableCell>
      <UiTableCell>
        <span data-app='user-status-pill' data-app-status={props.user.status}>
          <span
            aria-label={labelFromKebabCase(props.user.status)}
            data-app='user-status'
            role='img'
            title={labelFromKebabCase(props.user.status)}
          />
        </span>
      </UiTableCell>
    </>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'User operation failed.'
}
