/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User manager                                                                 ║
║ User management provider.                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { expectEmail, expectNonEmptyString, type Id, toEmail, toTrimmed } from '@core/std'
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
import { api } from '@front/api'
import type {
  AbstractionManagerContract,
  AbstractionManagerFeedback
} from '@front/ux/shell/abstraction-manager-contract.ts'
import { AbstractionManager } from '@front/ux/shell/abstraction-manager.tsx'
import {
  FORM_FEEDBACK_MESSAGE,
  useAbstractionFormFeedback
} from '@front/ux/shell/use-abstraction-form-feedback.ts'
import { useAbstractionFormKeyboard } from '@front/ux/shell/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@front/ux/shell/use-abstraction-form-validation.ts'
import { useAbstractionMutation } from '@front/ux/shell/use-abstraction-mutation.ts'
import {
  UiAlert,
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
} from '@front/ux/ui'
import { createEffect, createSignal, For, Show } from '@solid-js'
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
  const [editorFeedback, setEditorFeedback] = createSignal<AbstractionManagerFeedback | null>(null)
  const usersQuery = createQuery(() => ({ queryKey: USERS_QUERY_KEY, queryFn: loadUsers }))
  const deleteUserMutation = useAbstractionMutation(USERS_QUERY_KEY, (id: Id) => api.Users.delete(id))
  const ejectUserMutation = useAbstractionMutation(USERS_QUERY_KEY, (id: Id) => api.Users.eject(id))

  const userManager: AbstractionManagerContract<User> = {
    formTitle: 'User Manager',
    entityLabel: 'User',
    listColumns: ['User', 'Active'],
    list: () => usersQuery.data ?? [],
    isListLoading: () => usersQuery.isPending,
    editorFeedback,
    cancel: props.onCancel,
    actions: [
      {
        name: 'delete',
        label: 'Delete',
        icon: 'delete',
        variant: 'danger',
        confirmation: {
          title: 'Delete user?',
          message: user =>
            `Delete ${user.displayName} and remove their application access? This cannot be undone.`
        },
        handler: async user => {
          await deleteUserMutation.mutateAsync(user.id)
        }
      },
      {
        name: 'eject',
        label: 'Eject',
        icon: 'eject',
        variant: 'danger',
        confirmation: {
          title: 'Eject user?',
          message: user =>
            `Eject ${user.displayName}? This removes their sign-in identity and marks the user inactive.`
        },
        handler: async user => {
          await ejectUserMutation.mutateAsync(user.id)
        }
      }
    ],
    renderListCells: user => <UserListCells user={user} />,
    renderForm: (user, onClose) => (
      <UserEditor
        user={user}
        onClose={user === null ? props.onCancel : onClose}
        onFeedback={setEditorFeedback}
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
      <UiTableCell>
        <UiLayout variant='block-fit' gap='none'>
          <span>{props.user.displayName}</span>
          <span data-feat='user-list-email'>{props.user.primaryEmail}</span>
          <span data-feat='user-list-roles'>
            <For each={props.user.roles}>
              {(role, index) => (
                <>
                  {index() > 0 ? ', ' : ''}
                  <span data-feat='user-list-role'>{enumDisplayLabel(role)}</span>
                </>
              )}
            </For>
          </span>
        </UiLayout>
      </UiTableCell>
      <UiTableCell>
        <span data-feat='user-status-pill' data-feat-status={props.user.status}>
          <span
            aria-label={enumDisplayLabel(props.user.status)}
            data-feat='user-status'
            role='img'
            title={enumDisplayLabel(props.user.status)}
          />
        </span>
      </UiTableCell>
    </>
  )
}

