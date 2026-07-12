/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User manager                                                                 ║
║ User management provider.                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import type { Note } from '@domain/abstractions/common.ts'
import {
  CONTACT_PREFERRED_CHANNELS,
  type ContactPreferredChannel,
  type User,
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus
} from '@domain/abstractions/user.ts'
import { type UserCreate, type UserUpdate } from '@domain/protocols/user-protocol.ts'
import { createEffect, createSignal, For, Show } from '@solid-js'
import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query'
import { api } from '@ux/api'
import {
  UiAlert,
  UiBadge,
  type UiComponent,
  UiField,
  UiFieldset,
  UiInput,
  UiLayout,
  UiMultiSelect,
  UiSingleSelect,
  UiTableCell,
  UiTextArea,
  UiToggleGroup,
  UiToggleItem
} from '@ux/common/components/ui'
import type { AbstractionManagerContract } from '@ux/common/shell/abstraction-manager-contract.ts'
import { AbstractionManager } from '@ux/common/shell/abstraction-manager.tsx'

/** Loads the user list for the user manager. */
async function loadUsers(): Promise<User[]> {
  const result = await api.Users.list({ limit: 100 })
  return result.data
}

/** Props for the user manager route modal. */
export type UserManagerProps = {
  onCancel: () => void
}

/** User manager component. */
const USERS_QUERY_KEY = ['users'] as const
export const UserManager = (props: UserManagerProps): UiComponent => {
  const queryClient = useQueryClient()
  const usersQuery = createQuery(() => ({ queryKey: USERS_QUERY_KEY, queryFn: loadUsers }))
  const deleteUserMutation = createMutation(() => ({
    mutationFn: (id: User['id']) => api.Users.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    }
  }))
  const ejectUserMutation = createMutation(() => ({
    mutationFn: (id: User['id']) => api.Users.eject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    }
  }))
  const deleteUser = async (user: User): Promise<void> => {
    await deleteUserMutation.mutateAsync(user.id)
  }
  const ejectUser = async (user: User): Promise<void> => {
    await ejectUserMutation.mutateAsync(user.id)
  }

  const userManager: AbstractionManagerContract<User> = {
    formTitle: 'User Manager',
    entityLabel: 'User',
    listColumns: ['Name', 'Email', 'Roles', 'Status'],
    list: () => usersQuery.data ?? [],
    isListLoading: () => usersQuery.isPending,
    cancel: props.onCancel,
    actions: [
      {
        name: 'delete',
        label: 'Delete',
        icon: 'delete',
        variant: 'danger',
        handler: deleteUser
      },
      {
        name: 'eject',
        label: 'Eject',
        icon: 'eject',
        variant: 'danger',
        handler: ejectUser
      }
    ],
    renderListCells: user => <UserListCells user={user} />,
    renderForm: (user, onClose) => (
      <UserEditor
        user={user}
        onClose={user === null ? props.onCancel : onClose}
      />
    )
  }
  return (
    <div data-feat='users-page'>
      <Show when={usersQuery.error}>
        <UiAlert variant='danger'>{errorMessage(usersQuery.error)}</UiAlert>
      </Show>
      <AbstractionManager provider={userManager} />
    </div>
  )
}

/** Renders table cells for one user. */
function UserListCells(props: { user: User }): UiComponent {
  return (
    <>
      <UiTableCell>{props.user.displayName}</UiTableCell>
      <UiTableCell>{props.user.primaryEmail}</UiTableCell>
      <UiTableCell>
        <UiLayout variant='inline' gap='tight'>
          <For each={props.user.roles}>
            {role => <UiBadge variant='info'>{enumDisplayLabel(role)}</UiBadge>}
          </For>
        </UiLayout>
      </UiTableCell>
      <UiTableCell>
        <UiBadge variant={props.user.status === 'active' ? 'success' : 'warning'}>
          {enumDisplayLabel(props.user.status)}
        </UiBadge>
      </UiTableCell>
    </>
  )
}

