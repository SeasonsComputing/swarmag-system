/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User draft state                                                             ║
║ Feature-local signals for one User workbench draft.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds transient state for one User draft and projects its declared fields.
Notes remain an isolated collection with their original metadata.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
UserDraft        Fields edited by the User surface.
userDraft        Project state into a domain-shaped draft.
UserState        Reactive state contract for the User step.
createUserState  Create state for a single User draft.
*/

import { toEmail, toTrimmed } from '@core/std'
import type { DraftOf } from '@core/stdx'
import type { ContactPreferredChannel, Note } from '@domain/abstractions/common.ts'
import type { User, UserRole, UserStatus } from '@domain/abstractions/user.ts'
import type { scopes } from '@front/api/form-scopes.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'
import { copyDraft } from '@ux/shell/workbench/workbench-draft.ts'

/** Domain fields owned by the User workbench. */
export type UserDraft = DraftOf<typeof scopes.Users.detail>

/** Project User fields, preserving each note and its metadata. */
export const userDraft = (state: UserState): UserDraft => {
  return copyDraft({
    displayName: toTrimmed(state.displayName()),
    primaryEmail: toEmail(state.primaryEmail()),
    phoneNumber: toTrimmed(state.phoneNumber()),
    preferredChannel: state.preferredChannel(),
    notes: state.notes(),
    roles: state.roles(),
    status: state.status()
  })
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
  notes: Accessor<readonly Note[]>
  setNotes: (notes: readonly Note[]) => void
  roles: Accessor<UserRole[]>
  setRoles: (roles: UserRole[]) => void
  status: Accessor<UserStatus>
  setStatus: Setter<UserStatus>
}

/**
 * Create one User draft lifetime independently of mounted step controls.
 * @param user The opened User, or null for a new draft.
 * @returns Signals and an isolated notes collection.
 */
export const createUserState = (user: User | null): UserState => {
  const [displayName, setDisplayName] = createSignal(user?.displayName ?? '')
  const [primaryEmail, setPrimaryEmail] = createSignal(user?.primaryEmail ?? '')
  const [phoneNumber, setPhoneNumber] = createSignal(user?.phoneNumber ?? '')
  const [preferredChannel, setPreferredChannel] = createSignal<ContactPreferredChannel>(
    user?.preferredChannel ?? 'email'
  )
  const [notes, setNotes] = createSignal<readonly Note[]>(copyDraft(user?.notes ?? []))
  const [roles, setRoles] = createSignal<UserRole[]>(copyDraft([...(user?.roles ?? [])]))
  const [status, setStatus] = createSignal<UserStatus>(user?.status ?? 'active')
  return {
    displayName,
    setDisplayName,
    primaryEmail,
    setPrimaryEmail,
    phoneNumber,
    setPhoneNumber,
    preferredChannel,
    setPreferredChannel,
    notes,
    setNotes: notes => setNotes(copyDraft(notes)),
    roles,
    setRoles: roles => setRoles(copyDraft(roles)),
    status,
    setStatus
  }
}