/** Renders the create or edit form for one user. */
function UserEditor(props: {
  user: User | null
  onClose: () => void
  onFeedback: (feedback: AbstractionManagerFeedback | null) => void
}): UiComponent {
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
  let formRef: HTMLFormElement | undefined
  useAbstractionFormFeedback(() => formRef, props.onFeedback)
  const validation = useAbstractionFormValidation(() => formRef, {
    displayName: () => expectNonEmptyString(displayName(), 'Name'),
    primaryEmail: () => expectEmail(toEmail(primaryEmail()), 'Email'),
    phoneNumber: () => expectNonEmptyString(phoneNumber(), 'Phone'),
    roles: () => roles().length > 0 ? null : 'Select at least one role.'
  })
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))

  createEffect(() => {
    setDisplayName(props.user?.displayName ?? '')
    setPrimaryEmail(props.user?.primaryEmail ?? '')
    setPhoneNumber(props.user?.phoneNumber ?? '')
    setPreferredChannel(props.user?.preferredChannel ?? 'email')
    setNotesText(noteContent(props.user?.notes ?? []))
    setRoles(props.user ? [...props.user.roles] : [])
    setStatus(props.user?.status ?? 'active')
    validation.reset()
    props.onFeedback(null)
  })

  //
  // Mutations:
  // - `createUserMutation`: Creates a new user.
  // - `updateUserMutation`: Updates the user.
  //

  const createUserMutation = useAbstractionMutation(
    USERS_QUERY_KEY,
    (input: UserCreate) => api.Users.create(input)
  )
  const updateUserMutation = useAbstractionMutation(
    USERS_QUERY_KEY,
    (input: UserUpdate) => api.Users.update(input)
  )

  //
  // Handlers:
  // - `saveUser`: Saves the user.
  // - `updateUser`: Updates the user.
  // - `createUser`: Creates a new user.
  //

  const saveUser = async (): Promise<void> => {
    if (pending()) return
    if (!validation.validateForm()) {
      props.onFeedback({ message: FORM_FEEDBACK_MESSAGE, variant: 'danger' })
      return
    }
    setPending(true)
    props.onFeedback(null)
    try {
      if (props.user) await updateUser(props.user, status())
      else await createUser()
      props.onClose()
    } catch (e) {
      props.onFeedback({ message: errorMessage(e), variant: 'danger' })
    } finally {
      setPending(false)
    }
  }
  const updateUser = async (user: User, nextStatus: UserStatus): Promise<void> => {
    const update: UserUpdate = {
      id: user.id,
      displayName: toTrimmed(displayName()),
      primaryEmail: toEmail(primaryEmail()),
      phoneNumber: toTrimmed(phoneNumber()),
      preferredChannel: preferredChannel(),
      notes: nextNotes(user.notes),
      roles: roles(),
      status: nextStatus
    }
    await updateUserMutation.mutateAsync(update)
  }
  const createUser = async (): Promise<void> => {
    const create: UserCreate = {
      displayName: toTrimmed(displayName()),
      primaryEmail: toEmail(primaryEmail()),
      phoneNumber: toTrimmed(phoneNumber()),
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

  //
  // Value Projections:
  // - preferredChannelOptions: Preferred channel options -> enumDisplayLabel
  // - roleOptions: Role options -> enumDisplayLabel
  // - nextNotes: Flattened into text
  //

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
    <form id='abstraction-panel-form' ref={formRef} onSubmit={submit}>
      <UiLayout>
        <UiFieldset legend='Identity'>
          <UiLayout>
            <UiField for='displayName' label='Name' required>
              <UiInput
                name='displayName'
                value={displayName()}
                onInput={event => {
                  setDisplayName(event.currentTarget.value)
                  validation.inputField('displayName')
                }}
                onBlur={() => validation.blurField('displayName')}
                error={validation.isInvalid('displayName')}
                disabled={pending()}
                required
              />
            </UiField>
            <UiField for='primaryEmail' label='Email' required>
              <UiInput
                name='primaryEmail'
                type='email'
                value={primaryEmail()}
                onInput={event => {
                  setPrimaryEmail(event.currentTarget.value)
                  validation.inputField('primaryEmail')
                }}
                onBlur={() => validation.blurField('primaryEmail')}
                error={validation.isInvalid('primaryEmail')}
                disabled={pending()}
                required
              />
            </UiField>
            <UiField for='phoneNumber' label='Phone' required>
              <UiInput
                name='phoneNumber'
                type='tel'
                value={phoneNumber()}
                onInput={event => {
                  setPhoneNumber(event.currentTarget.value)
                  validation.inputField('phoneNumber')
                }}
                onBlur={() => validation.blurField('phoneNumber')}
                error={validation.isInvalid('phoneNumber')}
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
            <UiField variant='caption' label='Roles' required>
              <UiMultiSelect
                name='roles'
                options={roleOptions}
                value={roles()}
                onChange={value => {
                  setRoles(value as UserRole[])
                  validation.changeField('roles')
                }}
                error={validation.isInvalid('roles')}
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
