/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User manager editor                                                          ║
║ User editor fields and draft projection for the User Manager.                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the mounted User Manager editor instance, owns field-local state and
validation rings, and exposes validation plus draft projection to the manager.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserDraft   Draft projected by the user editor.
UserEditor  User Manager editor form.
*/

import { expectEmail, expectNonEmptyString, toEmail, toTrimmed } from '@core/std'
import {
  CONTACT_PREFERRED_CHANNELS,
  type ContactPreferredChannel,
  type Note
} from '@domain/abstractions/common.ts'
import {
  type User,
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus
} from '@domain/abstractions/user.ts'
import type { UserCreate } from '@domain/protocols/user-protocol.ts'
import type { AbstractionEditorContext } from '@front/ux/shell/abstraction-manager-contract.ts'
import { useAbstractionFormFeedback } from '@front/ux/shell/use-abstraction-form-feedback.ts'
import { useAbstractionFormKeyboard } from '@front/ux/shell/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@front/ux/shell/use-abstraction-form-validation.ts'
import {
  type UiComponent,
  UiField,
  UiFieldset,
  UiInput,
  UiLayout,
  UiMultiSelect,
  UiSingleSelect,
  UiText,
  UiTextArea,
  UiToggleGroup,
  UiToggleItem
} from '@front/ux/ui'
import { createEffect, createSignal, For, onCleanup, onMount } from '@solid-js'

/** Draft projected by the user editor. */
export type UserDraft = UserCreate

/** Renders the create or edit form for one user. */
export function UserEditor(props: {
  context: AbstractionEditorContext<UserDraft>
  user: User | null
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
  let formRef: HTMLFormElement | undefined
  useAbstractionFormFeedback(() => formRef, props.context.feedback)
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
  })

  const userDraft = (): UserDraft => ({
    displayName: toTrimmed(displayName()),
    primaryEmail: toEmail(primaryEmail()),
    phoneNumber: toTrimmed(phoneNumber()),
    preferredChannel: preferredChannel(),
    notes: nextNotes(props.user?.notes ?? []),
    roles: roles(),
    status: status()
  })
  const submit = (event: SubmitEvent): void => {
    event.preventDefault()
  }

  //
  // Value Projections:
  // - preferredChannelOptions: Preferred channel options -> UiText.label
  // - roleOptions: Role options -> UiText.label
  // - nextNotes: Flattened into text
  //

  const preferredChannelOptions = CONTACT_PREFERRED_CHANNELS.map(value => ({
    value,
    label: UiText.label(value)
  }))
  const roleOptions = USER_ROLES.map(value => ({
    value,
    label: UiText.label(value)
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
  const checkEditor = (): boolean => {
    const nativeValid = formRef?.reportValidity() ?? true
    const fieldsValid = validation.validateForm()
    return nativeValid && fieldsValid
  }

  onMount(() => {
    const unregister = props.context.register({
      validate: checkEditor,
      draft: userDraft
    })
    onCleanup(unregister)
  })

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
                disabled={props.context.saving()}
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
                disabled={props.context.saving()}
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
                disabled={props.context.saving()}
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
                disabled={props.context.saving()}
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
                disabled={props.context.saving()}
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
                disabled={props.context.saving()}
              />
            </UiField>
            <UiField variant='caption' label='Status'>
              <UiToggleGroup<UserStatus>
                value={status()}
                onChange={setStatus}
                disabled={props.context.saving()}
              >
                <For each={USER_STATUSES}>
                  {value => (
                    <UiToggleItem value={value}>
                      <span data-app='user-option-label'>{UiText.label(value)}</span>
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
