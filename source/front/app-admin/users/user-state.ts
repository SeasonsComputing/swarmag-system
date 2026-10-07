/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User draft state                                                             ║
║ Feature-local signals for one User workbench draft.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds transient state for one User draft and projects its declared fields.
The notes text area flattens notes while keeping the first note's timestamp.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserDraft        Fields edited by the User surface.
userDraft        Project state into a domain-shaped draft.
UserState        Reactive state contract for the User step.
createUserState  Create state for a single User draft.
*/

import { toEmail, toTrimmed, when } from '@core/std'
import type { When } from '@core/std'
import type { DraftOf } from '@core/stdx'
import type { ContactPreferredChannel, Note } from '@domain/abstractions/common.ts'
import type { User, UserRole, UserStatus } from '@domain/abstractions/user.ts'
import type { scopes } from '@front/api/form-scopes.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'

/** Domain fields owned by the User workbench. */
export type UserDraft = DraftOf<typeof scopes.Users.detail>

/** Project User fields, flattening the notes text with its stable timestamp. */
export const userDraft = (state: UserState): UserDraft => {
  const content = state.notesText().trim()
  return {
    displayName: toTrimmed(state.displayName()),
    primaryEmail: toEmail(state.primaryEmail()),
    phoneNumber: toTrimmed(state.phoneNumber()),
    preferredChannel: state.preferredChannel(),
    notes: content.length === 0 ? [] : [{
      attachments: [],
      createdAt: state.noteCreatedAt,
      content,
      visibility: 'internal'
    }],
    roles: state.roles(),
    status: state.status()
  }
}

/** Reactive state used by the User workbench for one draft lifetime. */
export type UserState = {
  displayName: Accessor<string>
  setDisplayName: Setter<string>
  primaryEmail: Accessor<string>
  setPrimaryEmail: Setter<string>
  phoneNumber: Accessor<string>
  setPhoneNumber: Setter<string>
  preferredChannel: Accessor<ContactPreferredChannel>
  setPreferredChannel: Setter<ContactPreferredChannel>
  notesText: Accessor<string>
  setNotesText: Setter<string>
  noteCreatedAt: When
  roles: Accessor<UserRole[]>
  setRoles: Setter<UserRole[]>
  status: Accessor<UserStatus>
  setStatus: Setter<UserStatus>
}

/**
 * Create one User draft lifetime independently of mounted step controls.
 * @param user The opened User, or null for a new draft.
 * @returns Signals and the stable timestamp used by the notes text area.
 */
export const createUserState = (user: User | null): UserState => {
  const [displayName, setDisplayName] = createSignal(user?.displayName ?? '')
  const [primaryEmail, setPrimaryEmail] = createSignal(user?.primaryEmail ?? '')
  const [phoneNumber, setPhoneNumber] = createSignal(user?.phoneNumber ?? '')
  const [preferredChannel, setPreferredChannel] = createSignal<ContactPreferredChannel>(
    user?.preferredChannel ?? 'email'
  )
  const [notesText, setNotesText] = createSignal(noteContent(user?.notes ?? []))
  const [roles, setRoles] = createSignal<UserRole[]>(user ? [...user.roles] : [])
  const [status, setStatus] = createSignal<UserStatus>(user?.status ?? 'active')
  const noteCreatedAt = user?.notes[0]?.createdAt ?? when()
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
    noteCreatedAt,
    roles,
    setRoles,
    status,
    setStatus
  }
}

function noteContent(notes: readonly Note[]): string {
  return notes
    .map(note => note.content)
    .filter(content => content.length > 0)
    .join('\n\n')
}
