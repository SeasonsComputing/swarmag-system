/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Users form                                                                   ║
║ User management provider for the generic abstraction form shell.             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Lists users and provides edit, deactivate, activate, delete, and staged create
form behavior for the Administration application.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UsersForm  User management form component.
*/

import {
  type User,
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus
} from '@domain/abstractions/user.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'
import { createEffect, createSignal, For, Show } from '@solid-js'
import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query'
import { api } from '@ux/api'
import {
  UiActionButton,
  UiAlert,
  UiBadge,
  UiButton,
  UiCard,
  UiCheckbox,
  type UiComponent,
  UiField,
  UiFormActions,
  UiInput,
  UiLayout,
  UiTableCell,
  UiTableRow,
  UiToggleGroup,
  UiToggleItem
} from '@ux/common/components/ui'
import type { AbstractionFormContract } from '@ux/common/shell/abstraction-form-contract.ts'
import { AbstractionForm } from '@ux/common/shell/abstraction-form.tsx'

import './users.css'

const USERS_QUERY_KEY = ['users'] as const

/** Props for the user management form route modal. */
export type UsersFormProps = {
  onCancel: () => void
}

/** User management form component. */
export const UsersForm = (props: UsersFormProps): UiComponent => {
  const queryClient = useQueryClient()
  const usersQuery = createQuery(() => ({
    queryKey: USERS_QUERY_KEY,
    queryFn: loadUsers
  }))
  const deleteUserMutation = createMutation(() => ({
    mutationFn: (id: User['id']) => api.Users.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    }
  }))
  const ejectUser = async (user: User): Promise<void> => {
    await deleteUserMutation.mutateAsync(user.id)
  }

  const provider: AbstractionFormContract<User> = {
    entityLabel: 'User',
    listColumns: ['Name', 'Email', 'Roles', 'Status', 'Actions'],
    list: () => usersQuery.data ?? [],
    isListLoading: () => usersQuery.isPending,
    renderListRow: (user, onSelect) => (
      <UserListRow
        user={user}
        onEject={ejectUser}
        onSelect={onSelect}
      />
    ),
    renderForm: (user, onClose) => (
      <UserEditor
        user={user}
        onClose={user === null ? props.onCancel : onClose}
      />
    )
  }

  return (
    <div data-feat='users-page'>
      <UiLayout>
        <Show when={usersQuery.error}>
          <UiAlert variant='danger'>{errorMessage(usersQuery.error)}</UiAlert>
        </Show>
        <AbstractionForm provider={provider} />
      </UiLayout>
    </div>
  )
}

async function loadUsers(): Promise<User[]> {
  const result = await api.Users.list({ limit: 100 })
  return result.data
}

function UserListRow(props: {
  user: User
  onEject: (user: User) => Promise<void>
  onSelect: (user: User) => void
}): UiComponent {
  return (
    <UiTableRow onClick={() => props.onSelect(props.user)}>
      <UiTableCell>{props.user.displayName}</UiTableCell>
      <UiTableCell>{props.user.primaryEmail}</UiTableCell>
      <UiTableCell>
        <div data-feat='user-role-list'>
          <For each={props.user.roles}>
            {role => <UiBadge variant='info'>{role}</UiBadge>}
          </For>
        </div>
      </UiTableCell>
      <UiTableCell>
        <UiBadge variant={props.user.status === 'active' ? 'success' : 'warning'}>
          {props.user.status}
        </UiBadge>
      </UiTableCell>
      <UiTableCell align='end'>
        <UiActionButton
          icon='eject'
          label='Eject'
          variant='danger'
          onClick={() => void props.onEject(props.user)}
        />
        <UiActionButton icon='edit' label='Edit' onClick={() => props.onSelect(props.user)} />
      </UiTableCell>
    </UiTableRow>
  )
}