/** Renders the create or edit form for one user. */
function UserEditor(props: {
  user: User | null
  onClose: () => void
}): UiComponent {
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = createSignal(props.user?.displayName ?? '')
  const [primaryEmail, setPrimaryEmail] = createSignal(props.user?.primaryEmail ?? '')
  const [phoneNumber, setPhoneNumber] = createSignal(props.user?.phoneNumber ?? '')
  const [preferredChannel, setPreferredChannel] = createSignal<ContactPreferredChannel>(
    props.user?.preferredChannel ?? 'email'
  )
  const [notesText, setNotesText] = createSignal(noteContent(props.user?.notes ?? []))
  const [roles, setRoles] = createSignal<UserRole[]>(props.user ? [...props.user.roles] : [])
  const [status, setStatus] = createSignal<UserStatus>(props.user?.status ?? 'active')
  const [pending, setPending] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  createEffect(() => {
    setDisplayName(props.user?.displayName ?? '')
    setPrimaryEmail(props.user?.primaryEmail ?? '')
    setPhoneNumber(props.user?.phoneNumber ?? '')
    setPreferredChannel(props.user?.preferredChannel ?? 'email')
    setNotesText(noteContent(props.user?.notes ?? []))
    setRoles(props.user ? [...props.user.roles] : [])
    setStatus(props.user?.status ?? 'active')
    setError(null)
  })

  //
  // Mutations:
  // - `createUserMutation`: Creates a new user.
  // - `updateUserMutation`: Updates the user.
  //

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

  //
  // Handlers:
  // - `toggleRole`: Toggles a role for the user.
  // - `saveUser`: Saves the user.
  // - `updateUser`: Updates the user.
  // - `createUser`: Creates a new user.
  //

  const saveUser = async (): Promise<void> => {
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
      preferredChannel: preferredChannel(),
      notes: nextNotes(user.notes),
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
      preferredChannel: preferredChannel(),
      notes: nextNotes([]),
      roles: roles(),
      status: status()
    }
    await createUserMutation.mutateAsync(create)
  }
  const submit = (event: SubmitEvent): void => {
    event.preventDefault()
    void saveUser()
  }

  const existing = (): boolean => props.user !== null
  const preferredChannelOptions = CONTACT_PREFERRED_CHANNELS.map(value => ({
    value,
    label: enumDisplayLabel(value)
  }))
  const roleOptions = USER_ROLES.map(value => ({
    value,
    label: enumDisplayLabel(value)
  }))
  const nextNotes = (existingNotes: readonly Note[]): Note[] => {
    const content = notesText().trim()
    if (content.length === 0) return []
    return [{
      attachments: [],
      createdAt: existingNotes[0]?.createdAt ?? new Date().toISOString(),
      content,
      visibility: 'internal',
      tags: []
    }]
  }

  return (
    <form id='abstraction-panel-form' onSubmit={submit}>
      <UiLayout>
        <Show when={error() !== null}>
          <UiAlert variant='danger'>{error()}</UiAlert>
        </Show>
        <UiFieldset legend='Identity'>
          <UiLayout>
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
          </UiLayout>
        </UiFieldset>
        <UiFieldset legend='Contact Preferences'>
          <UiLayout>
            <UiField for='preferredChannel' label='Preferred Channel'>
              <UiSingleSelect
                name='preferredChannel'
                options={preferredChannelOptions}
                value={preferredChannel()}
                onChange={value => setPreferredChannel(value as ContactPreferredChannel)}
                disabled={pending()}
              />
            </UiField>
          </UiLayout>
        </UiFieldset>
        <UiFieldset legend='Notes'>
          <UiLayout>
            <UiField for='notes' label='Notes'>
              <UiTextArea
                name='notes'
                rows={5}
                value={notesText()}
                onInput={event => setNotesText(event.currentTarget.value)}
                disabled={pending()}
              />
            </UiField>
          </UiLayout>
        </UiFieldset>
        <UiFieldset legend='Access'>
          <UiLayout>
            <UiField variant='caption' label='Roles'>
              <UiMultiSelect
                name='roles'
                options={roleOptions}
                value={roles()}
                onChange={value => setRoles(value as UserRole[])}
                disabled={pending()}
              />
            </UiField>
            <UiField variant='caption' label='Status'>
              <UiToggleGroup<UserStatus>
                value={status()}
                onChange={setStatus}
                disabled={pending()}
              >
                <For each={USER_STATUSES}>
                  {value => (
                    <UiToggleItem value={value}>
                      <span data-feat='user-option-label'>{enumDisplayLabel(value)}</span>
                    </UiToggleItem>
                  )}
                </For>
              </UiToggleGroup>
            </UiField>
          </UiLayout>
        </UiFieldset>
      </UiLayout>
    </form>
  )
}

function noteContent(notes: readonly Note[]): string {
  return notes
    .map(note => note.content)
    .filter(content => content.length > 0)
    .join('\n\n')
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'User operation failed.'
}

function enumDisplayLabel(value: string): string {
  return value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
