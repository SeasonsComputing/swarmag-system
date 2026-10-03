/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User detail step                                                             ║
║ User step fields and draft projection for the User Manager.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the User detail step against host-owned state and registers mounted
validation.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserDetailKeys  Fields owned by the User detail form.
UserDraft        Draft projected by User state.
createUserState  Create signals and a stable draft projection.
UserStepDetail  User Manager detail step.
*/

import { expectEmail, expectNonEmptyString, toEmail, toTrimmed } from '@core/std'
import type { ScopedUpdate } from '@core/std'
import { CONTACT_PREFERRED_CHANNELS } from '@domain/abstractions/common.ts'
import type { ContactPreferredChannel, Note } from '@domain/abstractions/common.ts'
import { USER_ROLES, USER_STATUSES } from '@domain/abstractions/user.ts'
import type { User, UserRole, UserStatus } from '@domain/abstractions/user.ts'
import { scopes } from '@front/api/form-scopes.ts'
import { createSignal, For, onCleanup } from '@solid-js'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { useAbstractionFormFeedback } from '@ux/shell/workbench/use-abstraction-form-feedback.ts'
import { useAbstractionFormKeyboard } from '@ux/shell/workbench/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@ux/shell/workbench/use-abstraction-form-validation.ts'
import {
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
} from '@ux/ui'
import type { UiComponent } from '@ux/ui'

/** Fields owned by the User detail form. */
export type UserDetailKeys = (typeof scopes.Users.detail)[number]['key']

/** Draft projected by the User detail state. */
export type UserDraft = Omit<ScopedUpdate<User, UserDetailKeys>, 'id'>

/** Create one User draft lifetime, independently of mounted step controls. */
export const createUserState = (user: User | null) => {
  const [displayName, setDisplayName] = createSignal(user?.displayName ?? '')
  const [primaryEmail, setPrimaryEmail] = createSignal(user?.primaryEmail ?? '')
  const [phoneNumber, setPhoneNumber] = createSignal(user?.phoneNumber ?? '')
  const [preferredChannel, setPreferredChannel] = createSignal<ContactPreferredChannel>(
    user?.preferredChannel ?? 'email'
  )
  const [notesText, setNotesText] = createSignal(noteContent(user?.notes ?? []))
  const [roles, setRoles] = createSignal<UserRole[]>(user ? [...user.roles] : [])
  const [status, setStatus] = createSignal<UserStatus>(user?.status ?? 'active')
  const noteCreatedAt = user?.notes[0]?.createdAt ?? new Date().toISOString()
  const nextNotes = (existingNotes: readonly Note[]): Note[] => {
    const content = notesText().trim()
    if (content.length === 0) return []
    return [{
      attachments: [],
      createdAt: existingNotes[0]?.createdAt ?? noteCreatedAt,
      content,
      visibility: 'internal',
      tags: []
    }]
  }
  const userDraft = (): UserDraft => ({
    displayName: toTrimmed(displayName()),
    primaryEmail: toEmail(primaryEmail()),
    phoneNumber: toTrimmed(phoneNumber()),
    preferredChannel: preferredChannel(),
    notes: nextNotes(user?.notes ?? []),
    roles: roles(),
    status: status()
  })
  return {
    displayName,
    setDisplayName,
    primaryEmail,
    setPrimaryEmail,
    phoneNumber,
    setPhoneNumber,
    preferredChannel,
    setPreferredChannel,
    notesText,
    setNotesText,
    roles,
    setRoles,
    status,
    setStatus,
    draft: userDraft
  }
}

/** Renders the create or edit step for one user. */
export function UserStepDetail(props: {
  context: PanelStepContext
  state: ReturnType<typeof createUserState>
}): UiComponent {
  const {
    displayName,
    setDisplayName,
    primaryEmail,
    setPrimaryEmail,
    phoneNumber,
    setPhoneNumber,
    preferredChannel,
    setPreferredChannel,
    notesText,
    setNotesText,
    roles,
    setRoles,
    status,
    setStatus
  } = props.state
  let formRef: HTMLFormElement | undefined
  useAbstractionFormFeedback(() => formRef, props.context.feedback)
  const validation = useAbstractionFormValidation(() => formRef, {
    displayName: () => expectNonEmptyString(displayName(), 'Name'),
    primaryEmail: () => expectEmail(toEmail(primaryEmail()), 'Email'),
    phoneNumber: () => expectNonEmptyString(phoneNumber(), 'Phone'),
    roles: () => roles().length > 0 ? null : 'Select at least one role.'
  })
  useAbstractionFormKeyboard(() => formRef, field => validation.blurField(field))

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
  const checkStep = (): boolean => {
    const nativeValid = formRef?.reportValidity() ?? true
    const fieldsValid = validation.validateForm()
    return nativeValid && fieldsValid
  }

  onCleanup(props.context.registerValidation(checkStep))

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
                disabled={props.context.busy()}
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
                disabled={props.context.busy()}
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
                disabled={props.context.busy()}
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
                disabled={props.context.busy()}
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
                disabled={props.context.busy()}
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
                disabled={props.context.busy()}
              />
            </UiField>
            <UiField variant='caption' label='Status'>
              <UiToggleGroup<UserStatus>
                value={status()}
                onChange={setStatus}
                disabled={props.context.busy()}
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