function UserEditor(props: {
  user: User | null
  onClose: () => void
}): UiComponent {
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = createSignal(props.user?.displayName ?? '')
  const [primaryEmail, setPrimaryEmail] = createSignal(props.user?.primaryEmail ?? '')
  const [phoneNumber, setPhoneNumber] = createSignal(props.user?.phoneNumber ?? '')
  const [roles, setRoles] = createSignal<UserRole[]>(props.user ? [...props.user.roles] : [])
  const [status, setStatus] = createSignal<UserStatus>(props.user?.status ?? 'active')
  const [pending, setPending] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  createEffect(() => {
    setDisplayName(props.user?.displayName ?? '')
    setPrimaryEmail(props.user?.primaryEmail ?? '')
    setPhoneNumber(props.user?.phoneNumber ?? '')
    setRoles(props.user ? [...props.user.roles] : [])
    setStatus(props.user?.status ?? 'active')
    setError(null)
  })

  const existing = (): boolean => props.user !== null
  const toggleRole = (role: UserRole, pressed: boolean): void => {
    if (pressed) {
      if (!roles().includes(role)) setRoles([...roles(), role])
      return
    }

    setRoles(roles().filter(value => value !== role))
  }
  const createUserMutation = createMutation(() => ({
    mutationFn: (input: UserCreate) => api.Users.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    }
  }))
  const updateUserMutation = createMutation(() => ({
    mutationFn: (input: UserUpdate) => api.Users.update(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    }
  }))

  const save = async (): Promise<void> => {
    if (pending()) return
    if (roles().length === 0) {
      setError('Select at least one role.')
      return
    }

    setPending(true)
    setError(null)
    try {
      if (props.user) await updateUser(props.user, status())
      else await createUser()
      props.onClose()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setPending(false)
    }
  }

  const updateUser = async (user: User, nextStatus: UserStatus): Promise<void> => {
    const update: UserUpdate = {
      id: user.id,
      displayName: displayName(),
      phoneNumber: phoneNumber(),
      roles: roles(),
      status: nextStatus
    }
    await updateUserMutation.mutateAsync(update)
  }

  const createUser = async (): Promise<void> => {
    const create: UserCreate = {
      displayName: displayName(),
      primaryEmail: primaryEmail(),
      phoneNumber: phoneNumber(),
      roles: roles(),
      status: status()
    }
    await createUserMutation.mutateAsync(create)
  }

  const submit = (event: SubmitEvent): void => {
    event.preventDefault()
    void save()
  }

  return (
    <UiCard variant='workflow'>
      <form onSubmit={submit}>
        <UiLayout>
          <Show when={error() !== null}>
            <UiAlert variant='danger'>{error()}</UiAlert>
          </Show>

          <UiField for='displayName' label='Name'>
            <UiInput
              name='displayName'
              value={displayName()}
              onInput={event => setDisplayName(event.currentTarget.value)}
              disabled={pending()}
              required
            />
          </UiField>

          <UiField for='primaryEmail' label='Email'>
            <Show
              when={!existing()}
              fallback={
                <UiInput
                  name='primaryEmail'
                  type='email'
                  value={props.user?.primaryEmail ?? ''}
                  readOnly
                />
              }
            >
              <UiInput
                name='primaryEmail'
                type='email'
                value={primaryEmail()}
                onInput={event => setPrimaryEmail(event.currentTarget.value)}
                disabled={pending()}
                required
              />
            </Show>
          </UiField>

          <UiField for='phoneNumber' label='Phone'>
            <UiInput
              name='phoneNumber'
              type='tel'
              value={phoneNumber()}
              onInput={event => setPhoneNumber(event.currentTarget.value)}
              disabled={pending()}
              required
            />
          </UiField>

          <UiField variant='caption' label='Roles'>
            <div data-feat='user-option-row'>
              <For each={USER_ROLES}>
                {role => (
                  <UiCheckbox
                    name='roles'
                    value={role}
                    checked={roles().includes(role)}
                    onChange={checked => toggleRole(role, checked)}
                    disabled={pending()}
                  >
                    <span data-feat='user-option-label'>{role}</span>
                  </UiCheckbox>
                )}
              </For>
            </div>
          </UiField>

          <UiField variant='caption' label='Status'>
            <div data-feat='user-option-row'>
              <UiToggleGroup<UserStatus>
                value={status()}
                onChange={setStatus}
                disabled={pending()}
              >
                <For each={USER_STATUSES}>
                  {value => (
                    <UiToggleItem value={value}>
                      <span data-feat='user-option-label'>{value}</span>
                    </UiToggleItem>
                  )}
                </For>
              </UiToggleGroup>
            </div>
          </UiField>

          <UiFormActions>
            <UiButton type='button' variant='ghost' onClick={props.onClose} disabled={pending()}>
              Cancel
            </UiButton>
            <UiButton type='submit' variant='primary' loading={pending()}>
              Save
            </UiButton>
          </UiFormActions>
        </UiLayout>
      </form>
    </UiCard>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'User operation failed.'
}
