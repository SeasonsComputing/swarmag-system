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

import type { Id } from '@core/std'
import {
  type User,
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus
} from '@domain/abstractions/user.ts'
import type { UserCreate, UserUpdate } from '@domain/protocols/user-protocol.ts'
import { createSignal, For, Show } from '@solid-js'
import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query'
import { api } from '@ux/api'
import {
  UiAlert,
  UiBadge,
  UiButton,
  UiCard,
  type UiComponent,
  UiDialog,
  UiField,
  UiFormActions,
  UiInput,
  UiLayout,
  UiMultiSelect,
  UiSingleSelect,
  UiTableCell,
  UiTableRow
} from '@ux/common/components/ui'
import type { AbstractionFormContract } from '@ux/common/shell/abstraction-form-contract.ts'
import { AbstractionForm } from '@ux/common/shell/abstraction-form.tsx'

import './users.css'

const roleOptions = USER_ROLES.map(value => ({ value }))
const statusOptions = USER_STATUSES.map(value => ({ value }))
const USERS_QUERY_KEY = ['users'] as const

/** User management form component. */
export const UsersForm = (): UiComponent => {
  const usersQuery = createQuery(() => ({
    queryKey: USERS_QUERY_KEY,
    queryFn: loadUsers
  }))

  const provider: AbstractionFormContract<User> = {
    entityLabel: 'User',
    listColumns: ['Name', 'Email', 'Roles', 'Status', 'Actions'],
    list: () => usersQuery.data ?? [],
    isListLoading: () => usersQuery.isPending,
    renderListRow: user => <UserListRow user={user} />,
    renderForm: (user, onClose) => <UserEditor user={user} onClose={onClose} />
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

function UserListRow(props: { user: User }): UiComponent {
  const [open, setOpen] = createSignal(false)
  const close = (): void => {
    setOpen(false)
  }

  return (
    <UiTableRow>
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
        <UiDialog
          trigger='Edit'
          triggerVariant='secondary'
          open={open()}
          onOpenChange={setOpen}
        >
          <UserEditor user={props.user} onClose={close} />
        </UiDialog>
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
  const [roles, setRoles] = createSignal<string[]>(props.user ? [...props.user.roles] : [])
  const [status, setStatus] = createSignal<UserStatus>(props.user?.status ?? 'active')
  const [pending, setPending] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const existing = (): boolean => props.user !== null
  const modeLabel = (): string => existing() ? 'Edit User' : 'Add User'
  const statusActionLabel = (): string => status() === 'active' ? 'Deactivate' : 'Activate'
  const createUserMutation = createMutation(() => ({
    mutationFn: (input: UserCreate) => api.userCreateSynchAuth.run(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    }
  }))
  const updateUserMutation = createMutation(() => ({
    mutationFn: (input: UserUpdate) => api.userUpdateSynchAuth.run(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    }
  }))
  const revokeUserMutation = createMutation(() => ({
    mutationFn: (input: { id: Id }) => api.userRevokeAuth.run(input),
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
      roles: roles() as UserRole[],
      status: nextStatus
    }
    await updateUserMutation.mutateAsync(update)
  }

  const createUser = async (): Promise<void> => {
    const create: UserCreate = {
      displayName: displayName(),
      primaryEmail: primaryEmail(),
      phoneNumber: phoneNumber(),
      roles: roles() as UserRole[],
      status: status()
    }
    await createUserMutation.mutateAsync(create)
  }

  const toggleStatus = async (): Promise<void> => {
    if (!props.user || pending()) return
    const nextStatus = status() === 'active' ? 'inactive' : 'active'
    setStatus(nextStatus)
    setPending(true)
    setError(null)
    try {
      await updateUser(props.user, nextStatus)
      props.onClose()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setPending(false)
    }
  }

  const remove = async (): Promise<void> => {
    if (!props.user || pending()) return
    setPending(true)
    setError(null)
    try {
      await revokeUserMutation.mutateAsync({ id: props.user.id })
      props.onClose()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setPending(false)
    }
  }

  const submit = (event: SubmitEvent): void => {
    event.preventDefault()
    void save()
  }

  return (
    <UiCard variant='workflow'>
      <form onSubmit={submit}>
        <UiLayout>
          <h2>{modeLabel()}</h2>

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
            <UiMultiSelect
              name='roles'
              options={roleOptions}
              value={roles()}
              onChange={setRoles}
              disabled={pending()}
              error={roles().length === 0}
            />
          </UiField>

          <UiField for='status' label='Status'>
            <UiSingleSelect
              name='status'
              options={statusOptions}
              value={status()}
              onChange={value => setStatus(value as UserStatus)}
              disabled={pending()}
            />
          </UiField>

          <UiFormActions>
            <UiButton type='submit' variant='primary' loading={pending()}>
              Save
            </UiButton>
            <UiButton type='button' variant='ghost' onClick={props.onClose} disabled={pending()}>
              Cancel
            </UiButton>
            <Show when={existing()}>
              <UiButton
                type='button'
                variant='secondary'
                onClick={() => void toggleStatus()}
                loading={pending()}
              >
                {statusActionLabel()}
              </UiButton>
              <UiButton type='button' variant='danger' onClick={() => void remove()} loading={pending()}>
                Delete
              </UiButton>
            </Show>
          </UiFormActions>
        </UiLayout>
      </form>
    </UiCard>
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'User operation failed.'
}
